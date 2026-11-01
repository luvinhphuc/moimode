export const CUSTOMIZER_STEPS = Object.freeze([
	{ id: 1, label: "Choose Style", shortLabel: "Style" },
	{ id: 2, label: "Choose Colour", shortLabel: "Colour" },
	{ id: 3, label: "Add Charms", shortLabel: "Charms" },
	{ id: 4, label: "Preview & Save", shortLabel: "Preview" },
]);

export const COLOUR_GROUPS = Object.freeze([
	{
		id: "classic",
		label: "Classic colours",
		colours: [
			{ id: "white", label: "White", value: "#f7f6f1" },
			{ id: "cream", label: "Cream", value: "#ead9bd" },
			{ id: "black", label: "Black", value: "#25282b" },
			{ id: "grey", label: "Grey", value: "#bec3c8" },
			{ id: "navy", label: "Navy", value: "#263f64" },
			{ id: "light-blue", label: "Light Blue", value: "#a8d5f4" },
			{ id: "pink", label: "Pink", value: "#eba8c5" },
			{ id: "green", label: "Green", value: "#91ad8b" },
			{ id: "red", label: "Red", value: "#d63d3d" },
			{ id: "purple", label: "Purple", value: "#ad78d4" },
		],
	},
	{
		id: "pastel",
		label: "Pastel vibes",
		colours: [
			{ id: "baby-pink", label: "Baby Pink", value: "#f2c6d5" },
			{ id: "mint", label: "Mint", value: "#c6ded5" },
			{ id: "lilac", label: "Lilac", value: "#d8c7eb" },
			{ id: "butter-yellow", label: "Butter Yellow", value: "#f7dfa3" },
		],
	},
]);

export const COLOURS = Object.freeze(
	COLOUR_GROUPS.flatMap((group) => group.colours),
);

export const DEFAULT_COLOUR_ID = "light-blue";

export const CHARM_CATEGORIES = Object.freeze([
	{ id: "all", label: "All" },
	{ id: "cute", label: "Cute" },
	{ id: "nature", label: "Nature" },
	{ id: "food", label: "Food" },
	{ id: "icons", label: "Icons" },
	{ id: "vietnam", label: "Vietnam" },
]);

const NEW_CHARM_ORIENTATION = Object.freeze({
	frontAxis: Object.freeze([0, 1, 0]),
	upAxis: Object.freeze([0, 0, -1]),
});

const LEGACY_CHARM_ORIENTATION = Object.freeze({
	frontAxis: Object.freeze([0, 1, 0]),
	upAxis: Object.freeze([0, 0, 1]),
});

const charm = (id, fileName, label, categories, preview = {}) =>
	Object.freeze({
		id,
		url: `/model/charms/${fileName}`,
		label,
		categories,
		orientation: preview.orientation ?? NEW_CHARM_ORIENTATION,
		previewScale: preview.scale ?? 1,
	});

export const CHARM_CATALOG = Object.freeze([
	charm("an-gi-chua", "an-gi-chua.glb", "Ăn gì chưa", ["vietnam", "icons"]),
	charm("banh-mi", "banh-mi.glb", "Bánh mì", ["vietnam", "food"]),
	charm("bubble-tea", "bubble-tea.glb", "Bubble tea", ["food", "cute"]),
	charm("chill-phet", "chill-phet.glb", "Chill phết", ["vietnam", "icons"]),
	charm("cloud", "cloud.glb", "Cloud", ["nature", "cute"]),
	charm("conical-hat", "conical-hat.glb", "Nón lá", ["vietnam", "icons"]),
	charm("di-dau-day", "di-dau-day.glb", "Đi đâu đấy", ["vietnam", "icons"]),
	charm("dragon-fruit", "dragon-fruit.glb", "Thanh long", ["vietnam", "food", "nature"]),
	charm("helmet", "helmet.glb", "Mũ bảo hiểm", ["vietnam", "icons"]),
	charm("het-nuoc-cham", "het-nuoc-cham.glb", "Hết nước chấm", ["vietnam", "icons"]),
	charm("lightning", "lightning.glb", "Lightning", ["nature", "icons"]),
	charm("lotus", "lotus.glb", "Lotus", ["vietnam", "nature"]),
	charm("lucky-cat", "lucky-cat.glb", "Lucky cat", ["cute", "icons"]),
	charm("red-stool", "red-stool.glb", "Ghế nhựa đỏ", ["vietnam", "icons"]),
	charm("retro-phone", "retro-phone.glb", "Retro phone", ["icons"]),
	charm("smiley-vietnam", "smiley-vietnam.glb", "Smiley Vietnam", ["vietnam", "cute"]),
	charm("flower", "flower.glb", "Flower", ["nature", "cute"], {
		orientation: LEGACY_CHARM_ORIENTATION,
	}),
]);

export const CHARM_BY_ID = Object.freeze(
	Object.fromEntries(CHARM_CATALOG.map((item) => [item.id, item])),
);

export const COLOUR_BY_ID = Object.freeze(
	Object.fromEntries(COLOURS.map((item) => [item.id, item])),
);

export const CHARM_SLOT_NAMES = Object.freeze(
	Array.from({ length: 13 }, (_, index) =>
		`CharmSlot_${String(index + 1).padStart(2, "0")}`,
	),
);

export const DEFAULT_CUSTOMIZATION = Object.freeze({
	modelId: "classic-clog",
	colourId: DEFAULT_COLOUR_ID,
	placements: Object.freeze({}),
});
