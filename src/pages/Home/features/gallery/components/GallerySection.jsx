import { useRef } from "react";

import useGalleryScrollAnimation from "../animations/useGalleryScrollAnimation.js";
import { GALLERY_ITEMS } from "../config/galleryContent.js";
import FisheyeGallery from "./FisheyeGallery.jsx";
import GalleryStack from "./GalleryStack.jsx";
import "../Gallery.css";

function GallerySection() {
	const rootRef = useRef(null);
	const fisheyeRef = useRef(null);

	useGalleryScrollAnimation(rootRef, fisheyeRef);

	return (
		<section
			ref={rootRef}
			id="gallery"
			className="gallery-transition-track"
			aria-labelledby="gallery-title"
		>
			<div className="gallery-sticky-viewport">
				<div className="gallery-panel">
					<GalleryStack />
					<FisheyeGallery ref={fisheyeRef} items={GALLERY_ITEMS} />
					<h2 id="gallery-title" data-gallery-title="">
						GALLERY
					</h2>
				</div>
			</div>
		</section>
	);
}

export default GallerySection;
