import { SplitText } from "gsap/SplitText";

import { gsap, ScrollTrigger, useGSAP } from "../../../utils/gsap.js";
import { drawSketchArrow } from "../utils/drawSketchArrow.js";

gsap.registerPlugin(SplitText);

function PeopleAnimation({ rootRef, peopleCallouts }) {
	useGSAP(
		() => {
			const section = rootRef.current;
			const track = section?.querySelector(".people-intro-track");
			const introFrame = section?.querySelector(".people-intro-frame");
			const decor = introFrame?.querySelector(".section-decor--people");
			const title = section?.querySelector("#people-title");
			const our = section?.querySelector("[data-people-our]");
			const people = section?.querySelector("[data-people-people]");
			const portrait = section?.querySelector("[data-people-portrait]");
			const portraitStage = section?.querySelector(".people-portrait-stage");
			const portraitFrame = section?.querySelector(".people-portrait-frame");
			const portraitContent = section?.querySelector(".people-portrait-content");
			if (!track || !introFrame || !decor || !title || !our || !people || !portrait || !portraitStage || !portraitFrame || !portraitContent) return undefined;

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
			callouts.forEach(({ line }) => line.setAttribute("pathLength", "1"));
			let lastCalloutLayout;
			const drawCallouts = () => {
				const { clientWidth: width, clientHeight: height } = portraitStage;
				if (!width || !height) return;
				const starts = callouts.map(({ side, name }) => [
					name.offsetLeft + (side === "left" ? name.offsetWidth + 4 : -4),
					name.offsetTop + name.offsetHeight / 2,
				]);
				const layout = [width, height, ...starts.flat()];
				if (lastCalloutLayout?.every((value, index) => value === layout[index])) return;
				lastCalloutLayout = layout;
				callouts.forEach(({ target: [x, y], svg, line, head }, index) => {
					const [startX, startY] = starts[index];
					svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
					drawSketchArrow(line, head, startX, startY, width * x, height * y);
				});
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
					if (conditions.reducedMotion) return;

					// Taller screens already animate the title in the split-word intro.
					titleEntrance = gsap.fromTo(title, { autoAlpha: 0, y: 20 }, {
						autoAlpha: 1,
						y: 0,
						duration: 0.6,
						ease: "power2.out",
						onComplete: releaseParagraphs,
						scrollTrigger: {
							trigger: track,
							start: "clamp(top 88%)",
							toggleActions: "play none none reverse",
							onRefresh(self) {
								if (self.scroll() >= self.start) self.animation?.play();
								else self.animation?.reverse();
							},
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
						if (conditions.reducedMotion) continue;

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
							},
						);
						paragraphTweens.push(tween);
						const revealParagraph = () => {
							if (titleEntrance && titleEntrance.progress() < 1) pendingParagraphs.add(tween);
							else tween.play();
						};
						const hideParagraph = () => {
							pendingParagraphs.delete(tween);
							tween.reverse();
						};
						ScrollTrigger.create({
							trigger: paragraph,
							start: "clamp(top 88%)",
							onEnter: revealParagraph,
							onLeaveBack: hideParagraph,
							onRefresh(self) {
								if (self.scroll() >= self.start) revealParagraph();
								else hideParagraph();
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
					const decorShapes = Array.from(decor.children);
					gsap.set(decorShapes, { translate: "0px 0px" });

					const names = callouts.map(({ name }) => name);
					const lines = callouts.map(({ line }) => line);
					const heads = callouts.map(({ head }) => head);
					gsap.set(names, { autoAlpha: 0 });
					// Inline values also apply to the paths cloned by the white outline's <use>.
					gsap.set(lines, { visibility: "hidden", strokeDasharray: 1, strokeDashoffset: 1 });
					gsap.set(heads, { opacity: 0 });

					const exitDistance = (word) => window.innerWidth / 2 + word.offsetWidth;
					const splitDistance = (word, direction) => {
						const innerEdge = direction < 0 ? word.offsetLeft + word.offsetWidth : word.offsetLeft;
						const edgeFromCenter = innerEdge - title.offsetWidth / 2;
						return Math.max(window.innerWidth * 0.2, portrait.offsetWidth / 2 + 16 - direction * edgeFromCenter);
					};
					// Match the portrait's travel from the viewport center to its sticky dock.
					const decorLift = () =>
						(introFrame.clientHeight - portraitContent.offsetHeight) / 2 - parseFloat(getComputedStyle(portraitFrame).top);
					const timeline = gsap.timeline({
						defaults: { ease: "none" },
						scrollTrigger: {
							id: "home-our-people-intro",
							trigger: track,
							start: "top top",
							end: "bottom bottom",
							scrub: 0.25,
							invalidateOnRefresh: true,
						},
					});

					timeline
						.to(our, { x: () => -splitDistance(our, -1), duration: 0.2 }, 0)
						.to(people, { x: () => splitDistance(people, 1), duration: 0.2 }, 0)
						.to(portrait, { clipPath: "inset(0% 0%)", duration: 0.16 }, 0.2)
						.to(names, { autoAlpha: 1, duration: 0.06 }, 0.36)
						.set(lines, { visibility: "visible" }, 0.38)
						.to(lines, { strokeDashoffset: 0, autoRound: false, duration: 0.14, ease: "power1.inOut" }, 0.38)
						.to(heads, { opacity: 1, duration: 0.04 }, 0.5)
						.to(heads, { opacity: 0, duration: 0.03 }, 0.65)
						.to(lines, { strokeDashoffset: 1, autoRound: false, duration: 0.12, ease: "power2.inOut" }, 0.67)
						.set(lines, { visibility: "hidden" }, 0.79)
						.to(names, { autoAlpha: 0, duration: 0.07 }, 0.75)
						.to(portraitContent, { y: 0, duration: 0.35 }, 0.65)
						.to(decorShapes, {
							// Individual translate runs before each motif's existing rotation.
							translate: () => `0px ${-decorLift()}px`,
							duration: 0.35,
						}, 0.65)
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

					ScrollTrigger.refresh(true);
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
