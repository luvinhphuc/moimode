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
		const lockAboutAnimation = () => lenis.stop();
		const unlockAboutAnimation = () => lenis.start();

		lenis.on("scroll", syncScroll);
		window.addEventListener("about-animation-lock", lockAboutAnimation);
		window.addEventListener("about-animation-unlock", unlockAboutAnimation);
		gsap.ticker.add(update);
		gsap.ticker.lagSmoothing(500, 33);
		ScrollTrigger.refresh();

		return () => {
			lenis.off("scroll", syncScroll);
			window.removeEventListener("about-animation-lock", lockAboutAnimation);
			window.removeEventListener("about-animation-unlock", unlockAboutAnimation);
			lenis.start();
			gsap.ticker.remove(update);
			lenis.destroy();
		};
	}, []);

	return children;
}

export default SmoothScroll;
