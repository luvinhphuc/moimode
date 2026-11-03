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
import { ABOUT_SPLIT_LAYOUTS } from "../config/aboutMotionConfig.js";

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
	const desktop = ABOUT_SPLIT_LAYOUTS.desktop[item.id];
	const mobile = ABOUT_SPLIT_LAYOUTS.mobile[item.id];
	const splitStyle = desktop
		? {
				"--about-desktop-top": desktop.top,
				"--about-desktop-right": desktop.right,
				"--about-desktop-bottom": desktop.bottom,
				"--about-desktop-left": desktop.left,
				"--about-mobile-top": mobile?.top ?? desktop.top,
				"--about-mobile-right": mobile?.right ?? desktop.right,
				"--about-mobile-bottom": mobile?.bottom ?? desktop.bottom,
				"--about-mobile-left": mobile?.left ?? desktop.left,
			}
		: undefined;

	return (
		<div
			className={`about-card about-card--${item.position} about-card--${item.size} about-card--${item.tone}`}
			data-about-card={item.id}
			data-entry={item.entry}
			style={splitStyle}
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
			{ABOUT_COLLAGE_ITEMS.filter((item) => item.isInitialStack).map((item) => (
				<AboutCard key={item.id} item={item} />
			))}
		</div>
	);
}

export default AboutCollage;
