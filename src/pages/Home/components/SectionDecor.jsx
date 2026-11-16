import { Shape } from "../../../components/Shapes.jsx";
import "./SectionDecor.css";

const colorClasses = {
	bg: "text-moi-bg",
	coral: "text-moi-coral",
	gold: "text-moi-gold",
	orange: "text-moi-orange",
	sage: "text-moi-sage",
	sky: "text-moi-sky",
	turquoise: "text-moi-turquoise",
};

const motifs = {
	who: [
		["ribbonBow", "coral", -18],
		["sparkle", "gold", 12],
	],
	challenge: [
		["wavyRing", "turquoise", -22],
		["lightning", "gold", 14],
	],
	mission: [
		["daisy", "sage", 16],
		["twinSparkle", "bg", -12],
	],
	experience: [
		["groovyWave", "sky", -19],
		["puzzle", "orange", 19],
	],
	people: [
		["puffyHeart", "coral", -18],
		["luckyClover", "sage", 20],
		["wonkyStar", "turquoise", -22],
		["cloud", "bg", -12],
		["lightning", "gold", 14],
		["butterfly", "sky", 14],
		["retroStar", "sky", 32],
		["wonkyStar", "coral", 32],
	],
	"people-journey": [
		["butterfly", "sky", -22],
		["daisy", "gold", 18],
		["saturn", "coral", -16],
		["squiggle", "sage", 24],
		["organicDiamond", "orange", -12],
		["ribbonLoop", "sky", 18],
	],
	stories: [
		["shootingStar", "gold", -12],
		["retroStar", "bg", 12],
	],
};

export default function SectionDecor({ variant }) {
	return (
		<div
			className={`section-decor section-decor--${variant}`}
			aria-hidden="true"
		>
			{motifs[variant].map(([type, color, rotate]) => (
				<Shape
					key={type}
					type={type}
					className={colorClasses[color]}
					color="currentColor"
					rotate={rotate}
					focusable="false"
				/>
			))}
		</div>
	);
}
