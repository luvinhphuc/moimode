import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import SectionDecor from "../../../components/SectionDecor.jsx";
import useStoryEnvironment from "../animations/useStoryEnvironment.js";
import useStoryRevealAnimation from "../animations/useStoryRevealAnimation.js";
import { STORY_ITEMS } from "../config/storyContent.js";
import StoryCard from "./StoryCard.jsx";
import "../Stories.css";

function StorySection({ items = STORY_ITEMS }) {
	const rootRef = useRef(null);
	const trackRef = useRef(null);
	const gestureRef = useRef(null);
	const suppressClickRef = useRef(false);
	const leadingIndexRef = useRef(0);
	const strideRef = useRef(0);
	const { isDesktop, isWideDesktop, canHover, reducedMotion } = useStoryEnvironment();
	const [activeIndex, setActiveIndex] = useState(0);
	const visibleCount = isWideDesktop ? 4 : isDesktop ? 3 : 1;
	const hasMoreStories = items.length > visibleCount;
	const lastIndex = Math.max(0, items.length - visibleCount);
	const currentIndex = Math.min(activeIndex, lastIndex);
	useStoryRevealAnimation(rootRef, items);

	useEffect(() => {
		const track = trackRef.current;
		if (!track) return undefined;
		let frame = 0;
		const measureStride = () => {
			const first = track.children[0];
			const second = track.children[1];
			strideRef.current = second
				? second.offsetLeft - first.offsetLeft
				: track.clientWidth;
		};
		const updateIndex = (next) => {
			if (next === leadingIndexRef.current) return;
			leadingIndexRef.current = next;
			setActiveIndex(next);
		};
		const syncIndex = () => {
			frame = 0;
			if (strideRef.current) {
				updateIndex(Math.min(
					lastIndex,
					Math.max(0, Math.round(track.scrollLeft / strideRef.current)),
				));
			}
		};
		const onScroll = () => {
			if (!frame) frame = requestAnimationFrame(syncIndex);
		};
		const realign = () => {
			// Keep the same leading story when the viewport crosses a breakpoint.
			measureStride();
			const next = Math.min(leadingIndexRef.current, lastIndex);
			track.scrollTo({ left: next * strideRef.current, behavior: "instant" });
			updateIndex(next);
		};
		realign();
		const observer = new ResizeObserver(realign);
		observer.observe(track);
		track.addEventListener("scroll", onScroll, { passive: true });
		return () => {
			cancelAnimationFrame(frame);
			observer.disconnect();
			track.removeEventListener("scroll", onScroll);
		};
	}, [items.length, lastIndex, visibleCount]);

	function navigate(direction) {
		const track = trackRef.current;
		const next = Math.max(
			0,
			Math.min(lastIndex, currentIndex + direction * visibleCount),
		);
		track.scrollTo({
			left: next * strideRef.current,
			behavior: reducedMotion ? "instant" : "smooth",
		});
	}

	if (!items.length) return null;

	return (
		<section
			ref={rootRef}
			id="the-story-behind"
			aria-labelledby="stories-title"
			className="stories-section"
		>
			<div data-story-content className="stories-section__content">
				<div className="stories-section__header">
					<SectionDecor variant="stories" />
					<div data-story-reveal-group="heading">
						<h2
							data-story-reveal
							id="stories-title"
							className="stories-section__title"
						>
							THE STORY
							<br />
							BEHIND
						</h2>
					</div>
				</div>
				<div
					ref={trackRef}
					id="stories-track"
					data-story-reveal-group="cards"
					role="group"
					aria-roledescription="carousel"
					aria-label="Personal style stories"
					className={`stories-section__track${hasMoreStories ? "" : " stories-section__track--centered"}`}
					onPointerDownCapture={(event) => {
						gestureRef.current = { x: event.clientX, y: event.clientY };
						suppressClickRef.current = false;
					}}
					onPointerMoveCapture={(event) => {
						const start = gestureRef.current;
						if (
							start &&
							Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8
						)
							suppressClickRef.current = true;
					}}
					onPointerUpCapture={() => {
						gestureRef.current = null;
					}}
					onPointerCancelCapture={() => {
						suppressClickRef.current = true;
						gestureRef.current = null;
					}}
				>
					{items.map((item, index) => {
						const visible =
							index >= currentIndex && index < currentIndex + visibleCount;
						return (
							<div
								data-story-reveal
								key={item.id}
								role="group"
								aria-roledescription="slide"
								aria-label={`${index + 1} of ${items.length}`}
								aria-hidden={!visible}
								inert={!visible}
								className="stories-section__slide"
							>
								<StoryCard
									item={item}
									visible={visible}
									canHover={canHover}
									reducedMotion={reducedMotion}
									suppressClickRef={suppressClickRef}
								/>
							</div>
						);
					})}
				</div>
				{hasMoreStories && (
					<div
						data-story-reveal-group="navigation"
						className="stories-section__navigation"
					>
						<div data-story-reveal className="stories-section__nav-controls">
							<button
								type="button"
								aria-label="Previous stories"
								aria-controls="stories-track"
								disabled={currentIndex === 0}
								onClick={() => navigate(-1)}
								className="stories-section__nav-button"
							>
								<ArrowLeft size={18} aria-hidden="true" />
							</button>
							<p
								role="status"
								aria-live="polite"
								aria-atomic="true"
								className="stories-section__position"
							>
								<span className="stories-section__sr-only">Stories </span>
								{currentIndex + 1}
								{visibleCount > 1 && items.length > 1
									? `–${Math.min(currentIndex + visibleCount, items.length)}`
									: ""}
								<span aria-hidden="true"> / </span>
								<span className="stories-section__sr-only"> of </span>
								{items.length}
							</p>
							<button
								type="button"
								aria-label="Next stories"
								aria-controls="stories-track"
								disabled={currentIndex === lastIndex}
								onClick={() => navigate(1)}
								className="stories-section__nav-button"
							>
								<ArrowRight size={18} aria-hidden="true" />
							</button>
						</div>
					</div>
				)}
			</div>
		</section>
	);
}

export default StorySection;
