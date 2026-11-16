export const FLIGHT_DURATION = 5.6;
export const JOURNEY_DURATION = 6.1;
export const SVG_NS = "http://www.w3.org/2000/svg";
export const ORBIT_STEPS = 512;
export const clamp = (value) => Math.max(0, Math.min(1, value));
export const mix = (start, end, progress) => start + (end - start) * progress;
export const smooth = (value) => { const t = clamp(value); return t * t * (3 - 2 * t); };
export const random = (seed) => { const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };

// A distance clock with gentle launch/landing and no direction reversal.
export function distanceAt(time) {
	const t = clamp(time), edge = .11, norm = 1 - edge;
	if (t < edge) return t * t / (2 * edge * norm);
	if (t > 1 - edge) return 1 - (1 - t) ** 2 / (2 * edge * norm);
	return (t - edge / 2) / norm;
}

export function timeAtDistance(distance) {
	const edge = .11, norm = 1 - edge, threshold = edge / (2 * norm);
	if (distance < threshold) return Math.sqrt(2 * edge * norm * distance);
	if (distance > 1 - threshold) return 1 - Math.sqrt(2 * edge * norm * (1 - distance));
	return distance * norm + edge / 2;
}

export function sampleOrbit({ width: w, heroTop, heroHeight: h, dockX, dockY, mobile }) {
	const point = (x, y) => [w * x, heroTop + h * y];
	// Outgoing controls continue the incoming tangent at every shared join.
	// Mobile keeps the arcs farther from the taller copy block.
	const controls = mobile
		? [
			point(-.12, .64),
			point(.02, .56), point(.02, .18), point(.20, .10),
			point(.38, .02), point(.62, .02), point(.80, .10),
			point(.98, .18), point(1.01, .54), point(.90, .76),
			point(.79, .98), point(.64, .98), point(.48, .92),
			point(.32, .86), [dockX + w * .10, dockY - h * .12], [dockX, dockY],
		]
		: [
			point(-.045, .65),
			point(.025, .60), point(.035, .14), point(.20, .105),
			point(.365, .07), point(.62, -.035), point(.80, .09),
			point(.98, .215), point(.99, .51), point(.90, .715),
			point(.81, .92), point(.66, .94), point(.48, .885),
			point(.30, .83), [dockX + w * .08, dockY - h * .14], [dockX, dockY],
		];

	// Sample each cubic in JS, then resample at even distances for constant-time
	// lookups during the flight. SVG geometry queries can force a layout flush.
	const curve = [{ x: controls[0][0], y: controls[0][1], distance: 0 }];
	let length = 0;
	for (let start = 0; start < controls.length - 1; start += 3) {
		const [a, b, c, d] = controls.slice(start, start + 4);
		for (let step = 1; step <= 128; step++) {
			const t = step / 128;
			const s = 1 - t;
			const x = s ** 3 * a[0] + 3 * s * s * t * b[0] + 3 * s * t * t * c[0] + t ** 3 * d[0];
			const y = s ** 3 * a[1] + 3 * s * s * t * b[1] + 3 * s * t * t * c[1] + t ** 3 * d[1];
			const previous = curve.at(-1);
			length += Math.hypot(x - previous.x, y - previous.y);
			curve.push({ x, y, distance: length });
		}
	}

	let segment = 1;
	const orbit = Array.from({ length: ORBIT_STEPS + 1 }, (_, index) => {
		const distance = (index / ORBIT_STEPS) * length;
		while (curve[segment].distance < distance) segment++;
		const before = curve[segment - 1];
		const after = curve[segment];
		const t = (distance - before.distance) / (after.distance - before.distance);
		return { x: mix(before.x, after.x, t), y: mix(before.y, after.y, t), angle: 0 };
	});
	for (let i = 0; i <= ORBIT_STEPS; i++) {
		const before = orbit[Math.max(0, i - 1)];
		const after = orbit[Math.min(ORBIT_STEPS, i + 1)];
		const angle = Math.atan2(after.y - before.y, after.x - before.x) * 180 / Math.PI + 45;
		orbit[i].angle = i ? angle + 360 * Math.round((orbit[i - 1].angle - angle) / 360) : angle;
	}
	return orbit;
}
