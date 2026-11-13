import { useRef } from "react";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { SplitText } from "gsap/SplitText";

import { gsap, ScrollTrigger, useGSAP } from "../../../utils/gsap.js";
import { drawSketchArrow } from "../utils/drawSketchArrow.js";

gsap.registerPlugin(DrawSVGPlugin, SplitText);

function PeopleAnimation({ rootRef, peopleCallouts }) {
	const revealedParagraphsRef = useRef(new WeakSet());
	const titleRevealedRef = useRef(false);

	useGSAP(
		() => {
			const section = rootRef.current;
			const track = section?.querySelector(".people-intro-track");
			const title = section?.querySelector("#people-title");
			const our = section?.querySelector("[data-people-our]");
			const people = section?.querySelector("[data-people-people]");
			const portrait = section?.querySelector("[data-people-portrait]");
			const portraitStage = section?.querySelector(".people-portrait-stage");
			const portraitFrame = section?.querySelector(".people-portrait-frame");
			if (!track || !title || !our || !people || !portrait || !portraitStage || !portraitFrame) return undefined;

			const callouts = peopleCallouts.map(({ side, target }) => {
				const callout = portraitStage.querySelector(`.people-callout--${side}`);
				return {
					side,
					target,
					name: callout.querySelector(".people-callout__name"),
					svg: callout.querySelector(".people-callout__arrow"),
					line: callout.querySelector(".sketch-arrow__line"),
					head: callout.querySelector(".sketch-arrow__head"),
				};
			});
			const drawCallouts = () => {
				const { clientWidth: width, clientHeight: height } = portraitStage;
				if (!width || !height) return;
				for (const { side, target: [x, y], name, svg, line, head } of callouts) {
					const startX = name.offsetLeft + (side === "left" ? name.offsetWidth + 4 : -4);
					const startY = name.offsetTop + name.offsetHeight / 2;
					svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
					drawSketchArrow(line, head, startX, startY, width * x, height * y);
				}
			};
			drawCallouts();
			const observer = new ResizeObserver(drawCallouts);
			for (const element of [section, portraitStage, ...callouts.map(({ name }) => name)]) {
				observer.observe(element);
			}

			const media = gsap.matchMedia();
			let titleEntrance = null;
			const pendingParagraphs = new Set();
			const releaseParagraphs = () => {
				pendingParagraphs.forEach((tween) => tween.play());
				pendingParagraphs.clear();
			};
			media.add(
				{
					reducedMotion: "(prefers-reduced-motion: reduce)",
					shortViewport: "(max-height: 619px)",
				},
				({ conditions }) => {
					if (conditions.reducedMotion) {
						titleRevealedRef.current = true;
						return;
					}
					if (titleRevealedRef.current) return;

					// Taller screens already animate the title in the split-word intro.
					titleEntrance = gsap.fromTo(title, { autoAlpha: 0, y: 20 }, {
						autoAlpha: 1,
						y: 0,
						duration: 0.6,
						ease: "power2.out",
						clearProps: "opacity,visibility,transform",
						onStart: () => { titleRevealedRef.current = true; },
						onComplete: releaseParagraphs,
						scrollTrigger: {
							trigger: track,
							start: "clamp(top 88%)",
							once: true,
						},
					});
					return () => {
						titleEntrance = null;
						releaseParagraphs();
					};
				},
			);
			media.add(
				{
					standardMotion: "(prefers-reduced-motion: no-preference)",
					reducedMotion: "(prefers-reduced-motion: reduce)",
				},
				({ conditions }) => {
					const paragraphTweens = [];
					for (const paragraph of section.querySelectorAll("[data-people-copy]")) {
						if (conditions.reducedMotion) {
							revealedParagraphsRef.current.add(paragraph);
							continue;
						}
						if (revealedParagraphsRef.current.has(paragraph)) continue;

						// Animate the paragraph wrapper independently of its line colour reveal.
						const tween = gsap.fromTo(
							paragraph,
							{ autoAlpha: 0, y: 20 },
							{
								autoAlpha: 1,
								y: 0,
								duration: 0.6,
								ease: "power2.out",
								paused: true,
								clearProps: "opacity,visibility,transform",
								onStart: () => revealedParagraphsRef.current.add(paragraph),
							},
						);
						paragraphTweens.push(tween);
						ScrollTrigger.create({
							trigger: paragraph,
							start: "clamp(top 88%)",
							once: true,
							onEnter: () => {
								if (titleEntrance && titleEntrance.progress() < 1) pendingParagraphs.add(tween);
								else tween.play();
							},
						});
					}
					return () => paragraphTweens.forEach((tween) => pendingParagraphs.delete(tween));
				},
			);
			media.add(
				"(prefers-reduced-motion: no-preference) and (min-height: 620px)",
				() => {
					section.classList.add("people-section--motion");

					const names = callouts.map(({ name }) => name);
					const lines = callouts.map(({ line }) => line);
					const heads = callouts.map(({ head }) => head);
					gsap.set(names, { autoAlpha: 0 });

					const exitDistance = (word) => window.innerWidth / 2 + word.offsetWidth;
					const splitDistance = (word, direction) => {
						const innerEdge = direction < 0 ? word.offsetLeft + word.offsetWidth : word.offsetLeft;
						const edgeFromCenter = innerEdge - title.offsetWidth / 2;
						return Math.max(window.innerWidth * 0.26, portrait.offsetWidth / 2 + 16 - direction * edgeFromCenter);
					};
					const timeline = gsap.timeline({
						defaults: { ease: "none" },
						scrollTrigger: {
							id: "home-our-people-intro",
							trigger: track,
							start: "top top",
							end: "bottom bottom",
							scrub: true,
							invalidateOnRefresh: true,
							onRefreshInit: drawCallouts,
						},
					});

					timeline
						.to(our, { x: () => -splitDistance(our, -1), duration: 0.2 }, 0)
						.to(people, { x: () => splitDistance(people, 1), duration: 0.2 }, 0)
						.to(portrait, { "--people-portrait-mask": "0%", duration: 0.16 }, 0.2)
						.to(names, { autoAlpha: 1, duration: 0.06 }, 0.36)
						.set(lines, { visibility: "visible" }, 0.38)
						.fromTo(
							lines,
							{ drawSVG: 0 },
							{ drawSVG: "100% nowrap", duration: 0.14, ease: "power1.inOut", immediateRender: false },
							0.38,
						)
						.to(heads, { opacity: 1, duration: 0.04 }, 0.5)
						.to(heads, { opacity: 0, duration: 0.03 }, 0.65)
						.to(lines, { drawSVG: "0% nowrap", duration: 0.12, ease: "power2.inOut" }, 0.67)
						.set(lines, { visibility: "hidden" }, 0.79)
						.to(names, { autoAlpha: 0, duration: 0.07 }, 0.75)
						.to(portraitFrame, { y: 0, duration: 0.35 }, 0.65)
						.to(our, { x: () => -exitDistance(our), duration: 0.35 }, 0.65)
						.to(people, { x: () => exitDistance(people), duration: 0.35 }, 0.65);

					const splits = Array.from(section.querySelectorAll("[data-people-copy]"),
						(paragraph) =>
							SplitText.create(paragraph, {
								type: "lines",
								autoSplit: true,
								onSplit(self) {
									const theme = getComputedStyle(section);
									return gsap.fromTo(
										self.lines,
										{ color: theme.getPropertyValue("--color-moi-muted").trim() },
										{
											color: theme.getPropertyValue("--color-moi-ink").trim(),
											duration: 1,
											ease: "none",
											stagger: 0.16,
											scrollTrigger: {
												trigger: paragraph,
												start: "top 82%",
												end: "clamp(bottom 70%)",
												scrub: true,
											},
										},
									);
								},
							}),
					);

					ScrollTrigger.refresh();
					return () => {
						splits.forEach((split) => split.revert());
						section.classList.remove("people-section--motion");
					};
				},
			);

			return () => {
				observer.disconnect();
				media.revert();
			};
		},
		{ scope: rootRef, dependencies: [peopleCallouts], revertOnUpdate: true },
	);

	return null;
}

export default PeopleAnimation;
