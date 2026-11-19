import { gsap, useGSAP } from "../../../utils/gsap.js";

export default function useStepEntrance(scope, step, phase) {
	useGSAP(() => {
		if (phase !== "customize" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		const root = scope.current;
		if (!root) return;
		const timeline = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
		const add = (selector, vars, position) => {
			const elements = root.querySelectorAll(selector);
			if (elements.length) timeline.from(elements, vars, position);
		};

		const heading = root.querySelector(".customizer-heading h1");
		if (heading) timeline.fromTo(heading, { clipPath: "inset(0 0 100% 0)", y: 14 }, { clipPath: "inset(0 0 0% 0)", y: 0, duration: 0.62 }, 0);
		add(".customizer-heading > span", { autoAlpha: 0, x: -10, duration: 0.48 }, 0.15);

		if (step === 1) {
			add(".style-card", { autoAlpha: 0, y: 38, rotation: -3, duration: 0.68, ease: "back.out(1.2)" }, 0.08);
			add(".style-card__scene", { scale: 0.92, duration: 0.65 }, 0.22);
			add(".style-card__radio", { scale: 0, rotation: -18, duration: 0.34, ease: "back.out(2)" }, 0.45);
		} else if (step === 2) {
			add(".color-group h2", { autoAlpha: 0, x: -12, duration: 0.42, stagger: 0.1 }, 0.12);
			add(".color-swatches button", { autoAlpha: 0, scale: 0.7, rotation: -8, duration: 0.38, stagger: 0.018, ease: "back.out(1.5)" }, 0.2);
			add(".product-paper", { autoAlpha: 0, x: 28, rotation: 2, duration: 0.62 }, 0.12);
			add(".product-paper__scene", { scale: 0.94, duration: 0.56 }, 0.22);
		} else if (step === 3) {
			add(".charms-stage", { autoAlpha: 0, y: 20, duration: 0.58 }, 0.08);
			add(".charm-catalog", { autoAlpha: 0, x: 28, duration: 0.6 }, 0.12);
			add(".charm-filters button", { autoAlpha: 0, y: 9, duration: 0.28, stagger: 0.045 }, 0.3);
			add(".charm-card:nth-child(-n+12)", { autoAlpha: 0, scale: 0.86, duration: 0.32, stagger: 0.035, ease: "back.out(1.4)" }, 0.33);
		} else {
			add(".preview-stage", { autoAlpha: 0, scale: 0.94, duration: 0.66 }, 0.08);
			add(".step-rail li", { autoAlpha: 0, x: -12, duration: 0.36, stagger: 0.07 }, 0.18);
			add(".customization-recap", { autoAlpha: 0, x: 24, rotation: 2, duration: 0.58 }, 0.18);
			add(".customization-recap > button, .recap-charms span", { autoAlpha: 0, y: 10, duration: 0.36, stagger: 0.08 }, 0.38);
		}

		const play = () => timeline.play();
		const overlayPhase = document.querySelector(".page-wipe")?.dataset.phase;
		if (overlayPhase === "covering" || overlayPhase === "covered") {
			window.addEventListener("moimode-transition-reveal", play, { once: true });
		} else play();
		return () => {
			window.removeEventListener("moimode-transition-reveal", play);
			timeline.kill();
		};
	}, { scope, dependencies: [step, phase], revertOnUpdate: true });
}
