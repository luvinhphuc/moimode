import { Suspense, useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";

import { MODEL_ASSETS } from "../../../config/modelAssets.js";
import { Box3, Quaternion, Vector3 } from "../../../utils/three.js";
import PlacedCharm from "./PlacedCharm.jsx";

function cloneMaterials(root) {
	root.traverse((object) => {
		if (!object.isMesh || !object.material) return;
		object.material = Array.isArray(object.material)
			? object.material.map((material) => material.clone())
			: object.material.clone();
	});
}

function SlotMarker({ modelSize, onSelect, slot }) {
	return (
		<mesh
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
				color="#ff70ae"
				depthTest={false}
				depthWrite={false}
				transparent
				opacity={0.78}
			/>
		</mesh>
	);
}

function CustomizableCrocs({
	bodyColour,
	interactiveSlots,
	onMetrics,
	onSlotSelect,
	placements,
	rotations,
	selectedSlot,
}) {
	const { scene } = useGLTF(MODEL_ASSETS.classicClog);

	const { model, modelSize, slots } = useMemo(() => {
		const clone = scene.clone(true);
		cloneMaterials(clone);
		clone.updateMatrixWorld(true);

		const initialBounds = new Box3().setFromObject(clone);
		clone.position.sub(initialBounds.getCenter(new Vector3()));
		clone.updateMatrixWorld(true);

		const bounds = new Box3().setFromObject(clone);
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

	useEffect(() => {
		model.traverse((object) => {
			if (!object.isMesh || !object.material) return;
			const materials = Array.isArray(object.material)
				? object.material
				: [object.material];
			for (const material of materials) {
				if (material.name !== "Body_Crocs" || !material.color) continue;
				material.color.set(bodyColour);
				material.needsUpdate = true;
			}
		});
	}, [bodyColour, model]);

	useEffect(() => {
		onMetrics(modelSize);
	}, [modelSize, onMetrics]);

	return (
		<group>
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
						onSelect={onSlotSelect}
						slot={slot}
					/>
				) : null;
			})}
		</group>
	);
}

export default CustomizableCrocs;
