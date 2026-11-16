import { useLayoutEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";

import { Vector3 } from "../../../utils/three.js";
import { VIEW_FIT, VIEW_POSITIONS } from "./customizerCameraConfig.js";

const ORIGIN = new Vector3();
const FIT_EPSILON_SQUARED = 1e-8;

function CustomizerCameraRig({ compactPreview = false, controlsRef, modelSize, view }) {
	const camera = useThree((state) => state.camera);
	const { width, height } = useThree((state) => state.size);
	const invalidate = useThree((state) => state.invalidate);

	const targetPosition = useMemo(() => {
		if (view === "free") return null;
		// Increase camera distance on narrow canvases to avoid clipping the shoe.
		const aspect = width / Math.max(height, 1);
		const mobileFit = width < 768 ? Math.max(1.3, 1.35 / Math.max(aspect, 0.75)) : 1;
		const previewFit = compactPreview ? 1.05 : 1;
		const multiplier = Math.max(modelSize, 1) * mobileFit * previewFit * VIEW_FIT[view];
		return VIEW_POSITIONS[view].clone().multiplyScalar(multiplier);
	}, [compactPreview, height, modelSize, view, width]);

	useLayoutEffect(() => {
		if (targetPosition) invalidate();
	}, [invalidate, targetPosition]);

	useFrame((_, delta) => {
		const controls = controlsRef.current;
		if (!targetPosition || !controls) return;
		const distance = camera.position.distanceToSquared(targetPosition);
		const targetDistance = controls.target.lengthSq();
		if (distance === 0 && targetDistance === 0) return;
		if (compactPreview || (distance <= FIT_EPSILON_SQUARED && targetDistance <= FIT_EPSILON_SQUARED)) {
			camera.position.copy(targetPosition);
			controls.target.copy(ORIGIN);
			controls.update();
			return;
		}

		const step = Math.min(delta, 0.05);
		camera.position.lerp(targetPosition, 1 - Math.exp(-step * 6));
		controls.target.lerp(ORIGIN, 1 - Math.exp(-step * 8));
		controls.update();
		invalidate();
	});

	return null;
}

export default CustomizerCameraRig;
