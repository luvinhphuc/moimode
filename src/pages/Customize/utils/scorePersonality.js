import {
	CHARM_BY_ID,
	CHARM_CATEGORIES,
	COLOR_BY_ID,
	DEFAULT_COLOR_ID,
} from "../config/customizerConfig.js";
import {
	CHARM_AFFINITIES,
	COLOR_AFFINITIES,
	PERSONALITY_ORDER,
} from "../config/personalityConfig.js";

const NEUTRAL = [1.25, 1.25, 1.25, 1.25];
const BASE_WEIGHTS = Object.freeze({ selection: 40, color: 25, quantity: 15, diversity: 10 });
const CATEGORY_ORDER = CHARM_CATEGORIES.filter(({ id }) => id !== "all").map(({ id }) => id);

function quantityAffinity(count) {
	if (count <= 2) return [0, 4, 1, 0];
	if (count <= 5) return [0, 3, 2, 0];
	if (count <= 9) return [3, 0, 2, 0];
	return [3, 0, 0, 2];
}

function diversityAffinity(count) {
	if (count <= 1) return [0, 4, 1, 0];
	if (count === 2) return [1, 2, 2, 0];
	if (count <= 4) return [2, 0, 3, 0];
	return [1, 0, 4, 0];
}

function roundedPercentages(raw) {
	const percentages = raw.map((value) => Math.floor(value));
	const remaining = 100 - percentages.reduce((sum, value) => sum + value, 0);
	const byRemainder = raw.map((value, index) => ({ index, remainder: value - percentages[index] }))
		.sort((a, b) => b.remainder - a.remainder || a.index - b.index);
	for (let index = 0; index < remaining; index += 1) percentages[byRemainder[index].index] += 1;
	return Object.fromEntries(PERSONALITY_ORDER.map((key, index) => [key, percentages[index]]));
}

export function scorePersonality({ colorId, placements }) {
	const charmIds = Object.values(placements ?? {}).filter(Boolean);
	const uniqueCharmIds = [...new Set(charmIds)];
	const categoryCounts = new Map();
	for (const charmId of charmIds) {
		const categoryId = CHARM_BY_ID[charmId]?.categoryId;
		if (categoryId) categoryCounts.set(categoryId, (categoryCounts.get(categoryId) ?? 0) + 1);
	}
	const collectionCount = categoryCounts.size;
	const topCollection = CATEGORY_ORDER.reduce((top, id) =>
		(categoryCounts.get(id) ?? 0) > (categoryCounts.get(top) ?? 0) ? id : top, null);

	const selection = [0, 0, 0, 0];
	for (const charmId of uniqueCharmIds) {
		const affinity = CHARM_AFFINITIES[charmId];
		if (!affinity && import.meta.env?.DEV) console.warn(`Missing personality affinity for charm: ${charmId}`);
		(affinity ?? NEUTRAL).forEach((value, index) => { selection[index] += value / uniqueCharmIds.length; });
	}
	const actualColorId = COLOR_BY_ID[colorId] ? colorId : DEFAULT_COLOR_ID;
	const color = COLOR_AFFINITIES[actualColorId] ?? NEUTRAL;
	const quantity = quantityAffinity(charmIds.length);
	const diversity = diversityAffinity(collectionCount);
	const criteria = { selection, color, quantity, diversity };
	const active = charmIds.length ? ["selection", "color", "quantity", "diversity"] : ["color", "quantity"];
	const totalWeight = active.reduce((sum, key) => sum + BASE_WEIGHTS[key], 0);
	const raw = PERSONALITY_ORDER.map((_, index) =>
		active.reduce((sum, key) => sum + (criteria[key][index] / 5) * (BASE_WEIGHTS[key] / totalWeight) * 100, 0));
	const ranked = PERSONALITY_ORDER.map((key, index) => ({ key, index })).sort((a, b) =>
		raw[b.index] - raw[a.index]
		|| selection[b.index] - selection[a.index]
		|| color[b.index] - color[a.index]
		|| a.index - b.index);

	return {
		primaryPersonality: ranked[0].key,
		secondaryPersonality: ranked[1].key,
		scores: roundedPercentages(raw),
		customizationStats: {
			bodyColor: actualColorId,
			strapColor: null,
			charmCount: charmIds.length,
			uniqueCharmCount: uniqueCharmIds.length,
			collectionCount,
			topCollection,
		},
	};
}
