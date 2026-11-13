import { useCallback, useLayoutEffect, useRef } from "react";

import { gsap, ScrollTrigger } from "../../../utils/gsap.js";

// The group belongs to CustomizableCrocs; neither its camera rig nor a useFrame
// callback writes these transforms, so the entrance has a single owner.
export default function useMiniCustomizerIntro({
	rootRef,
	colourLegendRef,
	charmLegendRef,
	hintRef,
	arrowSvgRef,
	modelRig,
	hintStep,
}) {
	const completedRef = useRef(false);
	const finishRef = useRef(null);
	const completeIntro = useCallback(() => finishRef.current?.(), []);

	useLayoutEffect(() => {
		// Release tooltip ownership before React starts its next guidance step.
		if (hintStep !== "colour") return undefined;
		const root = rootRef.current;
		const card = hintRef.current;
		const path = arrowSvgRef.current?.querySelector(".sketch-arrow__line");
		const head = arrowSvgRef.current?.querySelector(".sketch-arrow__head");
		if (!root || !card || !path || !head) return undefined;
		const labels = [colourLegendRef.current, charmLegendRef.current];
		const swatches = Array.from(root.querySelectorAll(".about-mini__colour"));
		// Animate the images so the existing disabled-button opacity is preserved.
		const charms = root.querySelectorAll(".about-mini__charm-option img");
		const panel = root.closest("[data-about-experience]");
		const section = root.closest(".about-section");
		const media = gsap.matchMedia();

		media.add(
			{
				mobile: "(max-width: 767px)",
				desktop: "(min-width: 768px)",
				reduceMotion: "(prefers-reduced-motion: reduce)",
			},
			({ conditions }) => {
				const clearControls = () => {
					gsap.set(root, { clearProps: "clipPath" });
					gsap.set([...labels, ...swatches, ...charms], {
						clearProps: "opacity,transform",
					});
				};
				if (completedRef.current || conditions.reduceMotion) {
					completedRef.current = true;
					clearControls();
					// Subsequent tooltip steps keep their own progression animation.
					finishRef.current = null;
					return undefined;
				}

				const mobile = conditions.mobile;
				const speed = mobile ? 0.78 : 1;
				const at = (seconds) => seconds * speed;
				let entered = false;
				let trigger;
				let observer;
				const group = modelRig?.group;
				const original = group && {
					scale: group.scale.clone(),
					rotation: group.rotation.clone(),
					position: group.position.clone(),
				};
				const restoreModel = () => {
					if (!original) return;
					group.scale.copy(original.scale);
					group.rotation.copy(original.rotation);
					group.position.copy(original.position);
				};
				gsap.set(root, { clipPath: "inset(100% 0 0 0)" });
				gsap.set(labels, { opacity: 0, y: mobile ? 4 : 7 });
				gsap.set(swatches, { opacity: 0, scale: 0 });
				gsap.set(charms, {
					opacity: 0,
					y: mobile ? 8 : 15,
					rotation: mobile ? -6 : -10,
				});
				gsap.set(card, { autoAlpha: 0, scale: 0.85, transformOrigin: "50% 100%" });
				// Normalized path length keeps an in-flight draw correct on resize.
				path.setAttribute("pathLength", "1");
				gsap.set(path, { autoAlpha: 1, strokeDasharray: 1, strokeDashoffset: 1 });
				gsap.set(head, { autoAlpha: 0 });

				const timeline = gsap.timeline({
					paused: true,
					defaults: { ease: "power3.out" },
					onComplete: () => {
						completedRef.current = true;
						finishRef.current = null;
						trigger?.kill();
						observer?.disconnect();
						restoreModel();
						clearControls();
					},
				});
				timeline
					.to(root, {
						clipPath: "inset(0% 0 0 0)",
						duration: at(0.6),
						ease: "power3.inOut",
					}, 0)
					.to(labels[0], { opacity: 1, y: 0, duration: at(0.22) }, at(0.65))
					.to(swatches, {
						opacity: 1,
						scale: 1,
						duration: at(0.24),
						stagger: at(0.07),
					}, at(0.7))
					.to(labels[1], { opacity: 1, y: 0, duration: at(0.2) }, at(0.85))
					.to(charms, {
						opacity: 1,
						y: 0,
						rotation: 0,
						duration: at(0.16),
						stagger: at(0.08),
					}, at(0.9))
					.to(card, { autoAlpha: 1, scale: 1, duration: at(0.25) }, at(1.2))
					.to(path, {
						strokeDashoffset: 0,
						autoRound: false,
						duration: at(0.4),
						ease: "power2.inOut",
					}, at(1.32))
					.to(head, { autoAlpha: 1, duration: at(0.06) }, at(1.72))
					.to(swatches[0], {
						scale: mobile ? 1.06 : 1.1,
						duration: at(0.085),
						ease: "sine.inOut",
					}, at(1.78))
					.to(swatches[0], {
						scale: 1,
						duration: at(0.085),
						ease: "sine.inOut",
					}, at(1.865));

				if (original) {
					gsap.set(group.scale, {
						x: original.scale.x * 0.75,
						y: original.scale.y * 0.75,
						z: original.scale.z * 0.75,
					});
					gsap.set(group.rotation, { y: original.rotation.y - Math.PI / 5 });
					gsap.set(group.position, {
						y: original.position.y - modelRig.modelSize * (mobile ? 0.035 : 0.065),
					});
					timeline
						.to(group.scale, {
							x: original.scale.x,
							y: original.scale.y,
							z: original.scale.z,
							duration: at(0.9),
						}, at(0.2))
						.to(group.rotation, { y: original.rotation.y, duration: at(0.9) }, at(0.2))
						.to(group.position, { y: original.position.y, duration: at(0.9) }, at(0.2));
				}

				const tryPlay = () => {
					if (!entered || !group || completedRef.current) return;
					// The desktop deck stacks panels at the same coordinates. Wait for
					// its existing wipe to uncover this panel before starting the intro.
					if (section?.classList.contains("about-section--deck") && panel) {
						const style = getComputedStyle(panel);
						if (style.visibility === "hidden") return;
						if (style.clipPath !== "none" && parseFloat(style.clipPath.slice(6)) > 0) {
							return;
						}
					}
					observer?.disconnect();
					timeline.play();
				};
				observer = new MutationObserver(tryPlay);
				if (panel) {
					observer.observe(panel, { attributes: true, attributeFilter: ["style"] });
				}
				if (section) {
					observer.observe(section, { attributes: true, attributeFilter: ["class"] });
				}
				trigger = ScrollTrigger.create({
					trigger: root,
					start: "top 75%",
					once: true,
					onEnter: () => {
						entered = true;
						tryPlay();
					},
				});
				finishRef.current = () => {
					timeline.progress(1).pause();
				};
				return () => {
					finishRef.current = null;
					observer.disconnect();
					trigger.kill();
					restoreModel();
				};
			},
			root,
		);
		return () => media.revert();
	}, [rootRef, colourLegendRef, charmLegendRef, hintRef, arrowSvgRef, modelRig, hintStep]);

	return completeIntro;
}
