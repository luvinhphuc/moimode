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
		let galleryLocked = false;
		const syncLock = () => { if (galleryLocked) lenis.stop(); else lenis.start(); };
		const lockGalleryAnimation = () => { galleryLocked = true; syncLock(); };
		const unlockGalleryAnimation = () => { galleryLocked = false; syncLock(); };
		const scrollToTop = (event) => {
			event.preventDefault();
			lenis.scrollTo(0, {
				immediate: event.detail?.immediate,
				duration: 1.35,
				easing: (progress) => 1 - (1 - progress) ** 3,
				force: true,
			});
		};

		lenis.on("scroll", syncScroll);
		window.addEventListener("gallery-animation-lock", lockGalleryAnimation);
		window.addEventListener("gallery-animation-unlock", unlockGalleryAnimation);
		window.addEventListener("site-scroll-to-top", scrollToTop);
		syncLock();
		gsap.ticker.add(update);
		gsap.ticker.lagSmoothing(500, 33);
		ScrollTrigger.refresh(true);

		return () => {
			lenis.off("scroll", syncScroll);
			window.removeEventListener("gallery-animation-lock", lockGalleryAnimation);
			window.removeEventListener("gallery-animation-unlock", unlockGalleryAnimation);
			window.removeEventListener("site-scroll-to-top", scrollToTop);
			lenis.start();
			gsap.ticker.remove(update);
			lenis.destroy();
		};
	}, []);

	return children;
}

export default SmoothScroll;
