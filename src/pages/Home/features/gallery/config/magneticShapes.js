// Reuse the brand's silhouettes and theme colors; the first four also compose mobile.
export const MAGNETIC_SHAPES = Object.freeze([
    { type: "flower", color: "coral", size: 164, rotation: -18, x: 0.19, y: 0.22, dx: 12, dy: -16, duration: 3.7 },
    { type: "butterfly", color: "sage", size: 126, rotation: 24, x: 0.78, y: 0.20, dx: -10, dy: 18, duration: 4.4 },
    { type: "saturn", color: "gold", size: 146, rotation: 14, x: 0.23, y: 0.79, dx: -14, dy: 12, duration: 4.1 },
    { type: "softStar", color: "sky", size: 172, rotation: -12, x: 0.80, y: 0.78, dx: 16, dy: -10, duration: 4.9 },
    { type: "mushroom", color: "orange", size: 112, rotation: -26, x: 0.08, y: 0.50, dx: 10, dy: 14, duration: 3.3 },
    { type: "sunburst", color: "gold", size: 116, rotation: 17, x: 0.92, y: 0.47, dx: -12, dy: -16, duration: 4.6 },
    { type: "fourPetal", color: "sage", size: 58, rotation: 10, x: 0.49, y: 0.14, dx: 10, dy: 12, duration: 3.9 },
    { type: "ribbonLoop", color: "coral", size: 66, rotation: -8, x: 0.53, y: 0.88, dx: -10, dy: -14, duration: 4.7 },
]);

export const MAGNETIC_RADIUS = 250;
export const MAGNETIC_STRENGTH = 0.25;
export const MAGNETIC_LIMIT = 32;
