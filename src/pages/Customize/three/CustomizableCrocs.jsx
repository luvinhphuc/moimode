import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useLoader, useThree } from "@react-three/fiber";
import { GLTFLoader } from "three-stdlib";
import { Color } from "three";

import { MODEL_ASSETS } from "../../../config/modelAssets.js";
import { gsap } from "../../../utils/gsap.js";
import { Box3, Quaternion, Vector3 } from "../../../utils/three.js";
import useFirstModelFrame from "../../../utils/useFirstModelFrame.js";
import PlacedCharm from "./PlacedCharm.jsx";

function cloneMaterials(root) {
	root.traverse((object) => {
		if (!object.isMesh || !object.material) return;
		object.material = Array.isArray(object.material)
			? object.material.map((material) => material.clone())
			: object.material.clone();
	});
}

function disposeClonedMaterials(root) {
	root.traverse((object) => {
		if (!object.isMesh || !object.material) return;
		const materials = Array.isArray(object.material) ? object.material : [object.material];
		materials.forEach((material) => material.dispose());
	});
}

function SlotMarker({ modelSize, onSelect, pulseKey, slot }) {
	const markerRef = useRef(null);
	const invalidate = useThree((state) => state.invalidate);
	useEffect(() => {
		if (!pulseKey || !markerRef.current || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		const marker = markerRef.current;
		const target = modelSize * 0.022;
		const tween = gsap.fromTo(marker.scale, { x: target * 0.6, y: target * 0.6, z: target * 0.6 }, {
			x: target, y: target, z: target, duration: 0.38, ease: "back.out(2)", overwrite: true, onUpdate: invalidate,
		});
		return () => tween.kill();
	}, [invalidate, modelSize, pulseKey]);
	return (
		<mesh
			ref={markerRef}
			position={slot.position}
			quaternion={slot.quaternion}
			scale={modelSize * 0.022}
			renderOrder={999}
			onClick={(event) => {
				if (event.delta > 6) return;
				event.stopPropagation();
				onSelect(slot.name);
			}}
			onPointerOut={() => {
				document.body.style.cursor = "";
			}}
			onPointerOver={(event) => {
				event.stopPropagation();
				document.body.style.cursor = "pointer";
			}}
		>
			<sphereGeometry args={[1, 20, 14]} />
			<meshBasicMaterial
				color="#cd5079"
				depthTest={false}
				depthWrite={false}
				transparent
				opacity={0.78}
			/>
		</mesh>
	);
}

function CustomizableCrocs({
	bodyColor,
	interactiveSlots,
	onLoadProgress,
	onMetrics,
	onModelReady,
	onSlotSelect,
	onCharmReady,
	animateCharms = true,
	placements,
	rotations,
	selectedCharmId,
	selectedSlot,
}) {
	const groupRef = useRef(null);
	const hasSetInitialColor = useRef(false);
	const invalidate = useThree((state) => state.invalidate);
	const { scene } = useLoader(GLTFLoader, MODEL_ASSETS.classicClog, undefined, onLoadProgress);

	const { model, modelSize, slots } = useMemo(() => {
		const clone = scene.clone(true);
		cloneMaterials(clone);
		clone.updateMatrixWorld(true);

		const bounds = new Box3().setFromObject(clone);
		clone.position.sub(bounds.getCenter(new Vector3()));
		clone.updateMatrixWorld(true);

		const size = bounds.getSize(new Vector3());
		const nextModelSize = Math.max(size.x, size.y, size.z) || 1;
		const nextSlots = [];

		clone.traverse((object) => {
			if (!/^CharmSlot_\d+$/i.test(object.name)) return;
			nextSlots.push({
				name: object.name,
				position: object.getWorldPosition(new Vector3()),
				quaternion: object.getWorldQuaternion(new Quaternion()),
			});
		});
		nextSlots.sort((a, b) =>
			a.name.localeCompare(b.name, undefined, { numeric: true }),
		);

		return { model: clone, modelSize: nextModelSize, slots: nextSlots };
	}, [scene]);

	useEffect(() => () => disposeClonedMaterials(model), [model]);

	useLayoutEffect(() => {
		const next = new Color(bodyColor);
		const immediate = !hasSetInitialColor.current || matchMedia("(prefers-reduced-motion: reduce)").matches;
		const tweens = [];
		model.traverse((object) => {
			if (!object.isMesh || !object.material) return;
			const materials = Array.isArray(object.material)
				? object.material
				: [object.material];
			for (const material of materials) {
				if (material.name !== "Body_Crocs" || !material.color) continue;
				if (immediate) material.color.copy(next);
				else tweens.push(gsap.to(material.color, {
					r: next.r, g: next.g, b: next.b,
					duration: 0.38, ease: "power2.inOut", overwrite: true, onUpdate: invalidate,
				}));
			}
		});
		hasSetInitialColor.current = true;
		invalidate();
		return () => tweens.forEach((tween) => tween.kill());
	}, [bodyColor, invalidate, model]);

	useEffect(() => {
		onMetrics(modelSize);
	}, [modelSize, onMetrics]);

	const reportFirstFrame = useCallback(() => {
		onModelReady?.({ group: groupRef.current, invalidate, modelSize });
	}, [invalidate, modelSize, onModelReady]);
	useFirstModelFrame(model, onModelReady ? reportFirstFrame : undefined);

	return (
		<group ref={groupRef}>
			<primitive object={model} dispose={null} />
			{slots.map((slot) => {
				const charmId = placements[slot.name];
				if (charmId) {
					return (
						<Suspense key={`${slot.name}-${charmId}`} fallback={null}>
							<PlacedCharm
								charmId={charmId}
								interactive={interactiveSlots}
								modelSize={modelSize}
								animateIn={animateCharms}
								onReady={onCharmReady}
								onSelect={onSlotSelect}
								rotation={rotations?.[slot.name] ?? 0}
								selected={selectedSlot === slot.name}
								slot={slot}
							/>
						</Suspense>
					);
				}

				return interactiveSlots ? (
					<SlotMarker
						key={slot.name}
						modelSize={modelSize}
						pulseKey={selectedCharmId}
						onSelect={onSlotSelect}
						slot={slot}
					/>
				) : null;
			})}
		</group>
	);
}

export default CustomizableCrocs;
