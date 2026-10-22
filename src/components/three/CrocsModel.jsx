import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

import { CAMERA, CROCS_MODEL_URL, CROCS_POSE } from "./sceneConfig.js";

function CrocsModel({
	modelUrl = CROCS_MODEL_URL,
	onReady,
	pose = CROCS_POSE,
	enablePointerMotion = true,
}) {
	const { scene } = useGLTF(modelUrl);
	const groupRef = useRef(null);
	const motionRef = useRef({ x: 0, y: 0 });
	const targetRef = useRef({ x: 0, y: 0 });
	const reducedMotionRef = useRef(false);
	const { camera, size } = useThree();

	const model = useMemo(() => {
		const clone = scene.clone(true);
		const bounds = new THREE.Box3().setFromObject(clone);
		clone.position.sub(bounds.getCenter(new THREE.Vector3()));
		return clone;
	}, [scene]);

	const radius = useMemo(() => {
		const sphere = new THREE.Box3()
			.setFromObject(model)
			.getBoundingSphere(new THREE.Sphere());

		return sphere.radius || 1;
	}, [model]);

	const baseRotation = useMemo(
		() => pose.rotationDegrees.map(THREE.MathUtils.degToRad),
		[pose.rotationDegrees],
	);
	const rotationRef = useRef(baseRotation);

	useEffect(() => {
		rotationRef.current = baseRotation;
	}, [baseRotation]);

	useEffect(() => {
		window.setShoeRotation = (x, y, z) => {
			rotationRef.current = [x, y, z].map(THREE.MathUtils.degToRad);

			console.log("Crocs rotation:", { x, y, z });
		};

		return () => {
			delete window.setShoeRotation;
		};
	}, []);

	useEffect(() => {
		onReady?.(model);
	}, [model, onReady]);

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

			targetRef.current.x = THREE.MathUtils.clamp(
				(event.clientX / window.innerWidth) * 2 - 1,
				-1,
				1,
			);
			targetRef.current.y = THREE.MathUtils.clamp(
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
		const aspect = Math.max(size.width, 1) / Math.max(size.height, 1);
		const verticalFov = THREE.MathUtils.degToRad(camera.fov);
		const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * aspect);
		const limitingFov = Math.min(verticalFov, horizontalFov);
		const framing = window.innerWidth < 768 ? 0.76 : 0.82;
		const distance = (radius / Math.sin(limitingFov / 2)) * framing;
		const direction = new THREE.Vector3(...CAMERA.direction).normalize();

		camera.position.copy(direction.multiplyScalar(distance));
		camera.near = Math.max(0.01, distance - radius * 3);
		camera.far = distance + radius * 8;
		camera.lookAt(0, 0, 0);
		camera.updateProjectionMatrix();
	}, [camera, radius, size.height, size.width]);

	useFrame((_, delta) => {
		if (!groupRef.current) return;

		const motion = motionRef.current;
		const target = reducedMotionRef.current
			? { x: 0, y: 0 }
			: targetRef.current;

		motion.x = THREE.MathUtils.damp(motion.x, target.x, 5, delta);
		motion.y = THREE.MathUtils.damp(motion.y, target.y, 5, delta);

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

export default CrocsModel;
