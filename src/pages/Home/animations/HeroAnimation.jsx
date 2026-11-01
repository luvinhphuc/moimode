import { useEffect, useRef } from "react";
import { SplitText } from "gsap/SplitText";

import { gsap, ScrollTrigger, useGSAP } from "../../../utils/gsap.js";
import { CROCS_TRANSITION_POSE } from "../config/sceneConfig.js";

gsap.registerPlugin(SplitText);

const SELECTORS = Object.freeze({
	aboutCards: "[data-about-card]",
	aboutPanel: '[data-hero="about-panel"]',
	aboutTitle: '[data-hero="about-title"]',
	backdrop: '[data-hero="backdrop"]',
	intro: '[data-hero="intro"]',
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

function getLayoutRect(element) {
	const offsetParent = element.offsetParent;
	if (!offsetParent) return element.getBoundingClientRect();

	const parentRect = offsetParent.getBoundingClientRect();
	return {
		left: parentRect.left + element.offsetLeft,
		top: parentRect.top + element.offsetTop,
		width: element.offsetWidth,
		height: element.offsetHeight,
	};
}

function getLayoutCenterOffset(element) {
	const rect = getLayoutRect(element);
	return {
		x: window.innerWidth / 2 - (rect.left + rect.width / 2),
		y: window.innerHeight / 2 - (rect.top + rect.height / 2),
	};
}

function getLayoutTopCenterOffset(element) {
	const rect = getLayoutRect(element);
	const gutter = Math.max(window.innerWidth, window.innerHeight) * 0.08 + 48;

	return {
		x: window.innerWidth / 2 - (rect.left + rect.width / 2),
		y: -(rect.top + rect.height / 2 + gutter),
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
	onTransitionComplete,
	onTransitionReverse,
	onTransitionReverseComplete,
	onTransitionStart,
	rootRef,
	transitionControlRef,
}) {
	const collagePlayedRef = useRef(false);
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
			if ((!isSceneReady && !hasSceneError) || hasSceneError) return undefined;

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
								ease: "power3.inOut",
								y: getIntroExitOffset(),
							},
							"+=0.08",
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
					const makeWords = wordSplit[0].words;
					const yoursWords = wordSplit[1].words;

					const modelRect = modelMotion.getBoundingClientRect();
					gsap.set(modelMotion, {
						y: -(window.innerHeight + modelRect.height),
					});
					gsap.set(words, { autoAlpha: 1 });
					gsap.set([...makeWords, ...yoursWords], {
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
						.addLabel("copy-enter", "model-landed+=0.95");

					makeWords.forEach((word, index) => {
						timeline.to(
							word,
							{
								autoAlpha: 1,
								duration: 0.68,
								scale: 1,
								y: 0,
							},
							index === 0 ? "copy-enter" : ">+=0.08",
						);
					});

					timeline
						.to(yoursWords, {
							autoAlpha: 1,
							duration: 0.76,
							scale: 1,
							y: 0,
						})
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
			const aboutPanel = query(root, SELECTORS.aboutPanel);
			const aboutTitle = query(root, SELECTORS.aboutTitle);
			const aboutCards = Array.from(
				root?.querySelectorAll(SELECTORS.aboutCards) ?? [],
			);
			const backdrop = query(root, SELECTORS.backdrop);
			const makeText = query(root, SELECTORS.makeText);
			const modelMotion = query(root, SELECTORS.modelMotion);
			const yoursText = query(root, SELECTORS.yoursText);
			const transitionState = transitionControlRef.current;

			if (
				!aboutPanel ||
				!aboutTitle ||
				aboutCards.length === 0 ||
				!backdrop ||
				!makeText ||
				!modelMotion ||
				!yoursText ||
				!transitionState
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
					const useReducedMotion =
						context.conditions.reduceMotion ||
						hasSceneError ||
						!transitionState;
					const finalRotation = (card) => Number(card.dataset.rotation) || 0;

					gsap.set(aboutPanel, { autoAlpha: 0, yPercent: 100 });

					const setCollageFinal = () => {
						gsap.set(aboutTitle, {
							autoAlpha: 1,
							clearProps: "transform",
						});
						gsap.set(aboutCards, {
							autoAlpha: 1,
							rotation: (_, card) => finalRotation(card),
							scale: 1,
							x: 0,
							y: 0,
						});
					};

					let collageTimeline;
					if (useReducedMotion || collagePlayedRef.current) {
						collagePlayedRef.current = true;
						setCollageFinal();
					} else {
						gsap.set(aboutTitle, { autoAlpha: 0, scale: 0.82, y: 14 });
						gsap.set(aboutCards, {
							autoAlpha: 0,
							rotation: (_, card) => finalRotation(card),
							scale: 0.72,
							x: 0,
							y: 0,
						});

						const stackRotations = [-7, 5, -3, 8, -5, 2, -8, 4, -2];

						collageTimeline = gsap.timeline({
							defaults: { ease: "power3.out" },
							paused: true,
						});

						collageTimeline
							.addLabel("title", 0)
							.to(
								aboutTitle,
								{
									autoAlpha: 1,
									duration: 0.42,
									ease: "power2.out",
									scale: 1,
									y: 0,
								},
								"title",
							)
							.addLabel("stack", "title+=0.22");

						aboutCards.forEach((card, index) => {
							collageTimeline.fromTo(
								card,
								{
									autoAlpha: 0,
									rotation: finalRotation(card) + (index % 2 === 0 ? 18 : -18),
									scale: 0.68,
									x: () => getLayoutTopCenterOffset(card).x,
									y: () => getLayoutTopCenterOffset(card).y,
								},
								{
									autoAlpha: 1,
									duration: 0.76,
									ease: "back.out(1.55)",
									immediateRender: false,
									rotation: stackRotations[index],
									scale: 1,
									x: () => getLayoutCenterOffset(card).x,
									y: () => getLayoutCenterOffset(card).y,
									zIndex: 20 + index,
								},
								`stack+=${index * 0.09}`,
							);
						});

						const scatterCards = gsap.utils.shuffle(aboutCards.slice());
						collageTimeline.addLabel("scatter", "stack+=1.9");
						scatterCards.forEach((card, index) => {
							collageTimeline.to(
								card,
								{
									duration: 1.08,
									ease: "power3.inOut",
									rotation: finalRotation(card),
									x: 0,
									y: 0,
								},
								`scatter+=${index * 0.12}`,
							);
						});

						collageTimeline
							.set(aboutCards, { clearProps: "zIndex" }, ">")
							.set(aboutTitle, { clearProps: "transform" }, ">");
					}

					const playCollageOnce = () => {
						if (collagePlayedRef.current) {
							collageTimeline?.progress(1).pause();
							setCollageFinal();
							return;
						}

						collagePlayedRef.current = true;
						collageTimeline?.play(0);
					};

					const handleForwardComplete = () => {
						onTransitionComplete();
					};

					const sceneTimeline = gsap.timeline({
						defaults: { ease: "power3.inOut" },
						onComplete: handleForwardComplete,
						onReverseComplete: onTransitionReverseComplete,
						onStart: onTransitionStart,
						paused: true,
					});

					if (useReducedMotion) {
						sceneTimeline
							.addLabel("about-reveal")
							.call(playCollageOnce, [], "about-reveal")
							.to(
								[makeText, yoursText, modelMotion, backdrop],
								{ autoAlpha: 0, duration: 0.22 },
								"about-reveal",
							)
							.to(
								aboutPanel,
								{ autoAlpha: 1, duration: 0.28, yPercent: 0 },
								"about-reveal+=0.08",
							);
					} else {
						const [targetX, targetY, targetZ] =
							CROCS_TRANSITION_POSE.rotationDegrees.map(
								(value) => (value * Math.PI) / 180,
							);

						sceneTimeline
							.addLabel("absorb-copy")
							.to(
								[makeText, yoursText],
								{
									autoAlpha: 0,
									duration: 0.5,
									ease: "back.in(1.5)",
									scale: 0.04,
									transformOrigin: "50% 50%",
									x: (_, element) => getCenterOffset(element).x,
									y: (_, element) => getCenterOffset(element).y,
								},
								"absorb-copy",
							)
							.set(transitionState, { active: 1 }, "absorb-copy+=0.28")
							.to(
								transitionState,
								{ duration: 0.18, pointerInfluence: 0 },
								"absorb-copy+=0.3",
							)
							.addLabel("side-profile")
							.to(
								transitionState,
								{
									duration: 0.62,
									ease: "power2.inOut",
									rotationX: targetX,
									rotationY: targetY,
									rotationZ: targetZ,
								},
								"side-profile",
							)
							.addLabel("hero-exit")
							.to(
								modelMotion,
								{
									autoAlpha: 0,
									duration: 0.4,
									ease: "power2.in",
									yPercent: -12,
								},
								"hero-exit",
							)
							.addLabel("backdrop-exit")
							.to(
								backdrop,
								{
									autoAlpha: 0,
									duration: 0.28,
									ease: "power2.in",
								},
								"hero-exit+=0.08",
							)
							.addLabel("about-reveal")
							.call(playCollageOnce, [], "about-reveal")
							.to(
								aboutPanel,
								{
									autoAlpha: 1,
									duration: 0.56,
									ease: "power3.out",
									yPercent: 0,
								},
								"about-reveal",
							);
					}

					const handleResize = () => {
						if (!collagePlayedRef.current) collageTimeline?.invalidate();
					};
					let hasAnnouncedReverse = false;

					window.addEventListener("resize", handleResize);

					const trigger = ScrollTrigger.create({
						animation: sceneTimeline,
						end: "+=100%",
						id: "home-crocs-transition",
						onUpdate: (self) => {
							if (
								self.direction < 0 &&
								self.progress < 0.999 &&
								!hasAnnouncedReverse
							) {
								hasAnnouncedReverse = true;
								onTransitionReverse();
							} else if (self.direction > 0 && self.progress > 0.001) {
								hasAnnouncedReverse = false;
							}
						},
						scrub: 1.2,
						snap: {
							delay: 0.08,
							duration: { max: 1.2, min: 0.45 },
							ease: "power2.inOut",
							snapTo: [0, 1],
						},
						start: "top top",
						trigger: root,
					});

					ScrollTrigger.refresh();

					return () => {
						window.removeEventListener("resize", handleResize);
						trigger.kill();
						collageTimeline?.kill();
						sceneTimeline.kill();
					};
				},
			);

			return () => media.revert();
		},
		{
			dependencies: [
				hasSceneError,
				isHeroReady,
				onTransitionComplete,
				onTransitionReverse,
				onTransitionReverseComplete,
				onTransitionStart,
			],
			revertOnUpdate: true,
			scope: rootRef,
		},
	);

	return null;
}

export default HeroAnimation;
