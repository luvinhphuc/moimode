import { useRef, useState } from "react";

import useRgbTransition from "../animations/useRgbTransition.js";

function RgbPhoto({ images, canHover, reducedMotion, hovered, disabled, visible }) {
	const imageRef = useRef(null);
	const canvasRef = useRef(null);
	const [imageFailed, setImageFailed] = useState(false);
	const [secondaryReady, setSecondaryReady] = useState(false);
	const secondary = images[1];
	const eligible = Boolean(secondary && canHover && visible && !imageFailed);
	const ready = useRgbTransition({
		canvasRef,
		imageRef,
		secondarySrc: secondary?.src,
		enabled: eligible && !reducedMotion,
		hovered,
		disabled,
	});
	const showSecondary = eligible && reducedMotion && secondaryReady && hovered && !disabled;

	return (
		<span className="rgb-photo">
			{imageFailed && <span className="rgb-photo__fallback">Photo unavailable</span>}
			<img
				ref={imageRef}
				src={images[0].src}
				alt={images[0].alt}
				width="460"
				height="620"
				loading="lazy"
				decoding="async"
				draggable="false"
				onError={() => setImageFailed(true)}
				className={`rgb-photo__image${imageFailed ? " rgb-photo__image--hidden" : ""}`}
			/>
			{eligible && reducedMotion && (
				<img
					src={secondary.src}
					alt=""
					aria-hidden="true"
					draggable="false"
					onLoad={() => setSecondaryReady(true)}
					onError={() => setSecondaryReady(false)}
					className={`rgb-photo__image${showSecondary ? "" : " rgb-photo__image--hidden"}`}
				/>
			)}
			{eligible && !reducedMotion && (
				<canvas ref={canvasRef} aria-hidden="true" className={`rgb-photo__canvas${ready ? " rgb-photo__canvas--ready" : ""}`} />
			)}
		</span>
	);
}

export default RgbPhoto;
