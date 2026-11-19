import { Shape } from "../../../components/Shapes.jsx";

const motifs = [
	["groovyBlob", "coral", -18],
	["sparkle", "gold", 12],
	["wavyRing", "turquoise", 22],
	["squiggle", "sage", -25],
	["sunburst", "orange", 15],
];

function CustomizerDecor() {
	return (
		<div className="customizer-decor" aria-hidden="true">
			{motifs.map(([type, color, rotate]) => (
				<Shape
					key={type}
					type={type}
					width="100%"
					color={`var(--color-moi-${color})`}
					rotate={rotate}
					focusable="false"
				/>
			))}
		</div>
	);
}

export default CustomizerDecor;
