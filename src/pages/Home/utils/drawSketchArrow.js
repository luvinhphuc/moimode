export function drawSketchArrow(path, head, startX, startY, endX, endY) {
	const distance = Math.hypot(endX - startX, endY - startY);
	const curl = Math.min(18, Math.max(10, distance * 0.08));
	const angle = (Math.atan2(endY - startY, endX - startX) * 180) / Math.PI;
	const p = (fraction) => (distance * fraction).toFixed(1);

	path.setAttribute(
		"d",
		[
			"M 0 0",
			`C ${p(0.1)} -6, ${p(0.23)} 10, ${p(0.33)} 9`,
			`C ${p(0.45)} 7, ${p(0.46)} ${-curl}, ${p(0.38)} ${-curl}`,
			`C ${p(0.28)} ${-curl}, ${p(0.3)} ${curl}, ${p(0.49)} ${(curl * 0.65).toFixed(1)}`,
			`C ${p(0.69)} ${(curl * 0.35).toFixed(1)}, ${p(0.82)} -5, ${distance.toFixed(1)} 0`,
		].join(" "),
	);
	path.setAttribute("transform", `translate(${startX} ${startY}) rotate(${angle})`);
	head.setAttribute("transform", `translate(${endX} ${endY}) rotate(${angle})`);
}
