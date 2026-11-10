import { useId } from "react";

function SketchArrow({ ref, className, outlined = false }) {
	const arrowId = useId();

	return (
		<svg ref={ref} className={className} aria-hidden="true" preserveAspectRatio="none">
			{outlined && <use className="sketch-arrow__outline" href={`#${arrowId}`} />}
			<g id={outlined ? arrowId : undefined}>
				<path className="sketch-arrow__line" />
				<g className="sketch-arrow__head">
					<path d="M -11 -6 L 0 0 L -11 6" />
				</g>
			</g>
		</svg>
	);
}

export default SketchArrow;
