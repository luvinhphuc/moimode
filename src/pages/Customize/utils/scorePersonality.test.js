import assert from "node:assert/strict";
import test from "node:test";

import { CHARM_CATALOG, CHARM_CATEGORIES, COLOURS } from "../config/customizerConfig.js";
import { CHARM_AFFINITIES, COLOUR_AFFINITIES } from "../config/personalityConfig.js";
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

test("all twenty Crocs colours have weighted affinities", () => {
	assert.equal(COLOURS.length, 20);
	for (const colour of COLOURS) {
		assert.equal(COLOUR_AFFINITIES[colour.id]?.length, 4, colour.id);
		assert.equal(COLOUR_AFFINITIES[colour.id].reduce((sum, point) => sum + point, 0), 5, colour.id);
	}
});

test("empty design redistributes inactive weights and reports no collection", () => {
	const result = scorePersonality({ colourId: "white", placements: {} });
	assert.equal(result.primaryPersonality, "minimalist");
	assert.equal(result.customizationStats.charmCount, 0);
	assert.equal(result.customizationStats.collectionCount, 0);
	assert.equal(result.customizationStats.topCollection, null);
	assert.equal(result.customizationStats.strapColor, null);
	assert.equal(Object.values(result.scores).reduce((sum, score) => sum + score, 0), 100);
});

test("repeated charms count for quantity but only once for selection", () => {
	const one = scorePersonality({ colourId: "lime", placements: { a: "travel-airplane" } });
	const two = scorePersonality({ colourId: "lime", placements: { a: "travel-airplane", b: "travel-airplane" } });
	assert.equal(one.customizationStats.uniqueCharmCount, 1);
	assert.equal(two.customizationStats.uniqueCharmCount, 1);
	assert.equal(two.customizationStats.charmCount, 2);
	assert.equal(two.customizationStats.collectionCount, 1);
	assert.deepEqual(one.scores, two.scores);
});

test("collection statistics use single primary categories and deterministic ties", () => {
	const input = { colourId: "periwinkle", placements: {
		a: "travel-camera", b: "food-pizza", c: "travel-map-does-not-exist", d: "food-burger",
	} };
	const result = scorePersonality(input);
	assert.equal(result.customizationStats.collectionCount, 2);
	assert.equal(result.customizationStats.topCollection, "food");
	assert.deepEqual(result, scorePersonality(input));
	assert.equal(Object.values(result.scores).reduce((sum, score) => sum + score, 0), 100);
});

test("unknown charm affinity uses a neutral fallback", () => {
	const result = scorePersonality({ colourId: "electric-blue", placements: { a: "unknown-charm" } });
	assert.equal(result.customizationStats.charmCount, 1);
	assert.equal(result.customizationStats.topCollection, null);
	assert.equal(Object.values(result.scores).reduce((sum, score) => sum + score, 0), 100);
});
