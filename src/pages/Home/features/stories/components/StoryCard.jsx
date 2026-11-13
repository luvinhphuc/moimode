import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

import RgbPhoto from "./RgbPhoto.jsx";

function StoryCard({
	item,
	visible,
	canHover,
	reducedMotion,
	suppressClickRef,
}) {
	const [flipped, setFlipped] = useState(false);
	const [flipping, setFlipping] = useState(false);
	const [hovered, setHovered] = useState(false);
	const flipTimerRef = useRef(null);
	const backRef = useRef(null);

	useEffect(() => () => clearTimeout(flipTimerRef.current), []);
	useEffect(() => {
		if (!visible) {
			clearTimeout(flipTimerRef.current);
			setFlipped(false);
			setFlipping(false);
			setHovered(false);
		}
	}, [visible]);
	useEffect(() => {
		if (!canHover) setHovered(false);
	}, [canHover]);
	useEffect(() => {
		if (reducedMotion) {
			clearTimeout(flipTimerRef.current);
			setFlipping(false);
		}
	}, [reducedMotion]);

	function flip(event) {
		if (!visible || (event.detail !== 0 && suppressClickRef.current)) return;
		setHovered(false);
		setFlipped((current) => !current);
		setFlipping(!reducedMotion);
		clearTimeout(flipTimerRef.current);
		if (!reducedMotion)
			flipTimerRef.current = setTimeout(() => setFlipping(false), 600);
	}

	function handleKeyDown(event) {
		if (
			!flipped ||
			!["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End"].includes(
				event.key,
			)
		)
			return;
		event.preventDefault();
		const back = backRef.current;
		const direction = ["ArrowUp", "PageUp"].includes(event.key) ? -1 : 1;
		if (event.key === "Home") back.scrollTop = 0;
		else if (event.key === "End") back.scrollTop = back.scrollHeight;
		else
			back.scrollTop +=
				direction * (event.key.startsWith("Page") ? back.clientHeight : 40);
	}

	return (
		<button
			type="button"
			className={`story-card${flipped ? " story-card--flipped" : ""}${visible ? "" : " story-card--inactive"}`}
			onClick={flip}
			onKeyDown={handleKeyDown}
			onPointerEnter={(event) => {
				if (
					event.pointerType === "mouse" &&
					canHover &&
					!flipped &&
					!flipping &&
					visible
				)
					setHovered(true);
			}}
			onPointerLeave={() => setHovered(false)}
			onPointerDown={(event) => {
				if (event.pointerType !== "mouse") setHovered(false);
			}}
			aria-label={`${flipped ? "Back to photo" : "Read the story"} by ${item.username}`}
			aria-pressed={flipped}
			aria-describedby={flipped ? `story-copy-${item.id}` : undefined}
			tabIndex={visible ? 0 : -1}
			data-flipped={flipped}
			data-visible={visible}
		>
			<span
				className="story-card__rotator"
				onTransitionEnd={(event) => {
					if (
						event.target === event.currentTarget &&
						event.propertyName === "transform"
					) {
						clearTimeout(flipTimerRef.current);
						setFlipping(false);
					}
				}}
			>
				<span
					className="story-card__face story-card__face--front"
					aria-hidden={flipped}
				>
					<span className="story-card__photo">
						<RgbPhoto
							images={item.images}
							canHover={canHover}
							reducedMotion={reducedMotion}
							hovered={hovered}
							disabled={flipped || flipping || !visible}
							visible={visible}
						/>
					</span>
					<span className="story-card__caption">
						<span className="story-card__username">{item.username}</span>
						<span className="story-card__hint">
							<RotateCcw size={11} aria-hidden="true" /> Flip for the story
						</span>
					</span>
				</span>
				<span
					className="story-card__face story-card__face--back"
					aria-hidden={!flipped}
				>
					<span className="story-card__back-header">
						<span></span>
					</span>
					<span
						ref={backRef}
						id={`story-copy-${item.id}`}
						data-lenis-prevent
						className="story-card__story"
					>
						{item.story}
					</span>
					<span className="story-card__signature">{item.username}</span>
					<span className="story-card__hint story-card__hint--back">
						<RotateCcw size={11} aria-hidden="true" /> Back to the photo
					</span>
				</span>
			</span>
		</button>
	);
}

export default StoryCard;
