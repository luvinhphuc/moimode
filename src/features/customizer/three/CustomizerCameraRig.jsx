import { useFrame, useThree } from "@react-three/fiber";

import { Vector3 } from "../../../utils/three.js";

const VIEW_POSITIONS = Object.freeze({
	side: new Vector3(0.16, 0.34, 1.3),
	top: new Vector3(0.1, 1.38, 0.26),
	back: new Vector3(1.3, 0.32, 0.07),
});

function CustomizerCameraRig({ controlsRef, modelSize, view }) {
	const { camera } = useThree();

	useFrame((_, delta) => {
		if (view === "free" || !controlsRef.current) return;
		const multiplier = Math.max(modelSize, 1);
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
