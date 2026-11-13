export const ABOUT_MOTION_MEDIA = Object.freeze({
	pinned: "(min-width: 1024px) and (min-height: 640px)",
	isDesktop: "(min-width: 1024px)",
	isTablet: "(min-width: 768px) and (max-width: 1023px)",
	isMobile: "(max-width: 767px)",
	reduceMotion: "(prefers-reduced-motion: reduce)",
});

export const ABOUT_TITLE_MOTION = Object.freeze({
	start: 0.2,
	duration: 0.8,
	finalScale: 0.5,
});

// One timeline unit per panel. The title uses the unit before panel 01.
export const ABOUT_DECK_MOTION = Object.freeze({
	firstReveal: { start: 0.64, duration: 0.32, y: 30 },
	firstHandoffStart: 1.8,
	wipe: { duration: 0.26, ease: "power2.inOut" },
	panelReveal: { duration: 0.33, ease: "power2.out", y: 18 },
	textReveal: { titleDuration: 0.28, copyDuration: 0.42, stagger: 0.08 },
	challengeTravel: 0.035,
});

export const ABOUT_FLOW_MOTION = Object.freeze({
	revealStart: "top 78%",
	who: {
		scrollStart: "top 88%",
		scrollEnd: "top 46%",
		label: { start: 0, duration: 0.42 },
		title: { start: 0.08, duration: 0.62 },
		copy: { start: 0.7, duration: 0.56 },
	},
	challenge: {
		label: { start: 0, duration: 0.38 },
		title: { start: 0.08, duration: 0.6, stagger: 0.12 },
		copy: { start: 0.8, duration: 0.5 },
		scrollStart: "top bottom",
		scrollEnd: "bottom top",
		scrub: 0.6,
		travel: { desktop: 0.06, tablet: 0.03, mobile: 0.01 },
	},
	mission: {
		label: { start: 0, duration: 0.4 },
		firstLine: { start: 0.08, duration: 0.58 },
		secondLine: { start: 0.2, duration: 0.58 },
		copy: { start: 0.78, duration: 0.56 },
	},
	experience: {
		label: { start: 0, duration: 0.38 },
		title: { start: 0.08, duration: 0.62 },
		mini: { start: 0.7, duration: 0.62 },
		copy: { start: 0.7, duration: 0.52, stagger: 0.12 },
		disclaimer: { start: 1.34, duration: 0.35 },
	},
});
