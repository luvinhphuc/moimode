import {
	Cloud,
	Flower2,
	Footprints,
	Heart,
	Palette,
	Smile,
	Sparkles,
	Star,
	WandSparkles,
} from "lucide-react";

import { ABOUT_COLLAGE_ITEMS } from "../config/aboutContent.js";

const ICONS = Object.freeze({
	cloud: Cloud,
	flower: Flower2,
	footprints: Footprints,
	heart: Heart,
	palette: Palette,
	smile: Smile,
	sparkles: Sparkles,
	star: Star,
	wand: WandSparkles,
});

function AboutCard({ item }) {
	const Icon = ICONS[item.fallbackIcon] ?? Sparkles;

	return (
		<div
			className={`about-card about-card--${item.position} about-card--${item.size} about-card--${item.tone}`}
			data-about-card=""
			data-entry={item.entry}
			data-rotation={item.rotation}
			style={{ "--about-card-rotation": `${item.rotation}deg` }}
		>
			{item.src ? (
				<img
					className="about-card__image"
					src={item.src}
					alt={item.alt}
					decoding="async"
					onError={(event) => {
						event.currentTarget.hidden = true;
						event.currentTarget.nextElementSibling?.removeAttribute("hidden");
					}}
				/>
			) : null}
			<Icon
				className="about-card__icon"
				aria-hidden="true"
				hidden={Boolean(item.src)}
				strokeWidth={1.55}
			/>
		</div>
	);
}

function AboutCollage() {
	return (
		<div className="about-collage" data-hero="about-collage" aria-hidden="true">
			{ABOUT_COLLAGE_ITEMS.map((item) => (
				<AboutCard key={item.id} item={item} />
			))}
		</div>
	);
}

export default AboutCollage;
