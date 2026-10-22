import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

import { gsap } from "../lib/gsap.js";

function SmoothScroll({ children }) {
	useEffect(() => {
		const lenis = new Lenis({ anchors: true });
		const update = (time) => lenis.raf(time * 1000);

		gsap.ticker.add(update);
		gsap.ticker.lagSmoothing(0);

		return () => {
			gsap.ticker.remove(update);
			lenis.destroy();
		};
	}, []);

	return children;
}

export default SmoothScroll;
