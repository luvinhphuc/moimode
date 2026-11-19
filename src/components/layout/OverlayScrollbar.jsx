import { useEffect, useRef } from "react";

import "./OverlayScrollbar.css";

function OverlayScrollbar() {
	const thumbRef = useRef(null);
	const dragRef = useRef(null);

	useEffect(() => {
		const root = document.documentElement;
		const thumb = thumbRef.current;
		let frame = 0;

		const update = () => {
			frame = 0;
			const viewport = window.innerHeight;
			const scrollHeight = root.scrollHeight;
			const maxScroll = Math.max(0, scrollHeight - viewport);
			const locked = getComputedStyle(root).overflowY === "hidden" ||
				getComputedStyle(document.body).overflowY === "hidden";
			thumb.hidden = maxScroll <= 1 || locked;
			if (thumb.hidden) return;

			const height = Math.max(32, Math.min(viewport, viewport * viewport / scrollHeight));
			const travel = viewport - height;
			thumb.style.height = `${height}px`;
			thumb.style.transform = `translateY(${travel * window.scrollY / maxScroll}px)`;
		};
		const schedule = () => {
			if (!frame) frame = requestAnimationFrame(update);
		};
		const resizeObserver = new ResizeObserver(schedule);
		resizeObserver.observe(root);
		resizeObserver.observe(document.body);
		const mutationObserver = new MutationObserver(schedule);
		mutationObserver.observe(root, { attributes: true, attributeFilter: ["class", "style"] });
		mutationObserver.observe(document.body, { attributes: true, attributeFilter: ["class", "style"] });
		window.addEventListener("scroll", schedule, { passive: true });
		window.addEventListener("resize", schedule);
		schedule();

		return () => {
			cancelAnimationFrame(frame);
			resizeObserver.disconnect();
			mutationObserver.disconnect();
			window.removeEventListener("scroll", schedule);
			window.removeEventListener("resize", schedule);
		};
	}, []);

	const startDrag = (event) => {
		if (event.button !== 0) return;
		const viewport = window.innerHeight;
		const maxScroll = document.documentElement.scrollHeight - viewport;
		const travel = viewport - thumbRef.current.getBoundingClientRect().height;
		if (maxScroll <= 0 || travel <= 0) return;
		dragRef.current = { pointerY: event.clientY, scrollY: window.scrollY, maxScroll, travel };
		event.currentTarget.setPointerCapture(event.pointerId);
		event.preventDefault();
	};
	const drag = (event) => {
		const state = dragRef.current;
		if (!state) return;
		window.scrollTo({ top: state.scrollY + (event.clientY - state.pointerY) * state.maxScroll / state.travel, behavior: "instant" });
	};
	const stopDrag = () => { dragRef.current = null; };

	return (
		<div className="overlay-scrollbar" aria-hidden="true">
			<div
				ref={thumbRef}
				className="overlay-scrollbar__thumb"
				onPointerDown={startDrag}
				onPointerMove={drag}
				onPointerUp={stopDrag}
				onPointerCancel={stopDrag}
			/>
		</div>
	);
}

export default OverlayScrollbar;
