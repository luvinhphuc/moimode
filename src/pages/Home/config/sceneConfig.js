export const CAMERA = Object.freeze({
	direction: [1.4, 0.9, 2],
	fov: 36,
	near: 0.01,
	far: 100,
});

export const CROCS_POSE = Object.freeze({
	rotationDegrees: [35, -50, 390],
});

export const CROCS_TRANSITION_POSE = Object.freeze({
	rotationDegrees: [0, -90, 360],
});

// A small, fixed hero styling that mirrors the four circled holes in the
// reference composition. The full interactive selection remains on Customize.
export const HERO_CHARM_PLACEMENTS = Object.freeze({
	CharmSlot_06: "bubble-tea",
	CharmSlot_08: "lightning",
	CharmSlot_10: "flower",
	CharmSlot_13: "smiley-vietnam",
});

export const LIGHTS = Object.freeze({
	hemisphere: { sky: 0xffffff, ground: 0x9cccf0, intensity: 2 },
	key: { color: 0xffffff, intensity: 3.6, position: [4, 6, 7] },
	fill: { color: 0xb9defa, intensity: 1.8, position: [-5, 2, 4] },
	rim: { color: 0x4da8ed, intensity: 1.8, position: [2, 4, -5] },
});

