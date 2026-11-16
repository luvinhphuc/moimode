import { useCallback, useLayoutEffect, useRef } from "react";

import { gsap, ScrollTrigger } from "../../../utils/gsap.js";

function isPreviewInView(preview, panel, section) {
	const rect = preview.getBoundingClientRect();
	const viewportHeight = window.innerHeight;
	if (!rect.height || rect.bottom <= 0 || rect.top >= viewportHeight) return false;
	let visibleTop = Math.max(0, rect.top);
	if (panel && section?.classList.contains("about-section--deck")) {
		const { visibility, clipPath } = getComputedStyle(panel);
		if (visibility === "hidden") return false;
		const topInset = clipPath.match(/^inset\(([\d.]+)(%|px)/);
		if (topInset) {
			const panelRect = panel.getBoundingClientRect();
			const inset = Number(topInset[1]) * (topInset[2] === "%" ? panelRect.height / 100 : 1);
			visibleTop = Math.max(visibleTop, panelRect.top + inset);
		}
	}
	return Math.min(rect.bottom, viewportHeight) - visibleTop >= Math.min(48, rect.height * 0.25, viewportHeight * 0.14);
}

export default function useMiniCustomizerIntro({
	rootRef,
	previewRef,
	colourLegendRef,
	charmLegendRef,
	hintRef,
	arrowSvgRef,
	modelRigRef,
	isIntroDone,
	hintStep,
}) {
	const completedRef = useRef(false);
	const finishRef = useRef(null);
	const completeIntro = useCallback(() => finishRef.current?.(), []);

	useLayoutEffect(() => {
		// Release tooltip ownership before React starts its next guidance step.
		if (hintStep !== "colour") return undefined;
		const root = rootRef.current;
		const preview = previewRef.current;
		const card = hintRef.current;
		const path = arrowSvgRef.current?.querySelector(".sketch-arrow__line");
		const head = arrowSvgRef.current?.querySelector(".sketch-arrow__head");
		if (!root || !preview || !card || !path || !head) return undefined;
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
					gsap.set(preview, { clearProps: "clipPath" });
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
				gsap.set(preview, { clipPath: "inset(100% 0 0 0)" });
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
				if (!isIntroDone) return undefined;

				let playing = false;
				let trigger;
				let observer;
				let invalidateModel;
				const timeline = gsap.timeline({
					paused: true,
					defaults: { ease: "power3.out" },
					onComplete: () => {
						completedRef.current = true;
						finishRef.current = null;
						trigger?.kill();
						observer?.disconnect();
						clearControls();
					},
				});
				timeline
					.to(preview, { clipPath: "inset(0% 0 0 0)", duration: at(0.48), ease: "power2.inOut" }, 0)
					.to(labels[0], { opacity: 1, y: 0, duration: at(0.22) }, at(0.14))
					.to(swatches, {
						opacity: 1,
						scale: 1,
						duration: at(0.24),
						stagger: at(0.07),
					}, at(0.18))
					.to(labels[1], { opacity: 1, y: 0, duration: at(0.2) }, at(0.29))
					.to(charms, {
						opacity: 1,
						y: 0,
						rotation: 0,
						duration: at(0.16),
						stagger: at(0.08),
					}, at(0.34))
					.to(card, { autoAlpha: 1, scale: 1, duration: at(0.25) }, at(0.55))
					.to(path, {
						strokeDashoffset: 0,
						autoRound: false,
						duration: at(0.4),
						ease: "power2.inOut",
					}, at(0.67))
					.to(head, { autoAlpha: 1, duration: at(0.06) }, at(1.07))
					.to(swatches[0], {
						scale: mobile ? 1.06 : 1.1,
						duration: at(0.085),
						ease: "sine.inOut",
					}, at(1.13))
					.to(swatches[0], {
						scale: 1,
						duration: at(0.085),
						ease: "sine.inOut",
					}, at(1.215));

				const tryPlay = () => {
					if (playing || completedRef.current || !isPreviewInView(preview, panel, section)) return;
					playing = true;
					observer?.disconnect();
					const rig = modelRigRef.current;
					if (rig?.group) {
						const { group, invalidate, modelSize } = rig;
						invalidateModel = invalidate;
						const duration = at(0.72);
						timeline
							.from(group.scale, { x: group.scale.x * 0.75, y: group.scale.y * 0.75, z: group.scale.z * 0.75, duration }, 0)
							.from(group.rotation, { y: group.rotation.y - Math.PI / 5, duration }, 0)
							.from(group.position, { y: group.position.y - modelSize * 0.05, duration, onUpdate: invalidate }, 0);
					}
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
					trigger: preview,
					start: "top 85%",
					end: "bottom top",
					onEnter: tryPlay,
					onEnterBack: tryPlay,
				});
				finishRef.current = () => {
					timeline.progress(1).pause();
				};
				tryPlay();
				return () => {
					finishRef.current = null;
					observer.disconnect();
					trigger.kill();
					invalidateModel?.();
				};
			},
			root,
		);
		return () => media.revert();
	}, [rootRef, previewRef, colourLegendRef, charmLegendRef, hintRef, arrowSvgRef, modelRigRef, isIntroDone, hintStep]);

	return completeIntro;
}
