import { useEffect, useRef, useState } from "react";

import { createRgbTransition } from "./rgbTransition.js";

export default function useRgbTransition({ canvasRef, imageRef, secondarySrc, enabled, hovered, disabled }) {
	const rendererRef = useRef(null);
	const [ready, setReady] = useState(false);
	const hoverRef = useRef(hovered);
	const disabledRef = useRef(disabled);
	hoverRef.current = hovered;
	disabledRef.current = disabled;

	useEffect(() => {
		if (!enabled) return undefined;
		const canvas = canvasRef.current;
		const image = imageRef.current;
		const secondary = new Image();
		secondary.crossOrigin = "anonymous";
		secondary.src = secondarySrc;
		let cancelled = false;
		let observer;
		let renderer;

		function release() {
			observer?.disconnect();
			renderer?.destroy();
			if (rendererRef.current === renderer) rendererRef.current = null;
			setReady(false);
		}
		function onContextLost(event) {
			event.preventDefault();
			release();
		}
		async function initialize() {
			try {
				await Promise.all([image.decode(), secondary.decode()]);
				if (cancelled) return;
				renderer = createRgbTransition(canvas, [image, secondary]);
				rendererRef.current = renderer;
				observer = new ResizeObserver(() => {
					try { renderer.resize(); } catch { release(); }
				});
				observer.observe(canvas);
				setReady(true);
				if (!disabledRef.current && hoverRef.current) renderer.setTarget(1);
			} catch {
				if (!cancelled) release();
			}
		}
		canvas.addEventListener("webglcontextlost", onContextLost);
		initialize();
		return () => {
			cancelled = true;
			canvas.removeEventListener("webglcontextlost", onContextLost);
			secondary.src = "";
			release();
		};
	}, [canvasRef, imageRef, secondarySrc, enabled]);

	useEffect(() => {
		if (disabled) rendererRef.current?.reset();
		else rendererRef.current?.setTarget(hovered ? 1 : 0);
	}, [hovered, disabled]);

	return enabled && ready;
}
