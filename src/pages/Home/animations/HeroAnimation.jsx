import { useEffect, useRef } from "react";
import { SplitText } from "gsap/SplitText";

import { gsap, useGSAP } from "../../../utils/gsap.js";
import { CROCS_TRANSITION_POSE } from "../config/sceneConfig.js";

gsap.registerPlugin(SplitText);

const SELECTORS = Object.freeze({
	backdrop: '[data-hero="backdrop"]',
	introMark: '[data-hero="intro-mark"]',
	introProgress: '[data-hero="intro-progress"]',
	makeText: '[data-hero="make-text"]',
	modelMotion: '[data-hero="model-motion"]',
	yoursText: '[data-hero="yours-text"]',
});

function getIntroStartScale(mark) {
	const radius = mark.offsetWidth / 2;
	if (!radius) return 1;

	return (Math.hypot(window.innerWidth, window.innerHeight) / radius) * 1.2;
}

function getIntroExitOffset() {
	return -Math.min(window.innerHeight * 0.64, 640);
}

function getCenterOffset(element) {
	const rect = element.getBoundingClientRect();
	return {
		x: window.innerWidth / 2 - (rect.left + rect.width / 2),
		y: window.innerHeight / 2 - (rect.top + rect.height / 2),
	};
}

function query(root, selector) {
	return root?.querySelector(selector);
}

