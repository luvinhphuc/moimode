export const GALLERY_STACK_MOTION = Object.freeze({
    duration: 1150,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    hold: 280,
    stagger: 225,
    startX: 36,
    startY: 170,
    tilt: 0,
});

export const GALLERY_SPLIT_MOTION = Object.freeze({
    duration: 1350,
    easing: "cubic-bezier(0.65, 0, 0.35, 1)",
    hold: 180,
    midpointPull: 0.8,
    midpointX: 22.5,
    midpointY: -13.125,
    stagger: 70,
});

export const GALLERY_LAYOUT = Object.freeze({
    initialStackCapacity: 8,
    breakpoint: 768,
    shortHeight: 520,
    width: 220,
    height: 300,
    gap: 24,
    edge: 20,
    // Free composition: center X and center Y. All photos share one size, no rotation.
    slots: Object.freeze([
        [0.08, 0.20], [0.46, 0.06], [0.86, 0.28],
        [0.19, 0.55], [0.68, 0.49],
        [0.07, 0.85], [0.40, 0.94], [0.81, 0.90],
    ]),
    // Small flow-layout offsets also keep mobile photos out of aligned rows.
    scatter: Object.freeze([
        { x: -4, band: 0.1, rotation: 0 },
        { x: 3, band: 0.85, rotation: 0 },
        { x: -2, band: 0.35, rotation: 0 },
        { x: 5, band: 0.05, rotation: 0 },
        { x: -3, band: 0.75, rotation: 0 },
        { x: 2, band: 0.3, rotation: 0 },
        { x: -5, band: 0.55, rotation: 0 },
        { x: 4, band: 0.95, rotation: 0 },
    ]),
    selections: Object.freeze([[], [0], [0, 2], [0, 2, 6], [0, 2, 5, 7],
        [0, 2, 5, 7, 1], [0, 2, 5, 7, 3, 4], [0, 2, 5, 7, 3, 4, 1],
        [0, 1, 2, 3, 4, 5, 6, 7]]),
});

export const GALLERY_CTA_MOTION = Object.freeze({
    duration: 0.65,
    actionDuration: 0.55,
    actionDelay: 0.22,
    ease: "power2.out",
});
