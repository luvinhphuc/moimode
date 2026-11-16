import { gsap, ScrollTrigger, useGSAP } from "../../../../../utils/gsap.js";

export default function useStoryRevealAnimation(rootRef, items) {
	useGSAP(
		() => {
			const section = rootRef.current;
			if (!section) return undefined;

			const groups = Array.from(section.querySelectorAll("[data-story-reveal-group]"));
			const media = gsap.matchMedia();
			media.add(
				{
					reducedMotion: "(prefers-reduced-motion: reduce)",
					standardMotion: "(prefers-reduced-motion: no-preference)",
					phone: "(max-width: 767px)",
				},
				({ conditions }) => {
					if (conditions.reducedMotion || conditions.phone) {
						gsap.set(section.querySelectorAll("[data-story-content], [data-story-reveal]"), {
							clearProps: "opacity,visibility,transform",
						});
						return;
					}
					const entrance = gsap.timeline({
						scrollTrigger: {
							id: "home-stories-pin",
							trigger: section,
							start: () => section.offsetHeight > window.innerHeight ? "bottom bottom" : "top top",
							end: "+=100%",
							pin: true,
							pinSpacing: true,
							anticipatePin: 1,
							scrub: 0.4,
						},
					});

					const headingGroup = groups.find((group) => group.dataset.storyRevealGroup === "heading");
					const title = headingGroup?.querySelector("h2[data-story-reveal]");
					const copyStart = title ? 0.3 : 0;
					if (title) {
						gsap.set(title, { autoAlpha: 0, y: 40 });
						entrance.fromTo(title, { autoAlpha: 0, y: 40 }, {
							autoAlpha: 1,
							y: 0,
							duration: 0.45,
							ease: "power2.out",
							immediateRender: false,
						}, 0);
					}

					let groupIndex = 0;
					for (const group of groups) {
						const targets = group.querySelectorAll("[data-story-reveal]:not(h2)");
						if (!targets.length) continue;
						const from = { autoAlpha: 0, y: 56 };
						gsap.set(targets, from);
						const to = {
							autoAlpha: 1,
							y: 0,
							duration: 0.45,
							ease: "power2.out",
							stagger: 0.08,
							immediateRender: false,
						};
						const offset = group === headingGroup ? 0 : groupIndex++ * 0.05;
						entrance.fromTo(targets, from, to, copyStart + offset);
					}

					// Keep the revealed cards available for interaction after the entrance.
					if (title) entrance.to(title, { autoAlpha: 1, duration: 0.8 }, 1);
					ScrollTrigger.refresh(true);
				},
			);

			return () => media.revert();
		},
		{ scope: rootRef, dependencies: [items], revertOnUpdate: true },
	);
}
