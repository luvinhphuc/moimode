import { gsap } from "../../../utils/gsap.js";

// The supplied scribble-reveal.html's continuous, arc-length sampled Paint stroke.
function pathFor({ x, y, width, height }, brush) {
	const count = Math.ceil(height / (brush * 0.61));
	const points = [];
	for (let row = 0; row <= count; row += 1) {
		const rowY = y - brush * 0.19 + (row * (height + brush * 0.38)) / count;
		const left = row % 2 === 0;
		const x0 = left ? -brush * 0.35 : width + brush * 0.35;
		const x1 = left ? width + brush * 0.35 : -brush * 0.35;
		for (let step = 0; step <= 8; step += 1) {
			const t = step / 8;
			points.push({
				x: x + x0 + (x1 - x0) * t,
				y:
					rowY +
					Math.sin(t * Math.PI * 2 + row * 1.3) * brush * 0.1 +
					Math.sin(t * Math.PI * 4 - row * 0.7) * brush * 0.035,
			});
		}
	}
	const samples = [];
	let total = 0;
	const append = (point) => {
		const last = samples.at(-1);
		if (last) total += Math.hypot(point.x - last.x, point.y - last.y);
		samples.push({ ...point, distance: total });
	};
	for (let index = 0; index < points.length - 1; index += 1) {
		const a = points[Math.max(index - 1, 0)];
		const b = points[index];
		const c = points[index + 1];
		const d = points[Math.min(index + 2, points.length - 1)];
		for (let step = 0; step < 14; step += 1) {
			const t = step / 14;
			const interpolate = (a, b, c, d) =>
				0.5 *
				(2 * b +
					(-a + c) * t +
					(2 * a - 5 * b + 4 * c - d) * t * t +
					(-a + 3 * b - 3 * c + d) * t * t * t);
			append({
				x: interpolate(a.x, b.x, c.x, d.x),
				y: interpolate(a.y, b.y, c.y, d.y),
			});
		}
	}
	append(points.at(-1));
	return { samples, total };
}

export default function createScribbleReveal(section) {
	const canvas = section.querySelector("[data-about-scribble-canvas]");
	const output = canvas.getContext("2d");
	const mask = document.createElement("canvas");
	const context = mask.getContext("2d");
	if (!output || !context) return { setActive() {}, destroy() {} };
	const portrait = canvas.parentElement;
	const image = portrait.querySelector("img");
	const imageAspectRatio =
		Number(image.getAttribute("width")) / Number(image.getAttribute("height"));
	const tipFill = getComputedStyle(section).backgroundColor;
	let imageBounds;
	let width = 0;
	let height = 0;
	let active = false;
	let path;
	let previous;
	let index;
	const brushProgress = { value: 0 };
	const tween = gsap.to(brushProgress, {
		value: 1,
		duration: 1.5,
		ease: "none",
		paused: true,
		onUpdate: drawStroke,
	});

	function render(tip) {
		output.clearRect(0, 0, width, height);
		if (!image.complete || !image.naturalWidth) return;
		const { x, y, width: imageWidth, height: imageHeight } = imageBounds;
		output.drawImage(image, x, y, imageWidth, imageHeight);
		// Erase the still-covered portion from the image, preserving transparent edges.
		output.globalCompositeOperation = "destination-out";
		output.drawImage(mask, 0, 0, width, height);
		output.globalCompositeOperation = "source-over";
		if (tip) {
			output.beginPath();
			output.arc(tip.x, tip.y, 5, 0, Math.PI * 2);
			output.fillStyle = tipFill;
			output.fill();
			output.strokeStyle = "#fff";
			output.lineWidth = 1.5;
			output.stroke();
		}
	}

	const onImageLoad = () => {
		if (imageBounds) render();
	};

	function reset() {
		tween.pause(0, true);
		context.globalCompositeOperation = "source-over";
		context.fillRect(0, 0, width, height);
		context.globalCompositeOperation = "destination-out";
		context.lineCap = "round";
		context.lineJoin = "round";
		// Keep the reference's brush-to-height ratio, including its overlapping passes.
		const brush = (imageBounds.height * 85) / 600;
		context.lineWidth = brush;
		path = pathFor(imageBounds, brush);
		previous = path.samples[0];
		index = 1;
		render();
		if (active) tween.play();
	}

	function drawStroke() {
		const progress = brushProgress.value;
		const target = progress * path.total;
		context.beginPath();
		context.moveTo(previous.x, previous.y);
		while (
			index < path.samples.length &&
			path.samples[index].distance <= target
		) {
			previous = path.samples[index++];
			context.lineTo(previous.x, previous.y);
		}
		if (index < path.samples.length) {
			const next = path.samples[index];
			const last = path.samples[index - 1];
			const t = (target - last.distance) / (next.distance - last.distance || 1);
			previous = {
				x: last.x + (next.x - last.x) * t,
				y: last.y + (next.y - last.y) * t,
			};
			context.lineTo(previous.x, previous.y);
		}
		context.stroke();
		if (progress === 1) context.clearRect(0, 0, width, height);
		render(progress < 1 ? previous : null);
	}

	function resize() {
		const bounds = portrait.getBoundingClientRect();
		if (!bounds.width || !bounds.height) return;
		if (width === bounds.width && height === bounds.height) return;
		width = bounds.width;
		height = bounds.height;
		const imageWidth = Math.min(width, height * imageAspectRatio);
		const imageHeight = imageWidth / imageAspectRatio;
		imageBounds = {
			x: (width - imageWidth) / 2,
			y: (height - imageHeight) / 2,
			width: imageWidth,
			height: imageHeight,
		};
		const ratio = Math.min(window.devicePixelRatio || 1, 2);
		canvas.width = Math.round(width * ratio);
		canvas.height = Math.round(height * ratio);
		mask.width = canvas.width;
		mask.height = canvas.height;
		output.setTransform(ratio, 0, 0, ratio, 0, 0);
		context.setTransform(ratio, 0, 0, ratio, 0, 0);
		reset();
	}

	resize();
	portrait.setAttribute("data-scribble-ready", "");
	image.addEventListener("load", onImageLoad);
	const observer = new ResizeObserver(resize);
	observer.observe(portrait);
	return {
		setActive(next) {
			if (active === next) return;
			active = next;
			if (!imageBounds) return;
			reset();
		},
		destroy() {
			tween.kill();
			observer.disconnect();
			image.removeEventListener("load", onImageLoad);
			portrait.removeAttribute("data-scribble-ready");
		},
	};
}
