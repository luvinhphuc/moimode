import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";

import {
	EdgesGeometry,
	LineBasicMaterial,
	LineSegments,
	Quaternion,
	Vector3,
} from "../../../utils/three.js";
import { CHARM_BY_ID } from "../config/customizerConfig.js";
import {
	getCharmOrientationQuaternion,
	normalizeCharmScene,
} from "../utils/charmModel.js";

const PLACEMENT_DURATION = 0.48;

function PlacedCharm({
	animateIn = true,
	animationDelay = 0,
	charmId,
	interactive,
	modelSize,
	onSelect,
	onReady,
	rotation = 0,
	selected = false,
	slot,
	startAnimation = true,
}) {
	const charm = CHARM_BY_ID[charmId];
	const { scene } = useGLTF(charm.url);
	useEffect(() => { onReady?.(slot.name); }, [onReady, slot.name]);
	const normalized = useMemo(
		() => normalizeCharmScene(scene, charm.orientation),
		[charm, scene],
	);
	useEffect(() => () => {
		normalized.object.traverse((object) => {
			if (!object.isMesh || !object.material) return;
			const materials = Array.isArray(object.material) ? object.material : [object.material];
			materials.forEach((material) => material.dispose());
		});
	}, [normalized.object]);
	const groupRef = useRef(null);
	const progressRef = useRef(0);
	const reducedMotionRef = useRef(false);
	const invalidate = useThree((state) => state.invalidate);

	useLayoutEffect(() => {
		if (!selected) return undefined;

		const outlines = [];
		normalized.object.traverse((object) => {
			if (!object.isMesh || !object.geometry) return;

			const outline = new LineSegments(
				new EdgesGeometry(object.geometry, 30),
				new LineBasicMaterial({
					color: "#00ff2f",
					depthTest: true,
					depthWrite: false,
					transparent: true,
					opacity: 0.95,
				}),
			);
			outline.name = "CharmSelectionOutline";
			outline.renderOrder = 1001;
			outline.raycast = () => null;
			object.add(outline);
			outlines.push({ object, outline });
		});
		invalidate();

		return () => {
			for (const { object, outline } of outlines) {
				object.remove(outline);
				outline.geometry.dispose();
				outline.material.dispose();
			}
			invalidate();
		};
	}, [invalidate, normalized.object, selected]);

	const targetQuaternion = useMemo(() => {
		const slotOut = new Vector3(0, 1, 0)
			.applyQuaternion(slot.quaternion)
			.normalize();
		const slotUp = new Vector3(0, 0, -1)
			.applyQuaternion(slot.quaternion)
			.normalize();

		const baseQuaternion = getCharmOrientationQuaternion(
			normalized.frontAxis,
			normalized.upAxis,
			slotOut,
			slotUp,
		);

		return new Quaternion()
			.setFromAxisAngle(slotOut, rotation)
			.multiply(baseQuaternion);
	}, [normalized.frontAxis, normalized.upAxis, rotation, slot.quaternion]);
	const targetScale = (modelSize * 0.11) / normalized.maxSize;
	const outward = useMemo(
		() => new Vector3(0, 1, 0).applyQuaternion(slot.quaternion).normalize(),
		[slot.quaternion],
	);
	const startPosition = useMemo(
		() =>
			slot.position
				.clone()
				.add(outward.clone().multiplyScalar(modelSize * 0.14)),
		[modelSize, outward, slot.position],
	);

	useLayoutEffect(() => {
		if (!animateIn) return;
		const media = window.matchMedia("(prefers-reduced-motion: reduce)");
		reducedMotionRef.current = media.matches;
		progressRef.current = startAnimation && media.matches
			? animationDelay + PLACEMENT_DURATION
			: 0;
		invalidate();
	}, [animateIn, animationDelay, charmId, invalidate, slot.name, startAnimation]);

	useFrame((_, delta) => {
		const group = groupRef.current;
		if (!group || !animateIn) return;
		if (!startAnimation) {
			group.position.copy(startPosition);
			group.scale.setScalar(0);
			return;
		}

		const end = animationDelay + PLACEMENT_DURATION;
		// A demand canvas may have been idle before this animation started.
		progressRef.current = Math.min(end, progressRef.current + Math.min(delta, 0.05));
		const raw = Math.max(
			0,
			Math.min(1, (progressRef.current - animationDelay) / PLACEMENT_DURATION),
		);
		const ease = 1 - (1 - raw) ** 3;
		const pop =
			raw > 0.78 && !reducedMotionRef.current
				? 1 + Math.sin(((raw - 0.78) / 0.22) * Math.PI) * 0.08
				: 1;

		group.position.lerpVectors(startPosition, slot.position, ease);
		group.scale.setScalar(targetScale * pop);
		if (progressRef.current < end) invalidate();
	});

	const interaction = interactive ? {
		onClick(event) {
			if (event.delta > 6) return;
			event.stopPropagation();
			onSelect(slot.name);
		},
		onPointerOut() {
			document.body.style.cursor = "";
		},
		onPointerOver(event) {
			event.stopPropagation();
			document.body.style.cursor = "pointer";
		},
	} : {};

	return (
		<group
			ref={groupRef}
			position={animateIn ? startPosition : slot.position}
			quaternion={targetQuaternion}
			scale={animateIn ? 0 : targetScale}
			{...interaction}
		>
			<primitive object={normalized.object} dispose={null} />
		</group>
	);
}

export default PlacedCharm;
