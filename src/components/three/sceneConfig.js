export const CROCS_MODEL_URL = "/models/crocs.glb";

export const CAMERA = Object.freeze({
	direction: [1.4, 0.9, 2],
	fov: 36,
	near: 0.01,
	far: 100,
});

export const CROCS_POSE = Object.freeze({
	rotationDegrees: [35, -50, 390],
});

export const LIGHTS = Object.freeze({
	hemisphere: { sky: 0xffffff, ground: 0x9cccf0, intensity: 2 },
	key: { color: 0xffffff, intensity: 3.6, position: [4, 6, 7] },
	fill: { color: 0xb9defa, intensity: 1.8, position: [-5, 2, 4] },
	rim: { color: 0x4da8ed, intensity: 1.8, position: [2, 4, -5] },
});
