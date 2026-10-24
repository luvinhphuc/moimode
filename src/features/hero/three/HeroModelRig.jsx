import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

import { MathUtils, Vector3 } from "../../../utils/three.js";
import { CAMERA } from "../config/sceneConfig.js";

function fitCameraToModel({ camera, height, radius, width }) {
	const viewportWidth = Math.max(width, 1);
	const viewportHeight = Math.max(height, 1);
	const aspect = viewportWidth / viewportHeight;
	const verticalFov = MathUtils.degToRad(camera.fov);
	const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * aspect);
	const limitingFov = Math.min(verticalFov, horizontalFov);
	const framing = viewportWidth < 768 ? 0.86 : 0.72;
	const distance = (radius / Math.sin(limitingFov / 2)) * framing;
	const direction = new Vector3(...CAMERA.direction).normalize();

	camera.position.set(
		direction.x * distance,
		direction.y * distance,
		direction.z * distance,
	);
	camera.near = Math.max(0.01, distance - radius * 3);
	camera.far = distance + radius * 8;
	camera.lookAt(0, 0, 0);
	camera.updateProjectionMatrix();
}

function HeroModelRig({ enablePointerMotion, model, pose, radius }) {
	const groupRef = useRef(null);
	const motionRef = useRef({ x: 0, y: 0 });
	const targetRef = useRef({ x: 0, y: 0 });
	const reducedMotionRef = useRef(false);
	const { camera, size } = useThree();
	const baseRotation = useMemo(
		() => pose.rotationDegrees.map(MathUtils.degToRad),
		[pose.rotationDegrees],
	);
	const rotationRef = useRef(baseRotation);

	useEffect(() => {
		rotationRef.current = baseRotation;
	}, [baseRotation]);

	useEffect(() => {
		const media = window.matchMedia("(prefers-reduced-motion: reduce)");
		const syncReducedMotion = () => {
			reducedMotionRef.current = media.matches;
		};
		const handlePointerMove = (event) => {
			if (
				!enablePointerMotion ||
				reducedMotionRef.current ||
				event.pointerType === "touch"
			)
				return;

			targetRef.current.x = MathUtils.clamp(
				(event.clientX / window.innerWidth) * 2 - 1,
				-1,
				1,
			);
			targetRef.current.y = MathUtils.clamp(
				(event.clientY / window.innerHeight) * 2 - 1,
				-1,
				1,
			);
		};
		const resetMotion = () => {
			targetRef.current.x = 0;
			targetRef.current.y = 0;
		};

		syncReducedMotion();
		media.addEventListener?.("change", syncReducedMotion);
		window.addEventListener("pointermove", handlePointerMove, {
			passive: true,
		});
		window.addEventListener("blur", resetMotion);

		return () => {
			media.removeEventListener?.("change", syncReducedMotion);
			window.removeEventListener("pointermove", handlePointerMove);
			window.removeEventListener("blur", resetMotion);
		};
	}, [enablePointerMotion]);

	useEffect(() => {
		fitCameraToModel({
			camera,
			height: size.height,
			radius,
			width: size.width,
		});
	}, [camera, radius, size.height, size.width]);

	useFrame((_, delta) => {
		if (!groupRef.current) return;

		const motion = motionRef.current;
		const target = reducedMotionRef.current
			? { x: 0, y: 0 }
			: targetRef.current;

		motion.x = MathUtils.damp(motion.x, target.x, 5, delta);
		motion.y = MathUtils.damp(motion.y, target.y, 5, delta);

		const [x, y, z] = rotationRef.current;

		groupRef.current.rotation.set(
			x - motion.y * 0.08,
			y + motion.x * 0.12,
			z - motion.x * 0.045,
		);
		groupRef.current.position.y = -motion.y * 0.008;
	});

	return (
		<group ref={groupRef}>
			<primitive object={model} dispose={null} />
		</group>
	);
}

export default HeroModelRig;
