import { useRef } from "react";

import useAboutScrollAnimation from "../animations/useAboutScrollAnimation.js";
import { ABOUT_COLLAGE_ITEMS } from "../config/aboutContent.js";
import AboutCollage from "./AboutCollage.jsx";
import FisheyeCollage from "./FisheyeCollage.jsx";

function AboutSection() {
	const rootRef = useRef(null);
	const fisheyeRef = useRef(null);

	useAboutScrollAnimation(rootRef, fisheyeRef);

	return (
		<section
			ref={rootRef}
			id="about"
			className="about-transition-track"
			aria-labelledby="about-title"
		>
			<div className="about-sticky-viewport">
				<div className="about-panel">
					<AboutCollage />
					<FisheyeCollage ref={fisheyeRef} items={ABOUT_COLLAGE_ITEMS} />
					<h2 id="about-title" data-about-title="">
						ABOUT US
					</h2>
				</div>
			</div>
		</section>
	);
}

export default AboutSection;