function HeroAnimation({
	hasSceneError,
	isHeroReady,
	isIntroDone,
	isSceneReady,
	onHeroReady,
	onIntroComplete,
	onModelSettled,
	rootRef,
	transitionControlRef,
}) {
	const introStartedRef = useRef(false);

	useGSAP(
		() => {
			const root = rootRef.current;
			const mark = query(root, SELECTORS.introMark);
			if (!root || !mark) return undefined;

			const setStartScale = () => {
				if (!introStartedRef.current) {
					gsap.set(mark, { scale: getIntroStartScale(mark) });
				}
			};

			setStartScale();
			window.addEventListener("resize", setStartScale);

			return () => window.removeEventListener("resize", setStartScale);
		},
		{ scope: rootRef },
	);

	useEffect(() => {
		if (isIntroDone) return undefined;

		document.body.classList.add("is-model-loading");
		return () => document.body.classList.remove("is-model-loading");
	}, [isIntroDone]);

	useGSAP(
		() => {
			if (!isSceneReady || hasSceneError) return undefined;

			const root = rootRef.current;
			const mark = query(root, SELECTORS.introMark);
			const progress = query(root, SELECTORS.introProgress);
			const modelMotion = query(root, SELECTORS.modelMotion);

			if (!mark || !progress || !modelMotion) return undefined;

			const media = gsap.matchMedia();
			media.add(
				{
					reduceMotion: "(prefers-reduced-motion: reduce)",
					standardMotion: "(prefers-reduced-motion: no-preference)",
				},
				(context) => {
					if (context.conditions.reduceMotion) {
						gsap.set(modelMotion, { y: 0 });
						gsap.set([mark, progress], { autoAlpha: 0 });
						onIntroComplete();
						return undefined;
					}

					introStartedRef.current = true;
					const motionRect = modelMotion.getBoundingClientRect();
					gsap.set(modelMotion, {
						y: -(window.innerHeight + motionRect.height),
					});

					const timeline = gsap.timeline({
						defaults: { ease: "power3.inOut" },
						onComplete: onIntroComplete,
					});

					timeline
						.addLabel("handover")
						.to(progress, { autoAlpha: 0, duration: 0.3 }, "handover")
						.to(mark, { scale: 1, duration: 1.35 }, "handover+=0.08")
						.to(
							mark,
							{
								duration: 0.62,
								y: getIntroExitOffset(),
							},
							">+0.08",
						);

					return () => {
						timeline.kill();
						introStartedRef.current = false;
					};
				},
			);

			return () => media.revert();
		},
		{
			dependencies: [hasSceneError, isSceneReady, onIntroComplete],
			revertOnUpdate: true,
			scope: rootRef,
		},
	);

	useGSAP(
		() => {
			if (!isIntroDone) return undefined;

			const root = rootRef.current;
			const modelMotion = query(root, SELECTORS.modelMotion);
			const words = [
				query(root, SELECTORS.makeText),
				query(root, SELECTORS.yoursText),
			];

			if (!modelMotion || words.some((item) => !item)) return undefined;

			const media = gsap.matchMedia();
			media.add(
				{
					base: "(min-width: 0px)",
					reduceMotion: "(prefers-reduced-motion: reduce)",
				},
				(context) => {
					if (context.conditions.reduceMotion) {
						gsap.set(modelMotion, { y: 0 });
						gsap.set(words, {
							autoAlpha: 1,
							rotation: 0,
							scale: 1,
							x: 0,
							y: 0,
						});
						onModelSettled?.();
						onHeroReady?.();
						return undefined;
					}

					const wordSplit = words.map((word) =>
						SplitText.create(word, { aria: "none", type: "words" }),
					);
					const splitWords = wordSplit.flatMap((split) => split.words);
					const modelRect = modelMotion.getBoundingClientRect();

					gsap.set(modelMotion, {
						y: -(window.innerHeight + modelRect.height),
					});
					gsap.set(words, { autoAlpha: 1 });
					gsap.set(splitWords, {
						autoAlpha: 0,
						scale: 0.96,
						y: 18,
					});

					const timeline = gsap.timeline({
						defaults: { ease: "back.out(1.45)" },
					});

					timeline
						.to(
							modelMotion,
							{ duration: 1.35, ease: "power3.out", y: 0 },
							">+0.1",
						)
						.addLabel("model-landed")
						.call(onModelSettled, [], "model-landed")
						.addLabel("copy-enter", "model-landed+=0.95")
						.to(
							splitWords,
							{
								autoAlpha: 1,
								duration: 0.68,
								scale: 1,
								stagger: 0.08,
								y: 0,
							},
							"copy-enter",
						)
						.call(onHeroReady);

					return () => {
						timeline.kill();
						wordSplit.forEach((split) => split.revert());
						gsap.set(modelMotion, { y: 0 });
						gsap.set(words, {
							autoAlpha: 0,
							rotation: 0,
							scale: 1,
							x: 0,
							y: 0,
						});
					};
				},
			);

			return () => media.revert();
		},
		{
			dependencies: [isIntroDone, onHeroReady, onModelSettled],
			revertOnUpdate: true,
			scope: rootRef,
		},
	);

	useGSAP(
		() => {
			if (!isHeroReady) return undefined;

			const root = rootRef.current;
			const backdrop = query(root, SELECTORS.backdrop);
			const makeText = query(root, SELECTORS.makeText);
			const modelMotion = query(root, SELECTORS.modelMotion);
			const yoursText = query(root, SELECTORS.yoursText);
			const transitionState = transitionControlRef.current;

			if (
				!root ||
				!backdrop ||
				!makeText ||
				!modelMotion ||
				!yoursText
			) {
				return undefined;
			}

			const media = gsap.matchMedia();
			media.add(
				{
					reduceMotion: "(prefers-reduced-motion: reduce)",
					standardMotion: "(prefers-reduced-motion: no-preference)",
				},
				(context) => {
					if (
						context.conditions.reduceMotion ||
						hasSceneError ||
						!transitionState
					) {
						return undefined;
					}

					const [targetX, targetY, targetZ] =
						CROCS_TRANSITION_POSE.rotationDegrees.map(
							(value) => (value * Math.PI) / 180,
						);

					const timeline = gsap.timeline({
						defaults: { ease: "power2.inOut" },
						scrollTrigger: {
							end: "bottom bottom",
							id: "home-hero-exit",
							invalidateOnRefresh: true,
							refreshPriority: -10,
							scrub: 0.8,
							start: "top top",
							trigger: root,
						},
					});

					timeline
						.addLabel("absorb-copy", 0)
						.to(
							[makeText, yoursText],
							{
								autoAlpha: 0,
								duration: 0.35,
								ease: "back.in(1.35)",
								scale: 0.04,
								transformOrigin: "50% 50%",
								x: (_, element) => getCenterOffset(element).x,
								y: (_, element) => getCenterOffset(element).y,
							},
							"absorb-copy",
						)
						.set(transitionState, { active: 1 }, 0.18)
						.to(
							transitionState,
							{ duration: 0.22, pointerInfluence: 0 },
							0.18,
						)
						.to(
							transitionState,
							{
								duration: 0.45,
								rotationX: targetX,
								rotationY: targetY,
								rotationZ: targetZ,
							},
							0.28,
						)
						.addLabel("hero-exit", 0.58)
						.to(
							modelMotion,
							{
								autoAlpha: 0,
								duration: 0.34,
								ease: "power2.in",
								yPercent: -12,
							},
							"hero-exit",
						)
						.to(
							backdrop,
							{ autoAlpha: 0, duration: 0.26, ease: "power2.in" },
							0.62,
						);

					return () => timeline.kill();
				},
			);

			return () => media.revert();
		},
		{
			dependencies: [hasSceneError, isHeroReady],
			revertOnUpdate: true,
			scope: rootRef,
		},
	);

	return null;
}

export default HeroAnimation;
