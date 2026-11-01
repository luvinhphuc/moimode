import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

import { gsap, ScrollTrigger } from "../../../utils/gsap.js";

function SmoothScroll({ children }) {
	useEffect(() => {
		const lenis = new Lenis({ anchors: true });
		const update = (time) => lenis.raf(time * 1000);
		const syncScroll = () => ScrollTrigger.update();

		lenis.on("scroll", syncScroll);
		gsap.ticker.add(update);
		gsap.ticker.lagSmoothing(0);
		ScrollTrigger.refresh();

		return () => {
			lenis.off("scroll", syncScroll);
			gsap.ticker.remove(update);
			lenis.destroy();
		};
	}, []);

	return children;
}

export default SmoothScroll;
