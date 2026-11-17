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
			{ id: "sand", label: "Sand", value: "#d4bc9b" },
			{ id: "espresso", label: "Espresso", value: "#5a3a32" },
		],
	},
	{
		id: "pastel",
		label: "Pastel vibes",
		colours: [
			{ id: "light-blue", label: "Light Blue", value: "#a8d5f4" },
			{ id: "green", label: "Green", value: "#91ad8b" },
			{ id: "baby-pink", label: "Baby Pink", value: "#f2c6d5" },
			{ id: "mint", label: "Mint", value: "#c6ded5" },
			{ id: "lilac", label: "Lilac", value: "#d8c7eb" },
			{ id: "butter-yellow", label: "Butter Yellow", value: "#f7dfa3" },
			{ id: "peach", label: "Peach", value: "#f5a98c" },
			{ id: "periwinkle", label: "Periwinkle", value: "#9ba8e8" },
		],
	},
	{
		id: "statement",
		label: "Statement colours",
		colours: [
			{ id: "pink", label: "Pink", value: "#eba8c5" },
			{ id: "red", label: "Red", value: "#d63d3d" },
			{ id: "purple", label: "Purple", value: "#ad78d4" },
			{ id: "lime", label: "Lime", value: "#b7e35b" },
			{ id: "electric-blue", label: "Electric Blue", value: "#3975ea" },
		],
	},
]);

export const COLOURS = Object.freeze(
	COLOUR_GROUPS.flatMap((group) => group.colours),
);

export const DEFAULT_COLOUR_ID = "light-blue";

export const CHARM_CATEGORIES = Object.freeze([
	{ id: "all", label: "All" },
	{ id: "vietnam", label: "Vietnam" },
	{ id: "food", label: "Food & Drinks" },
	{ id: "animals", label: "Animals" },
	{ id: "music", label: "Music" },
	{ id: "sports", label: "Sports" },
	{ id: "travel", label: "Travel" },
	{ id: "nature-icons", label: "Nature & Icons" },
]);

const NEW_CHARM_ORIENTATION = Object.freeze({
	frontAxis: Object.freeze([0, 1, 0]),
	upAxis: Object.freeze([0, 0, -1]),
});

const LEGACY_CHARM_ORIENTATION = Object.freeze({
	frontAxis: Object.freeze([0, 1, 0]),
	upAxis: Object.freeze([0, 0, 1]),
});

const charm = (id, fileName, label, categoryId, preview = {}) =>
	Object.freeze({
		id,
		url: `/model/charms/${fileName}`,
		label,
		categoryId,
		orientation: preview.orientation ?? NEW_CHARM_ORIENTATION,
		previewScale: preview.scale ?? 1,
	});

