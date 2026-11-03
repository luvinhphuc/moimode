export const ABOUT_STACK_MOTION = Object.freeze({
	duration: 1150,
	easing: "cubic-bezier(0.22, 1, 0.36, 1)",
	hold: 280,
	stagger: 225,
	startX: 36,
	startY: 170,
	tilt: 11,
});

export const ABOUT_SPLIT_MOTION = Object.freeze({
	duration: 1350,
	easing: "cubic-bezier(0.65, 0, 0.35, 1)",
	hold: 180,
	midpointPull: 0.8,
	midpointX: 22.5,
	midpointY: -13.125,
	stagger: 70,
});

export const ABOUT_MOBILE_GALLERY_MOTION = Object.freeze({
	galleryScrollEnd: 0.5,
	titleFadeEnd: 0.2,
	titleFadeStart: 0.08,
});

// Edit only this map to reposition the cards after the stack splits.
// Use CSS values for the four edges; leave unused edges as "auto".
export const ABOUT_SPLIT_LAYOUTS = Object.freeze({
	desktop: Object.freeze({
		make: { top: "15%", right: "auto", bottom: "auto", left: "8%", rotation: 0 },
		play: { top: "8%", right: "auto", bottom: "auto", left: "43%", rotation: 0 },
		smile: { top: "14%", right: "9%", bottom: "auto", left: "auto", rotation: 0 },
		love: { top: "42%", right: "auto", bottom: "auto", left: "5%", rotation: 0 },
		move: { top: "40%", right: "4%", bottom: "auto", left: "auto", rotation: 0 },
		shine: { top: "auto", right: "auto", bottom: "11%", left: "11%", rotation: 0 },
		bloom: { top: "auto", right: "auto", bottom: "5%", left: "41%", rotation: 0 },
		dream: { top: "auto", right: "27%", bottom: "8%", left: "auto", rotation: 0 },
	}),
	mobile: Object.freeze({
		make: { top: "21svh", right: "auto", bottom: "auto", left: "6%", rotation: 0 },
		play: { top: "7svh", right: "6%", bottom: "auto", left: "auto", rotation: 0 },
		smile: { top: "58svh", right: "6%", bottom: "auto", left: "auto", rotation: 0 },
		love: { top: "69svh", right: "auto", bottom: "auto", left: "7%", rotation: 0 },
		move: { top: "121svh", right: "auto", bottom: "auto", left: "6%", rotation: 0 },
		shine: { top: "107svh", right: "6%", bottom: "auto", left: "auto", rotation: 0 },
		bloom: { top: "158svh", right: "6%", bottom: "auto", left: "auto", rotation: 0 },
		dream: { top: "169svh", right: "auto", bottom: "auto", left: "7%", rotation: 0 },
	}),
});
