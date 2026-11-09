import { useEffect, useRef } from "react";
import { SplitText } from "gsap/SplitText";

import { gsap, ScrollTrigger, useGSAP } from "../../../utils/gsap.js";
import { CROCS_TRANSITION_POSE } from "../config/sceneConfig.js";

gsap.registerPlugin(SplitText);

const SELECTORS = Object.freeze({
	backdrop: '[data-hero="backdrop"]',
	bottomSlogan: '[data-hero="bottom-slogan"]',
	crocsSlide: '[data-hero="crocs-slide"]',
	crocsStar: '[data-hero="crocs-star"]',
	introMark: '[data-hero="intro-mark"]',
	introProgress: '[data-hero="intro-progress"]',
	makeHinge: '[data-hero="make-hinge"]',
	makeText: '[data-hero="make-text"]',
	quote: '[data-hero="quote"]',
	quoteExit: '[data-hero="quote-exit"]',
	sloganStack: '[data-hero="slogan-stack"]',
	topSlogan: '[data-hero="top-slogan"]',
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

function query(root, selector) {
	return root?.querySelector(selector);
}

function HeroAnimation({
	isHeroReady,
	isIntroDone,
	isIntroReady,
	modelStatus,
	onHeroReady,
	onIntroComplete,
	onModelVisibilityChange,
	rootRef,
	transitionControlRef,
}) {
	const introStartedRef = useRef(false);
	const copyRevealedRef = useRef(false);
	const rewindRef = useRef(0);
	const syncHatchRef = useRef(null);

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
			if (!isIntroReady || isIntroDone) return undefined;

			const root = rootRef.current;
			const mark = query(root, SELECTORS.introMark);
			const progress = query(root, SELECTORS.introProgress);
			if (!mark || !progress) return undefined;

			const media = gsap.matchMedia();
			media.add(
				{
					reduceMotion: "(prefers-reduced-motion: reduce)",
					standardMotion: "(prefers-reduced-motion: no-preference)",
				},
				(context) => {
					if (context.conditions.reduceMotion) {
						gsap.set([mark, progress], { autoAlpha: 0 });
						onIntroComplete();
						return undefined;
					}

					introStartedRef.current = true;
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
			dependencies: [isIntroReady, isIntroDone, onIntroComplete],
			revertOnUpdate: true,
			scope: rootRef,
		},
	);

	useGSAP(
		() => {
			if (!isIntroDone) return undefined;

			const root = rootRef.current;
			const quote = query(root, SELECTORS.quote);
			const words = [
				query(root, SELECTORS.makeText),
				query(root, SELECTORS.yoursText),
			];
			if (!quote || words.some((item) => !item)) return undefined;

			const media = gsap.matchMedia();
			media.add(
				{
					reduceMotion: "(prefers-reduced-motion: reduce)",
					standardMotion: "(prefers-reduced-motion: no-preference)",
				},
				(context) => {
					const finishReveal = () => {
						copyRevealedRef.current = true;
						onHeroReady();
					};
					gsap.set(words, { autoAlpha: 1 });

					if (context.conditions.reduceMotion || copyRevealedRef.current) {
						gsap.set(quote, { autoAlpha: 1, y: 0 });
						finishReveal();
						return undefined;
					}

					const wordSplits = words.map((word) =>
						SplitText.create(word, { aria: "none", type: "words" }),
					);
					const [makeWords, yoursWords] = wordSplits.map(
						(split) => split.words,
					);
					const timeline = gsap.timeline({
						defaults: { ease: "back.out(1.5)" },
					});

					gsap.set([...makeWords, ...yoursWords], {
						autoAlpha: 0,
						scale: 0.72,
						y: 24,
					});
					gsap.set(quote, { autoAlpha: 0, y: 8 });

					const reveal = {
						autoAlpha: 1,
						duration: 0.45,
						scale: 1,
						stagger: 0.06,
						y: 0,
					};
					timeline
						.to(makeWords, reveal)
						.to(yoursWords, reveal)
						.call(finishReveal)
						.to(quote, {
							autoAlpha: 1,
							y: 0,
							duration: 0.32,
							ease: "power2.out",
						});

					return () => {
						timeline.kill();
						wordSplits.forEach((split) => split.revert());
					};
				},
			);

			return () => media.revert();
		},
		{
			dependencies: [isIntroDone, onHeroReady],
			revertOnUpdate: true,
			scope: rootRef,
		},
	);

	useGSAP(
		() => {
			if (!isHeroReady) return undefined;

			const root = rootRef.current;
			const backdrop = query(root, SELECTORS.backdrop);
			const stack = query(root, SELECTORS.sloganStack);
			const topSlogan = query(root, SELECTORS.topSlogan);
			const bottomSlogan = query(root, SELECTORS.bottomSlogan);
			const quoteExit = query(root, SELECTORS.quoteExit);
			const about = root?.parentElement?.querySelector("#about");

			if (
				!root ||
				!backdrop ||
				!stack ||
				!topSlogan ||
				!bottomSlogan ||
				!quoteExit ||
				!about
			) {
				return undefined;
			}

			const media = gsap.matchMedia();
			media.add("(prefers-reduced-motion: no-preference)", () => {
				const rewind = { progress: 0 };
				const syncRewind = () => {
					rewindRef.current = rewind.progress;
					syncHatchRef.current?.();
				};

				const exit = gsap.timeline({ defaults: { ease: "power2.inOut" } });
				exit
					.to(rewind, { progress: 1, duration: 0.6, ease: "none" }, 0)
					.to(quoteExit, { autoAlpha: 0, y: 8, duration: 0.22 }, 0)
					.to(
						stack,
						{
							scale: 1.07,
							transformOrigin: () =>
								`50% ${(topSlogan.offsetTop + bottomSlogan.offsetTop) / 2}px`,
							duration: 0.13,
						},
						0.6,
					)
					.to(stack, { autoAlpha: 0, scale: 0.72, duration: 0.27 });
				exit.eventCallback("onUpdate", syncRewind);

				ScrollTrigger.create({
					animation: exit,
					id: "home-hero-exit",
					trigger: root,
					start: "top top",
					end: () => {
						// About covers the sticky hero from the bottom as it scrolls up.
						const sloganBottom = stack.offsetTop + Math.max(
							topSlogan.offsetTop + topSlogan.offsetHeight / 2,
							bottomSlogan.offsetTop + bottomSlogan.offsetHeight / 2,
						);
						const aboutStart = about.offsetTop - root.offsetTop;
						return `+=${Math.max(1, aboutStart - sloganBottom - 16)}`;
					},
					invalidateOnRefresh: true,
					refreshPriority: -10,
					scrub: true,
				});
				syncRewind();

				gsap.timeline({
					scrollTrigger: {
						trigger: root,
						start: "top top",
						end: "bottom bottom",
						scrub: 0.8,
					},
				}).to(backdrop, { autoAlpha: 0, duration: 0.4, ease: "power2.in" }, 0.6);

				return () => {
					rewindRef.current = 0;
				};
			});

			return () => media.revert();
		},
		{
			dependencies: [isHeroReady],
			revertOnUpdate: true,
			scope: rootRef,
		},
	);

	useGSAP(
		() => {
			if (!isHeroReady || modelStatus !== "ready") return undefined;

			const root = rootRef.current;
			const hinge = query(root, SELECTORS.makeHinge);
			const slide = query(root, SELECTORS.crocsSlide);
			const star = query(root, SELECTORS.crocsStar);
			const model = transitionControlRef.current;
			if (!hinge || !slide || !star || !model) return undefined;

			const [rotationX, rotationY, rotationZ] =
				CROCS_TRANSITION_POSE.rotationDegrees.map(
					(value) => (value * Math.PI) / 180,
				);
			const media = gsap.matchMedia();
			media.add(
				{
					reduceMotion: "(prefers-reduced-motion: reduce)",
					standardMotion: "(prefers-reduced-motion: no-preference)",
				},
				({ conditions }) => {
					gsap.set(model, {
						pointerInfluence: 0,
						poseActive: 1,
						rotationX,
						rotationY,
						rotationZ,
						scale: 1.45,
						spinActive: 0,
					});
					gsap.set(star, { autoAlpha: 0 });

					if (conditions.reduceMotion) {
						gsap.set(slide, { autoAlpha: 1, xPercent: 100 });
						gsap.set(star, { autoAlpha: 1 });
						onModelVisibilityChange(true);
						return undefined;
					}

					const hatch = gsap.timeline({
						paused: true,
						defaults: { ease: "power2.inOut" },
					});
					hatch
						.to(hinge, { rotation: -15, duration: 0.55 })
						.addLabel("slide")
						.set(slide, { autoAlpha: 1 }, "slide")
						.to(slide, { xPercent: 100, duration: 0.8 }, "slide")
						.set(star, { autoAlpha: 1 });

					const entry = { progress: 0 };
					const opening = gsap.timeline({ paused: true }).to(
						entry,
						{ progress: 1, duration: hatch.duration(), ease: "none" },
						0.25,
					);
					let isModelVisible;

					const syncHatch = () => {
						const rewind = rewindRef.current;
						// Freeze the intro playhead while scroll drives the same pose backward.
						opening.paused(rewind > 0);
						const pose = entry.progress * (1 - rewind);
						hatch.progress(pose, true);
						model.spinActive = Number(pose === 1);

						const isVisible = hatch.time() >= hatch.labels.slide;
						if (isVisible !== isModelVisible) {
							isModelVisible = isVisible;
							onModelVisibilityChange(isVisible);
						}
					};

					opening.eventCallback("onUpdate", syncHatch);
					syncHatchRef.current = syncHatch;
					syncHatch();

					return () => {
						syncHatchRef.current = null;
						model.spinActive = 0;
					};
				},
			);

			return () => media.revert();
		},
		{
			dependencies: [isHeroReady, modelStatus, onModelVisibilityChange],
			revertOnUpdate: true,
			scope: rootRef,
		},
	);

	return null;
}

export default HeroAnimation;