export const CHARM_CATALOG = Object.freeze([
	charm("an-gi-chua", "an-gi-chua.glb", "Ăn gì chưa", "vietnam"),
	charm("banh-mi", "banh-mi.glb", "Bánh mì", "vietnam"),
	charm("bubble-tea", "bubble-tea.glb", "Bubble tea", "food"),
	charm("chill-phet", "chill-phet.glb", "Chill phết", "vietnam"),
	charm("cloud", "cloud.glb", "Cloud", "nature-icons"),
	charm("conical-hat", "conical-hat.glb", "Nón lá", "vietnam"),
	charm("di-dau-day", "di-dau-day.glb", "Đi đâu đấy", "vietnam"),
	charm("dragon-fruit", "dragon-fruit.glb", "Thanh long", "vietnam"),
	charm("helmet", "helmet.glb", "Mũ bảo hiểm", "vietnam"),
	charm("het-nuoc-cham", "het-nuoc-cham.glb", "Hết nước chấm", "vietnam"),
	charm("lightning", "lightning.glb", "Lightning", "nature-icons"),
	charm("lotus", "lotus.glb", "Lotus", "vietnam"),
	charm("lucky-cat", "lucky-cat.glb", "Lucky cat", "nature-icons"),
	charm("red-stool", "red-stool.glb", "Ghế nhựa đỏ", "vietnam"),
	charm("retro-phone", "retro-phone.glb", "Retro phone", "nature-icons"),
	charm("smiley-vietnam", "smiley-vietnam.glb", "Smiley Vietnam", "vietnam"),
	charm("flower", "flower.glb", "Flower", "nature-icons", {
		orientation: LEGACY_CHARM_ORIENTATION,
	}),
	charm("animals-cat", "animals-cat.glb", "Cat", "animals"),
	charm("animals-dog", "animals-dog.glb", "Dog", "animals"),
	charm("animals-frog", "animals-frog.glb", "Frog", "animals"),
	charm("animals-koala", "animals-koala.glb", "Koala", "animals"),
	charm("animals-otter", "animals-otter.glb", "Otter", "animals"),
	charm("animals-panda", "animals-panda.glb", "Panda", "animals"),
	charm("animals-penguin", "animals-penguin.glb", "Penguin", "animals"),
	charm("animals-rabbit", "animals-rabbit.glb", "Rabbit", "animals"),
	charm("animals-turtle", "animals-turtle.glb", "Turtle", "animals"),
	charm("animals-whale", "animals-whale.glb", "Whale", "animals"),
	charm("food-banh-mi", "food-banh-mi.glb", "Bánh mì", "food"),
	charm("food-bubble-tea", "food-bubble-tea.glb", "Bubble tea", "food"),
	charm("food-burger", "food-burger.glb", "Burger", "food"),
	charm("food-donut", "food-donut.glb", "Donut", "food"),
	charm("food-egg-tart", "food-egg-tart.glb", "Egg tart", "food"),
	charm("food-french-fries", "food-french-fries.glb", "French fries", "food"),
	charm("food-ice-cream", "food-ice-cream.glb", "Ice cream", "food"),
	charm("food-pho", "food-pho.glb", "Phở", "food"),
	charm("food-pizza", "food-pizza.glb", "Pizza", "food"),
	charm("food-salmon-sushi", "food-salmon-sushi.glb", "Salmon sushi", "food"),
	charm("music-cassette-tape", "music-cassette-tape.glb", "Cassette tape", "music"),
	charm("music-electric-guitar", "music-electric-guitar.glb", "Electric guitar", "music"),
	charm("music-headphones", "music-headphones.glb", "Headphones", "music"),
	charm("music-microphone", "music-microphone.glb", "Microphone", "music"),
	charm("music-music-note", "music-music-note.glb", "Music note", "music"),
	charm("music-record-player", "music-record-player.glb", "Record player", "music"),
	charm("music-shooting-star", "music-shooting-star.glb", "Shooting star", "music"),
	charm("music-sound-wave", "music-sound-wave.glb", "Sound wave", "music"),
	charm("music-speaker", "music-speaker.glb", "Speaker", "music"),
	charm("music-vinyl-record", "music-vinyl-record.glb", "Vinyl record", "music"),
	charm("sports-american-football", "sports-american-football.glb", "American football", "sports"),
	charm("sports-badminton", "sports-badminton.glb", "Badminton", "sports"),
	charm("sports-baseball", "sports-baseball.glb", "Baseball", "sports"),
	charm("sports-basketball", "sports-basketball.glb", "Basketball", "sports"),
	charm("sports-dumbbell", "sports-dumbbell.glb", "Dumbbell", "sports"),
	charm("sports-soccer-ball", "sports-soccer-ball.glb", "Soccer ball", "sports"),
	charm("sports-table-tennis", "sports-table-tennis.glb", "Table tennis", "sports"),
	charm("sports-tennis-ball", "sports-tennis-ball.glb", "Tennis ball", "sports"),
	charm("sports-trophy", "sports-trophy.glb", "Trophy", "sports"),
	charm("sports-volleyball", "sports-volleyball.glb", "Volleyball", "sports"),
	charm("travel-airplane", "travel-airplane.glb", "Airplane", "travel"),
	charm("travel-camera", "travel-camera.glb", "Camera", "travel"),
	charm("travel-camping-tent", "travel-camping-tent.glb", "Camping tent", "travel"),
	charm("travel-compass", "travel-compass.glb", "Compass", "travel"),
	charm("travel-direction-sign", "travel-direction-sign.glb", "Direction sign", "travel"),
	charm("travel-mountains", "travel-mountains.glb", "Mountains", "travel"),
	charm("travel-ocean-wave", "travel-ocean-wave.glb", "Ocean wave", "travel"),
	charm("travel-palm-tree", "travel-palm-tree.glb", "Palm tree", "travel"),
	charm("travel-suitcase", "travel-suitcase.glb", "Suitcase", "travel"),
	charm("travel-travel-map", "travel-travel-map.glb", "Travel map", "travel"),
	charm("vietnam-banh-mi", "vietnam-banh-mi.glb", "Bánh mì Việt Nam", "vietnam"),
	charm("vietnam-conical-hat", "vietnam-conical-hat.glb", "Nón lá Việt Nam", "vietnam"),
	charm("vietnam-dragon", "vietnam-dragon.glb", "Rồng", "vietnam"),
	charm("vietnam-flower-bicycle", "vietnam-flower-bicycle.glb", "Xe đạp hoa", "vietnam"),
	charm("vietnam-ha-long-bay", "vietnam-ha-long-bay.glb", "Vịnh Hạ Long", "vietnam"),
	charm("vietnam-lotus", "vietnam-lotus.glb", "Hoa sen Việt Nam", "vietnam"),
	charm("vietnam-pho", "vietnam-pho.glb", "Phở Việt Nam", "vietnam"),
	charm("vietnam-temple-gate", "vietnam-temple-gate.glb", "Cổng đền", "vietnam"),
	charm("vietnam-vietnam-flag", "vietnam-vietnam-flag.glb", "Cờ Việt Nam", "vietnam"),
	charm("vietnam-vietnamese-coffee", "vietnam-vietnamese-coffee.glb", "Cà phê Việt Nam", "vietnam"),
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
