import { Vector3 } from "../../../utils/three.js";

export const VIEW_POSITIONS = Object.freeze({
	side: new Vector3(1.7, 1.35, -0.6),
	style: new Vector3(1, 0.25, -1.4),
	top: new Vector3(0.1, 1.38, 0.26),
	back: new Vector3(1.3, 0.32, 0.07),
	mini: new Vector3(1.2, 0.9, 0.25),
});

export const VIEW_FIT = Object.freeze({
	side: 0.87,
	style: 0.82,
	top: 1.6,
	back: 1.6,
	mini: 1,
});

export const INITIAL_CAMERA_POSITION = VIEW_POSITIONS.side
	.clone()
	.multiplyScalar(VIEW_FIT.side)
	.toArray();
