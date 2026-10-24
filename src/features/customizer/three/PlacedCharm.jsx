import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";

import { Vector3 } from "../../../utils/three.js";
import { CHARM_BY_ID } from "../config/customizerConfig.js";
import {
	getCharmOrientationQuaternion,
	normalizeCharmScene,
} from "../utils/charmModel.js";

function PlacedCharm({
	charmId,
	interactive,
	modelSize,
	onSelect,
	slot,
}) {
	const charm = CHARM_BY_ID[charmId];
	const { scene } = useGLTF(charm.url);
	const normalized = useMemo(
		() => normalizeCharmScene(scene, charm.orientation),
		[charm, scene],
	);
	const groupRef = useRef(null);
	const progressRef = useRef(0);
	const reducedMotionRef = useRef(false);

	const targetQuaternion = useMemo(
		() => {
			const slotOut = new Vector3(0, 1, 0)
				.applyQuaternion(slot.quaternion)
				.normalize();
			const slotUp = new Vector3(0, 0, -1)
				.applyQuaternion(slot.quaternion)
				.normalize();

			return getCharmOrientationQuaternion(
				normalized.frontAxis,
				normalized.upAxis,
				slotOut,
				slotUp,
			);
		},
		[normalized.frontAxis, normalized.upAxis, slot.quaternion],
	);
	const targetScale = (modelSize * 0.11) / normalized.maxSize;
	const outward = useMemo(
		() =>
			new Vector3(0, 1, 0)
				.applyQuaternion(slot.quaternion)
				.normalize(),
		[slot.quaternion],
	);
	const startPosition = useMemo(
		() =>
			slot.position
				.clone()
				.add(outward.clone().multiplyScalar(modelSize * 0.14)),
		[modelSize, outward, slot.position],
	);

	useEffect(() => {
		const media = window.matchMedia("(prefers-reduced-motion: reduce)");
		reducedMotionRef.current = media.matches;
		progressRef.current = media.matches ? 1 : 0;
	}, [charmId, slot.name]);

	useFrame((_, delta) => {
		const group = groupRef.current;
		if (!group) return;

		progressRef.current = Math.min(1, progressRef.current + delta / 0.48);
		const raw = progressRef.current;
		const ease = 1 - (1 - raw) ** 3;
		const pop =
			raw > 0.78 && !reducedMotionRef.current
				? 1 + Math.sin(((raw - 0.78) / 0.22) * Math.PI) * 0.08
				: 1;

		group.position.lerpVectors(startPosition, slot.position, ease);
		group.quaternion.copy(targetQuaternion);
		group.scale.setScalar(targetScale * pop);
	});

	return (
		<group
			ref={groupRef}
			position={startPosition}
			onClick={(event) => {
				if (!interactive || event.delta > 6) return;
				event.stopPropagation();
				onSelect(slot.name);
			}}
			onPointerOut={() => {
				document.body.style.cursor = "";
			}}
			onPointerOver={(event) => {
				if (!interactive) return;
				event.stopPropagation();
				document.body.style.cursor = "pointer";
			}}
		>
			<primitive object={normalized.object} dispose={null} />
		</group>
	);
}

export default PlacedCharm;
