import { MAGNETIC_LIMIT, MAGNETIC_RADIUS, MAGNETIC_STRENGTH } from "../config/magneticShapes.js";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/** Reserve the entire rotation/float/magnet envelope, not just the resting SVG. */
export function getShapePosition({ x, y, radius, width, height, exclusion, top = 88, edge = 8 }) {
    const minX = radius + edge;
    const maxX = width - radius - edge;
    const minY = top + radius;
    const maxY = height - radius - 20;
    if (minX > maxX || minY > maxY) return null;
    const fit = (point) => ({ x: clamp(point.x, minX, maxX), y: clamp(point.y, minY, maxY) });
    const target = fit({ x, y });
    if (!exclusion) return target;
    const safe = (point) => point.x + radius <= exclusion.x - 16
        || point.x - radius >= exclusion.x + exclusion.width + 16
        || point.y + radius <= exclusion.y - 16
        || point.y - radius >= exclusion.y + exclusion.height + 16;
    if (safe(target)) return target;
    return [
        { x: exclusion.x - radius - 16, y: target.y },
        { x: exclusion.x + exclusion.width + radius + 16, y: target.y },
        { x: target.x, y: exclusion.y - radius - 16 },
        { x: target.x, y: exclusion.y + exclusion.height + radius + 16 },
    ].map(fit).filter(safe).sort((a, b) =>
        Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0] ?? null;
}

export function getMagneticOffset(dx, dy, limit = MAGNETIC_LIMIT) {
    const distance = Math.hypot(dx, dy);
    if (distance >= MAGNETIC_RADIUS) return { x: 0, y: 0 };
    const strength = (1 - distance / MAGNETIC_RADIUS) * MAGNETIC_STRENGTH;
    const displacement = distance * strength;
    const factor = strength * (displacement > limit ? limit / displacement : 1);
    return { x: dx * factor, y: dy * factor };
}
