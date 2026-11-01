import { useFrame, useThree } from "@react-three/fiber";

import { Vector3 } from "../../../utils/three.js";

const VIEW_POSITIONS = Object.freeze({
	side: new Vector3(0.16, 0.34, 1.3),
	top: new Vector3(0.1, 1.38, 0.26),
	back: new Vector3(1.3, 0.32, 0.07),
});

function CustomizerCameraRig({ controlsRef, modelSize, view }) {
	const { camera, size } = useThree();

	useFrame((_, delta) => {
		if (view === "free" || !controlsRef.current) return;
		// Increase camera distance on narrow canvases to avoid clipping the shoe.
		const aspect = size.width / Math.max(size.height, 1);
		const mobileFit = size.width < 768 ? Math.max(1.3, 1.35 / Math.max(aspect, 0.75)) : 1;
		const multiplier = Math.max(modelSize, 1) * mobileFit;
		const targetPosition = VIEW_POSITIONS[view]
			.clone()
			.multiplyScalar(multiplier);

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
