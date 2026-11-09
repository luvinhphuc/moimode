import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

import { gsap, ScrollTrigger } from "../../../utils/gsap.js";

function SmoothScroll({ children }) {
	useEffect(() => {
		window.scrollTo({ top: 0, left: 0, behavior: "auto" });
		const lenis = new Lenis({
			anchors: true,
			lerp: 0.08,
			wheelMultiplier: 0.5,
			touchMultiplier: 0.8,
			smoothWheel: true,
		});
		lenis.scrollTo(0, { immediate: true, force: true });
		const update = (time) => lenis.raf(time * 1000);
		const syncScroll = () => ScrollTrigger.update();
		const lockGalleryAnimation = () => lenis.stop();
		const unlockGalleryAnimation = () => lenis.start();

		lenis.on("scroll", syncScroll);
		window.addEventListener("gallery-animation-lock", lockGalleryAnimation);
		window.addEventListener("gallery-animation-unlock", unlockGalleryAnimation);
		gsap.ticker.add(update);
		gsap.ticker.lagSmoothing(500, 33);
		ScrollTrigger.refresh();

		return () => {
			lenis.off("scroll", syncScroll);
			window.removeEventListener("gallery-animation-lock", lockGalleryAnimation);
			window.removeEventListener("gallery-animation-unlock", unlockGalleryAnimation);
			lenis.start();
			gsap.ticker.remove(update);
			lenis.destroy();
		};
	}, []);

	return children;
}

export default SmoothScroll;
