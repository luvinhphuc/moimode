import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";

import { MODEL_ASSETS } from "../../../config/modelAssets.js";
import { Box3, Quaternion, Sphere, Vector3 } from "../../../utils/three.js";
import {
	CROCS_POSE,
	HERO_CHARM_PLACEMENTS,
} from "../config/sceneConfig.js";
import HeroModelRig from "./HeroModelRig.jsx";

function CrocsModel({
	modelUrl = MODEL_ASSETS.classicClog,
	onReady,
	pose = CROCS_POSE,
	enablePointerMotion = true,
	transitionControlRef,
}) {
	const { scene } = useGLTF(modelUrl);
	const { model, modelSize, radius, slots } = useMemo(() => {
		const clone = scene.clone(true);
		const bounds = new Box3().setFromObject(clone);
		clone.position.sub(bounds.getCenter(new Vector3()));
		clone.updateMatrixWorld(true);

		const sphere = new Box3()
			.setFromObject(clone)
			.getBoundingSphere(new Sphere());
		const size = new Box3().setFromObject(clone).getSize(new Vector3());
		const slots = [];

		clone.traverse((object) => {
			if (!/^CharmSlot_\d+$/i.test(object.name)) return;
			const charmId = HERO_CHARM_PLACEMENTS[object.name];
			if (!charmId) return;
			slots.push({
				name: object.name,
				position: object.getWorldPosition(new Vector3()),
				quaternion: object.getWorldQuaternion(new Quaternion()),
				charmId,
			});
		});

		return {
			model: clone,
			radius: sphere.radius || 1,
			modelSize: Math.max(size.x, size.y, size.z) || 1,
			slots,
		};
	}, [scene]);

	useEffect(() => {
		onReady?.(model);
	}, [model, onReady]);

	return (
		<HeroModelRig
			enablePointerMotion={enablePointerMotion}
			model={model}
			modelSize={modelSize}
			pose={pose}
			radius={radius}
			slots={slots}
			transitionControlRef={transitionControlRef}
		/>
	);
}

export default CrocsModel;

