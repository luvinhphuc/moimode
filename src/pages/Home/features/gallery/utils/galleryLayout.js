import { GALLERY_LAYOUT as LAYOUT } from "../config/galleryMotionConfig.js";

export const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));

export function getGalleryMode(count) {
    return count === 0 ? "empty" : count < 4 ? "minimal" : count < 8 ? "adaptive" : "full";
}

function overlapArea(a, b, gap = 0) {
    return Math.max(0, Math.min(a.x + a.width + gap, b.x + b.width) - Math.max(a.x - gap, b.x))
        * Math.max(0, Math.min(a.y + a.height + gap, b.y + b.height) - Math.max(a.y - gap, b.y));
}

/** Fixed free-form anchors, resolved around the CTA without imposing rows. */
export function getSplitLayout(count, { width, height, cta }) {
    const box = cta ?? { x: width * 0.28, y: height / 2 - 100, width: width * 0.44, height: 200 };
    const { gap, edge } = LAYOUT;
    const ratio = LAYOUT.height / LAYOUT.width;
    const sideSpace = Math.max(1, Math.min(box.x, width - box.x - box.width) - gap - edge);
    const topSpace = Math.max(1, box.y - gap - edge);
    const bottomSpace = Math.max(1, height - box.y - box.height - gap - edge);
    const cardWidth = Math.floor(Math.max(1, Math.min(LAYOUT.width, width * 0.18,
        sideSpace, topSpace / ratio, bottomSpace / ratio, (height - edge * 2 - gap * 2) / (ratio * 3))));
    const cardHeight = Math.round(cardWidth * ratio);
    const placed = [];
    const clearance = gap / 2;

    for (const slotIndex of LAYOUT.selections[clamp(count, 0, LAYOUT.initialStackCapacity)]) {
        const [anchorX, anchorY] = LAYOUT.slots[slotIndex];
        const target = {
            x: clamp(width * anchorX - cardWidth / 2, edge, width - cardWidth - edge),
            y: clamp(height * anchorY - cardHeight / 2, edge, height - cardHeight - edge),
        };
        // Consider the preferred point first, then nearby obstacle boundaries.
        const xs = [target.x, edge, width - cardWidth - edge, box.x - gap - cardWidth, box.x + box.width + gap,
            ...placed.flatMap(card => [card.x - clearance - cardWidth, card.x + card.width + clearance])];
        const ys = [target.y, edge, height - cardHeight - edge, box.y - gap - cardHeight, box.y + box.height + gap,
            ...placed.flatMap(card => [card.y - clearance - cardHeight, card.y + card.height + clearance])];
        let best = null;
        let leastOverlap = Infinity;
        let nearest = Infinity;
        for (const x of xs) for (const y of ys) {
            const card = { x: Math.round(x), y: Math.round(y), width: cardWidth, height: cardHeight, rotation: 0 };
            if (card.x < edge || card.y < edge || card.x + cardWidth > width - edge || card.y + cardHeight > height - edge
                || overlapArea(card, box, gap) > 0) continue;
            const overlap = placed.reduce((total, other) => total + overlapArea(card, other, clearance), 0);
            const distance = (card.x - target.x) ** 2 + (card.y - target.y) ** 2;
            if (overlap < leastOverlap || (overlap === leastOverlap && distance < nearest)) {
                best = card;
                leastOverlap = overlap;
                nearest = distance;
            }
        }
        placed.push(best ?? { ...target, width: cardWidth, height: cardHeight, rotation: 0 });
    }
    return placed;
}
