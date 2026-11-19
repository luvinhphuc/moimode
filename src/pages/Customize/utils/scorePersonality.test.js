import assert from "node:assert/strict";
import test from "node:test";

import { CHARM_CATALOG, CHARM_CATEGORIES, COLORS } from "../config/customizerConfig.js";
import { CHARM_AFFINITIES, COLOR_AFFINITIES } from "../config/personalityConfig.js";
import { scorePersonality } from "./scorePersonality.js";

test("every catalog charm has one valid category and a five-point individual affinity", () => {
	const categoryIds = new Set(CHARM_CATEGORIES.map(({ id }) => id));
	assert.equal(CHARM_CATALOG.length, 77);
	assert.equal(Object.keys(CHARM_AFFINITIES).length, CHARM_CATALOG.length);
	for (const charm of CHARM_CATALOG) {
		assert.ok(categoryIds.has(charm.categoryId), charm.id);
		assert.equal(charm.categories, undefined, charm.id);
		assert.equal(CHARM_AFFINITIES[charm.id]?.length, 4, charm.id);
		assert.equal(CHARM_AFFINITIES[charm.id].reduce((sum, point) => sum + point, 0), 5, charm.id);
	}
});

test("all twenty Crocs colors have weighted affinities", () => {
	assert.equal(COLORS.length, 20);
	for (const color of COLORS) {
		assert.equal(COLOR_AFFINITIES[color.id]?.length, 4, color.id);
		assert.equal(COLOR_AFFINITIES[color.id].reduce((sum, point) => sum + point, 0), 5, color.id);
	}
});

test("empty design redistributes inactive weights and reports no collection", () => {
	const result = scorePersonality({ colorId: "white", placements: {} });
	assert.equal(result.primaryPersonality, "minimalist");
	assert.equal(result.customizationStats.charmCount, 0);
	assert.equal(result.customizationStats.collectionCount, 0);
	assert.equal(result.customizationStats.topCollection, null);
	assert.equal(result.customizationStats.strapColor, null);
	assert.equal(Object.values(result.scores).reduce((sum, score) => sum + score, 0), 100);
});

test("an empty design reflects each Crocs color instead of always returning minimalist", () => {
	const primaryByColor = Object.fromEntries(COLORS.map(({ id }) => [
		id,
		scorePersonality({ colorId: id, placements: {} }).primaryPersonality,
	]));

	assert.deepEqual(primaryByColor, {
		white: "minimalist",
		cream: "minimalist",
		black: "minimalist",
		gray: "minimalist",
		navy: "minimalist",
		sand: "minimalist",
		espresso: "minimalist",
		"light-blue": "creative",
		green: "minimalist",
		"baby-pink": "minimalist",
		mint: "creative",
		lilac: "creative",
		"butter-yellow": "playful",
		peach: "playful",
		periwinkle: "creative",
		pink: "playful",
		red: "bold",
		purple: "creative",
		lime: "playful",
		"electric-blue": "bold",
	});
});

test("crossing six charms can flip the same food-heavy design to playful", () => {
	const charmIds = [
		"food-burger",
		"food-donut",
		"food-pizza",
		"food-ice-cream",
		"food-french-fries",
		"food-bubble-tea",
	];
	const placementsFor = (ids) => Object.fromEntries(ids.map((id, index) => [`slot-${index}`, id]));
	const fiveCharms = scorePersonality({ colorId: "white", placements: placementsFor(charmIds.slice(0, 5)) });
	const sixCharms = scorePersonality({ colorId: "white", placements: placementsFor(charmIds) });

	assert.equal(fiveCharms.primaryPersonality, "minimalist");
	assert.deepEqual(fiveCharms.scores, { playful: 36, minimalist: 41, creative: 23, bold: 0 });
	assert.equal(sixCharms.primaryPersonality, "playful");
	assert.deepEqual(sixCharms.scores, { playful: 46, minimalist: 31, creative: 23, bold: 0 });
});

test("repeated charms count for quantity but only once for selection", () => {
	const one = scorePersonality({ colorId: "lime", placements: { a: "travel-airplane" } });
	const two = scorePersonality({ colorId: "lime", placements: { a: "travel-airplane", b: "travel-airplane" } });
	assert.equal(one.customizationStats.uniqueCharmCount, 1);
	assert.equal(two.customizationStats.uniqueCharmCount, 1);
	assert.equal(two.customizationStats.charmCount, 2);
	assert.equal(two.customizationStats.collectionCount, 1);
	assert.deepEqual(one.scores, two.scores);
});

test("collection statistics use single primary categories and deterministic ties", () => {
	const input = { colorId: "periwinkle", placements: {
		a: "travel-camera", b: "food-pizza", c: "travel-map-does-not-exist", d: "food-burger",
	} };
	const result = scorePersonality(input);
	assert.equal(result.customizationStats.collectionCount, 2);
	assert.equal(result.customizationStats.topCollection, "food");
	assert.deepEqual(result, scorePersonality(input));
	assert.equal(Object.values(result.scores).reduce((sum, score) => sum + score, 0), 100);
});

test("unknown charm affinity uses a neutral fallback", () => {
	const result = scorePersonality({ colorId: "electric-blue", placements: { a: "unknown-charm" } });
	assert.equal(result.customizationStats.charmCount, 1);
	assert.equal(result.customizationStats.topCollection, null);
	assert.equal(Object.values(result.scores).reduce((sum, score) => sum + score, 0), 100);
});
