import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
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

function PlacedCharm({
	animateIn = true,
	animationDelay = 0,
	charmId,
	interactive,
	modelSize,
	onSelect,
	rotation = 0,
	selected = false,
	slot,
	startAnimation = true,
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

	useEffect(() => {
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

		return () => {
			for (const { object, outline } of outlines) {
				object.remove(outline);
				outline.geometry.dispose();
				outline.material.dispose();
			}
		};
	}, [normalized.object, selected]);

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

	useEffect(() => {
		const media = window.matchMedia("(prefers-reduced-motion: reduce)");
		reducedMotionRef.current = media.matches;
		progressRef.current = startAnimation && media.matches
			? animationDelay + 0.48
			: 0;
	}, [animationDelay, charmId, slot.name, startAnimation]);

	useFrame((_, delta) => {
		const group = groupRef.current;
		if (!group) return;
		if (!animateIn) {
			group.position.copy(slot.position);
			group.quaternion.copy(targetQuaternion);
			group.scale.setScalar(targetScale);
			return;
		}

		if (!startAnimation) {
			group.position.copy(startPosition);
			group.quaternion.copy(targetQuaternion);
			group.scale.setScalar(0);
			return;
		}

		progressRef.current = Math.min(
			animationDelay + 0.48,
			progressRef.current + delta,
		);
		const raw = Math.max(
			0,
			Math.min(1, (progressRef.current - animationDelay) / 0.48),
		);
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
			position={animateIn ? startPosition : slot.position}
			scale={animateIn ? (startAnimation ? 1 : 0) : targetScale}
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
