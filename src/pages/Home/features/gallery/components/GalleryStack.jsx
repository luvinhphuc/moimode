import {
	Cloud,
	Flower2,
	Footprints,
	Heart,
	Smile,
	Sparkles,
	Star,
	WandSparkles,
} from "lucide-react";

import { GALLERY_ITEMS } from "../config/galleryContent.js";
import { GALLERY_SPLIT_LAYOUTS } from "../config/galleryMotionConfig.js";

const ICONS = Object.freeze({
	cloud: Cloud,
	flower: Flower2,
	footprints: Footprints,
	heart: Heart,
	smile: Smile,
	sparkles: Sparkles,
	star: Star,
	wand: WandSparkles,
});

function GalleryCard({ item }) {
	const Icon = ICONS[item.fallbackIcon] ?? Sparkles;
	const desktop = GALLERY_SPLIT_LAYOUTS.desktop[item.id];
	const mobile = GALLERY_SPLIT_LAYOUTS.mobile[item.id];
	const splitStyle = desktop
		? {
				"--gallery-desktop-top": desktop.top,
				"--gallery-desktop-right": desktop.right,
				"--gallery-desktop-bottom": desktop.bottom,
				"--gallery-desktop-left": desktop.left,
				"--gallery-mobile-top": mobile?.top ?? desktop.top,
				"--gallery-mobile-right": mobile?.right ?? desktop.right,
				"--gallery-mobile-bottom": mobile?.bottom ?? desktop.bottom,
				"--gallery-mobile-left": mobile?.left ?? desktop.left,
			}
		: undefined;

	return (
		<div
			className={`gallery-card gallery-card--${item.position} gallery-card--${item.size} gallery-card--${item.tone}`}
			data-gallery-card={item.id}
			data-entry={item.entry}
			style={splitStyle}
		>
			{item.src ? (
				<img
					className="gallery-card__image"
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
				className="gallery-card__icon"
				aria-hidden="true"
				hidden={Boolean(item.src)}
				strokeWidth={1.55}
			/>
		</div>
	);
}

function GalleryStack() {
	return (
		<div className="gallery-stack" data-gallery-stack="" aria-hidden="true">
			{GALLERY_ITEMS.filter((item) => item.isInitialStack).map((item) => (
				<GalleryCard key={item.id} item={item} />
			))}
		</div>
	);
}

export default GalleryStack;
