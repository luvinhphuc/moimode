import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { createRgbTransition } from "./rgbTransition.js";

export default function useRgbTransition({ canvasRef, imageRef, secondarySrc, enabled, hovered, disabled }) {
	const rendererRef = useRef(null);
	const initializeRef = useRef(null);
	const [ready, setReady] = useState(false);
	const hoverRef = useRef(hovered);
	const disabledRef = useRef(disabled);

	useLayoutEffect(() => {
		hoverRef.current = hovered;
		disabledRef.current = disabled;
	}, [disabled, hovered]);

	useEffect(() => {
		if (!enabled) return undefined;
		const canvas = canvasRef.current;
		const image = imageRef.current;
		const secondary = new Image();
		secondary.crossOrigin = "anonymous";
		secondary.fetchPriority = "low";
		let cancelled = false;
		let attempted = false;
		let resizeObserver;
		let renderer;
		let preload;

		function release() {
			resizeObserver?.disconnect();
			renderer?.destroy();
			if (rendererRef.current === renderer) rendererRef.current = null;
			setReady(false);
		}
		function onContextLost(event) {
			event.preventDefault();
			release();
		}
		const prepareImages = () => {
			if (!preload) {
				secondary.src = secondarySrc;
				preload = Promise.all([image.decode(), secondary.decode()]).then(() => true, () => false);
			}
			return preload;
		};
		async function initialize() {
			if (attempted) return;
			const imagesReady = await prepareImages();
			if (!imagesReady || cancelled || attempted || disabledRef.current || !hoverRef.current) return;
			attempted = true;
			try {
				renderer = createRgbTransition(canvas, [image, secondary]);
				rendererRef.current = renderer;
				resizeObserver = new ResizeObserver(() => {
					try { renderer.resize(); } catch { release(); }
				});
				resizeObserver.observe(canvas);
				setReady(true);
				renderer.setTarget(1);
			} catch {
				if (!cancelled) release();
			}
		}
		initializeRef.current = initialize;
		const visibilityObserver = new IntersectionObserver(([entry]) => {
			if (!entry.isIntersecting) return;
			visibilityObserver.disconnect();
			prepareImages();
		}, { rootMargin: "750px 0px" });
		visibilityObserver.observe(canvas);
		canvas.addEventListener("webglcontextlost", onContextLost);
		return () => {
			cancelled = true;
			initializeRef.current = null;
			visibilityObserver.disconnect();
			canvas.removeEventListener("webglcontextlost", onContextLost);
			secondary.removeAttribute("src");
			release();
		};
	}, [canvasRef, imageRef, secondarySrc, enabled]);

	useEffect(() => {
		const renderer = rendererRef.current;
		if (disabled) renderer?.reset();
		else if (renderer) renderer.setTarget(hovered ? 1 : 0);
		else if (hovered) initializeRef.current?.();
	}, [disabled, enabled, hovered, secondarySrc]);

	return enabled && ready;
}
