import { useRef } from "react";

import { gsap, ScrollTrigger, useGSAP } from "../../../../../utils/gsap.js";

function setupPeopleHandoff(section) {
	const people = section.previousElementSibling;
	const story = people?.querySelector(".people-story");
	if (!people?.matches("#our-people") || !story) return undefined;

	const originalTop = people.style.getPropertyValue("--people-handoff-top");
	const updateDock = () => {
		const trailingSpace = parseFloat(getComputedStyle(story).paddingBottom);
		const top = window.innerHeight * 0.65 + trailingSpace - people.getBoundingClientRect().height;
		people.style.setProperty("--people-handoff-top", `${top}px`);
	};
	updateDock();
	people.classList.add("people-section--stories-handoff");
	ScrollTrigger.addEventListener("refreshInit", updateDock);
	const observer = new ResizeObserver(updateDock);
	observer.observe(people);

	return () => {
		observer.disconnect();
		ScrollTrigger.removeEventListener("refreshInit", updateDock);
		people.classList.remove("people-section--stories-handoff");
		if (originalTop) people.style.setProperty("--people-handoff-top", originalTop);
		else people.style.removeProperty("--people-handoff-top");
	};
}

export default function useStoryRevealAnimation(rootRef, items) {
	const revealedGroupsRef = useRef(new WeakSet());

	useGSAP(
		() => {
			const section = rootRef.current;
			if (!section) return undefined;

			const groups = Array.from(section.querySelectorAll("[data-story-reveal-group]"));
			const media = gsap.matchMedia();
			media.add(
				{
					standardMotion: "(prefers-reduced-motion: no-preference)",
					reducedMotion: "(prefers-reduced-motion: reduce)",
					tallViewport: "(min-height: 620px)",
				},
				({ conditions }) => {
					const cleanupHandoff = conditions.standardMotion && conditions.tallViewport
						? setupPeopleHandoff(section)
						: undefined;
					if (conditions.reducedMotion) {
						groups.forEach((group) => revealedGroupsRef.current.add(group));
						return cleanupHandoff;
					}
					// The section's background scrolls over Our People first; content waits
					// until that background nearly fills the viewport before revealing.
					const entrance = gsap.timeline({
						scrollTrigger: {
							id: "home-stories-entrance",
							trigger: section,
							start: cleanupHandoff ? "clamp(top 12%)" : "clamp(top 88%)",
							toggleActions: cleanupHandoff ? "play none none reset" : "play none none none",
							once: !cleanupHandoff,
						},
					});
					if (cleanupHandoff) entrance.fromTo(
						section.querySelector("[data-story-content]"),
						{ autoAlpha: 0 },
						{ autoAlpha: 1, duration: 0.1 },
						0,
					);

					const headingGroup = groups.find((group) => group.dataset.storyRevealGroup === "heading");
					const title = headingGroup?.querySelector("h2[data-story-reveal]");
					const revealTitle = title && !revealedGroupsRef.current.has(headingGroup);
					const copyStart = revealTitle ? 0.3 : 0;
					if (revealTitle) {
						gsap.set(title, { autoAlpha: 0, y: 12 });
						entrance.fromTo(title, { autoAlpha: 0, y: 12 }, {
							autoAlpha: 1,
							y: 0,
							duration: 0.3,
							ease: "power2.out",
							clearProps: "opacity,visibility,transform",
							immediateRender: false,
							onStart: () => revealedGroupsRef.current.add(headingGroup),
						}, 0);
					}

					let groupIndex = 0;
					for (const group of groups) {
						if (revealedGroupsRef.current.has(group)) continue;

						const targets = group.querySelectorAll("[data-story-reveal]:not(h2)");
						const from = { autoAlpha: 0, y: 12 };
						gsap.set(targets, from);
						const to = {
							autoAlpha: 1,
							y: 0,
							duration: 0.3,
							ease: "power2.out",
							stagger: 0.035,
							clearProps: "opacity,visibility,transform",
							immediateRender: false,
							onStart: () => revealedGroupsRef.current.add(group),
						};
						const offset = group === headingGroup ? 0 : groupIndex++ * 0.05;
						entrance.fromTo(targets, from, to, copyStart + offset);
					}

					ScrollTrigger.refresh();
					return cleanupHandoff;
				},
			);

			return () => media.revert();
		},
		{ scope: rootRef, dependencies: [items], revertOnUpdate: true },
	);
}
