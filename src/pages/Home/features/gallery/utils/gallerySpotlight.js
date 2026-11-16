/** Wrap through the normalized source, including stories in the extra feed. */
export function getAdjacentStoryIndex(index, direction, count) {
    if (count <= 1) return 0;
    return ((index + direction) % count + count) % count;
}

/** Keep secondary photos at the edges, clear of the editorial reading area. */
export function getSpotlightBackdrop(index, count, width, height, cardWidth, cardHeight) {
    const side = index % 2 === 0 ? -1 : 1;
    const rows = Math.max(1, Math.ceil(count / 2));
    const band = (Math.floor(index / 2) + 0.5) / rows;
    return {
        x: side < 0 ? -cardWidth * 0.65 : width - cardWidth * 0.35,
        y: 32 + band * Math.min(height - cardHeight, 760),
        rotation: 0,
    };
}
