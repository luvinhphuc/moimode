import { useSyncExternalStore } from "react";

const QUERIES = [
	"(min-width: 768px)",
	"(hover: hover) and (pointer: fine)",
	"(prefers-reduced-motion: reduce)",
];

function subscribe(callback) {
	const queries = QUERIES.map((query) => window.matchMedia(query));
	queries.forEach((query) => query.addEventListener("change", callback));
	return () => queries.forEach((query) => query.removeEventListener("change", callback));
}

function getSnapshot() {
	return QUERIES.reduce((mask, query, index) =>
		mask | (window.matchMedia(query).matches ? 1 << index : 0), 0);
}

export default function useStoryEnvironment() {
	const mask = useSyncExternalStore(subscribe, getSnapshot, () => 0);
	return {
		isDesktop: Boolean(mask & 1),
		canHover: Boolean(mask & 1) && Boolean(mask & 2),
		reducedMotion: Boolean(mask & 4),
	};
}
