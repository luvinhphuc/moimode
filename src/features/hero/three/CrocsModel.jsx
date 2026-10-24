import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";

import { MODEL_ASSETS } from "../../../config/modelAssets.js";
import { Box3, Sphere, Vector3 } from "../../../utils/three.js";
import { CROCS_POSE } from "../config/sceneConfig.js";
import HeroModelRig from "./HeroModelRig.jsx";

function CrocsModel({
	modelUrl = MODEL_ASSETS.classicClog,
	onReady,
	pose = CROCS_POSE,
	enablePointerMotion = true,
}) {
	const { scene } = useGLTF(modelUrl);
	const { model, radius } = useMemo(() => {
		const clone = scene.clone(true);
		const bounds = new Box3().setFromObject(clone);
		clone.position.sub(bounds.getCenter(new Vector3()));

		const sphere = new Box3()
			.setFromObject(clone)
			.getBoundingSphere(new Sphere());

		return { model: clone, radius: sphere.radius || 1 };
	}, [scene]);

	useEffect(() => {
		onReady?.(model);
	}, [model, onReady]);

	return (
		<HeroModelRig
			enablePointerMotion={enablePointerMotion}
			model={model}
			pose={pose}
			radius={radius}
		/>
	);
}

export default CrocsModel;
