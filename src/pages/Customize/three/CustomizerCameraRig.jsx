import { useFrame, useThree } from "@react-three/fiber";

import { Vector3 } from "../../../utils/three.js";
import { VIEW_FIT, VIEW_POSITIONS } from "./customizerCameraConfig.js";

function CustomizerCameraRig({ compactPreview = false, controlsRef, modelSize, view }) {
	const { camera, size } = useThree();

	useFrame((_, delta) => {
		if (view === "free" || !controlsRef.current) return;
		// Increase camera distance on narrow canvases to avoid clipping the shoe.
		const aspect = size.width / Math.max(size.height, 1);
		const mobileFit = size.width < 768 ? Math.max(1.3, 1.35 / Math.max(aspect, 0.75)) : 1;
		const previewFit = compactPreview ? 1.05 : 1;
		const multiplier = Math.max(modelSize, 1) * mobileFit * previewFit * VIEW_FIT[view];
		const targetPosition = VIEW_POSITIONS[view]
			.clone()
			.multiplyScalar(multiplier);
		if (compactPreview) {
			camera.position.copy(targetPosition);
			controlsRef.current.target.set(0, 0, 0);
			controlsRef.current.update();
			return;
		}

		camera.position.lerp(
			targetPosition,
			1 - Math.exp(-Math.min(delta, 0.05) * 6),
		);
		controlsRef.current.target.lerp(
			new Vector3(0, 0, 0),
			1 - Math.exp(-Math.min(delta, 0.05) * 8),
		);
		controlsRef.current.update();
	});

	return null;
}

export default CustomizerCameraRig;
