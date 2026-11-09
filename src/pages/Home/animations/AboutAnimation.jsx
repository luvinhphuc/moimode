import { gsap, useGSAP } from "../../../utils/gsap.js";
import {
	ABOUT_DECK_MOTION,
	ABOUT_FLOW_MOTION,
	ABOUT_MOTION_MEDIA,
	ABOUT_TITLE_MOTION,
} from "../config/aboutMotionConfig.js";

function addTitleShrink(timeline, title) {
	const { start, duration, finalScale } = ABOUT_TITLE_MOTION;
	timeline.fromTo(
		title,
		{
			scale: () =>
				1 / parseFloat(getComputedStyle(title).getPropertyValue("--about-docked-scale")),
			y: () => window.innerHeight / 2 - title.offsetTop - title.offsetHeight / 2,
		},
		{ scale: finalScale, y: 0, duration, immediateRender: true },
		start,
	);
}

function setupPinnedAbout(section, frame, editorial, title) {
	const panels = Array.from(editorial.children);
	const [firstPanel, ...remainingPanels] = panels;
	const {
		firstReveal,
		firstHandoffStart,
		wipe,
		panelReveal,
		challengeTravel,
	} = ABOUT_DECK_MOTION;
	section.classList.add("about-section--deck");
	gsap.set(firstPanel, { autoAlpha: 0 });
	gsap.set(remainingPanels, { visibility: "hidden" });

	const timeline = gsap.timeline({
		defaults: { ease: "none" },
		scrollTrigger: {
			id: "home-about-deck",
			trigger: section,
			start: "top top",
			end: () => `+=${section.offsetHeight - frame.offsetHeight}`,
			scrub: true,
			invalidateOnRefresh: true,
		},
	});
	addTitleShrink(timeline, title);

	// Start from the hidden state so reversing past the reveal hides section 01 again.
	timeline
		.to(
			firstPanel,
			{ autoAlpha: 1, duration: firstReveal.duration },
			firstReveal.start,
		)
		.fromTo(
			firstPanel.children,
			{ y: firstReveal.y },
			{ y: 0, duration: firstReveal.duration, immediateRender: false },
			firstReveal.start,
		);

	remainingPanels.forEach((panel, index) => {
		const start = firstHandoffStart + index;
		timeline
			.set(panel, { visibility: "visible" }, start)
			.fromTo(
				panel,
				{ clipPath: "inset(100% 0% 0% 0%)" },
				{
					clipPath: "inset(0% 0% 0% 0%)",
					duration: wipe.duration,
					ease: wipe.ease,
					immediateRender: false,
				},
				start,
			)
			.fromTo(
				panel.children,
				{ y: panelReveal.y },
				{
					y: 0,
					duration: panelReveal.duration,
					ease: panelReveal.ease,
					immediateRender: false,
				},
				start,
			)
			.set(panels[index], { visibility: "hidden" }, start + wipe.duration);
	});

	const challenge = editorial.querySelector("[data-about-challenge]");
	timeline
		.fromTo(
			challenge.querySelectorAll("[data-about-fit-line], [data-about-stand-line]"),
			{ x: 0 },
			{
				x: (index) => window.innerWidth * challengeTravel * (index === 0 ? 1 : -1),
				duration: 1,
				immediateRender: false,
			},
		firstHandoffStart,
		)
		// Give the last panel the same amount of scroll as the others.
		.to({}, { duration: 1 }, firstHandoffStart + remainingPanels.length - 1);

	return () => section.classList.remove("about-section--deck");
}

function AboutAnimation({ rootRef }) {
	useGSAP(
		() => {
			const section = rootRef.current;
			const frame = section?.querySelector(".about-frame");
			const title = section?.querySelector("#about-title");
			const editorial = section?.querySelector(".about-editorial");
			if (!frame || !title || !editorial) return undefined;

			const motion = gsap.matchMedia();

			motion.add(
				ABOUT_MOTION_MEDIA,
				({ conditions }) => {
					if (conditions.reduceMotion) return undefined;
					if (conditions.pinned) {
						return setupPinnedAbout(section, frame, editorial, title);
					}

					const intro = gsap.timeline({
						defaults: { ease: "none" },
						scrollTrigger: {
							id: "home-about-reveal",
							trigger: section,
							start: "top top",
							end: () =>
								`+=${parseFloat(getComputedStyle(editorial).paddingBlockStart)}`,
							scrub: true,
							invalidateOnRefresh: true,
						},
					});
					addTitleShrink(intro, title);

					const whoSection = section.querySelector("[data-about-who]");
					const whoLabel = section.querySelector("[data-about-who-label]");
					const whoTitle = section.querySelector("[data-about-who-title]");
					const whoCopy = section.querySelector("[data-about-who-copy]");
					const challengeSection = section.querySelector(
						"[data-about-challenge]",
					);
					const challengeLabel = section.querySelector(
						"[data-about-challenge-label]",
					);
					const fitLine = section.querySelector("[data-about-fit-line]");
					const standLine = section.querySelector("[data-about-stand-line]");
					const challengeCopy = section.querySelector(
						"[data-about-challenge-copy]",
					);
					const missionSection = section.querySelector("[data-about-mission]");
					const missionLabel = section.querySelector(
						"[data-about-mission-label]",
					);
					const missionLineOne = section.querySelector(
						"[data-about-mission-line-one]",
					);
					const missionLineTwo = section.querySelector(
						"[data-about-mission-line-two]",
					);
					const missionCopy = section.querySelector("[data-about-mission-copy]");
					const experienceSection = section.querySelector(
						"[data-about-experience]",
					);
					const experienceLabel = section.querySelector(
						"[data-about-experience-label]",
					);
					const experienceTitle = section.querySelector(
						"[data-about-experience-title]",
					);
					const miniCustomizer = section.querySelector("[data-about-mini-customizer]");
					const experienceCopy = section.querySelectorAll(
						"[data-about-experience-copy]",
					);
					const disclaimer = section.querySelector(
						"[data-about-disclaimer]",
					);

					const { revealStart, who, challenge, mission, experience } = ABOUT_FLOW_MOTION;
					const createReveal = (trigger) =>
						gsap.timeline({
							scrollTrigger: {
								trigger,
								start: revealStart,
								toggleActions: "play none none reverse",
							},
						});

					const whoTimeline = gsap.timeline({
						scrollTrigger: {
							trigger: whoSection,
							start: who.scrollStart,
							end: who.scrollEnd,
							scrub: true,
						},
					});
					whoTimeline
						.fromTo(
							whoLabel,
							{ autoAlpha: 0, y: 14 },
							{
								autoAlpha: 1,
								duration: who.label.duration,
								ease: "power2.out",
								y: 0,
							},
							who.label.start,
						)
						.fromTo(
							whoTitle,
							{ autoAlpha: 0, yPercent: 105 },
							{
								autoAlpha: 1,
								duration: who.title.duration,
								ease: "power3.out",
								yPercent: 0,
							},
							who.title.start,
						)
						.fromTo(
							whoCopy,
							{ autoAlpha: 0, yPercent: 110 },
							{
								autoAlpha: 1,
								duration: who.copy.duration,
								ease: "power3.out",
								yPercent: 0,
							},
							who.copy.start,
						);

					const travel = conditions.isDesktop
						? challenge.travel.desktop
						: conditions.isTablet
							? challenge.travel.tablet
							: challenge.travel.mobile;
					const challengeTimeline = createReveal(challengeSection);
					challengeTimeline
						.fromTo(
							challengeLabel,
							{ autoAlpha: 0, y: 14 },
							{
								autoAlpha: 1,
								duration: challenge.label.duration,
								ease: "power2.out",
								y: 0,
							},
							challenge.label.start,
						)
						.fromTo(
							[fitLine, standLine],
							{ autoAlpha: 0, yPercent: 110 },
							{
								autoAlpha: 1,
								duration: challenge.title.duration,
								ease: "power3.out",
								stagger: challenge.title.stagger,
								yPercent: 0,
							},
							challenge.title.start,
						)
						.fromTo(
							challengeCopy,
							{ autoAlpha: 0, yPercent: 60 },
							{
								autoAlpha: 1,
								duration: challenge.copy.duration,
								ease: "power3.out",
								yPercent: 0,
							},
							challenge.copy.start,
						);

					gsap.to(fitLine, {
						ease: "none",
						scrollTrigger: {
							trigger: challengeSection,
							start: challenge.scrollStart,
							end: challenge.scrollEnd,
							scrub: challenge.scrub,
							invalidateOnRefresh: true,
						},
						x: () => window.innerWidth * travel,
					});
					gsap.to(standLine, {
						ease: "none",
						scrollTrigger: {
							trigger: challengeSection,
							start: challenge.scrollStart,
							end: challenge.scrollEnd,
							scrub: challenge.scrub,
							invalidateOnRefresh: true,
						},
						x: () => -window.innerWidth * travel,
					});

					const missionTimeline = createReveal(missionSection);
					missionTimeline
						.fromTo(
							missionLabel,
							{ autoAlpha: 0, y: 14 },
							{
								autoAlpha: 1,
								duration: mission.label.duration,
								ease: "power2.out",
								y: 0,
							},
							mission.label.start,
						)
						.fromTo(
							missionLineOne,
							{ autoAlpha: 0, x: -18, yPercent: 105 },
							{
								autoAlpha: 1,
								duration: mission.firstLine.duration,
								ease: "power3.out",
								x: 0,
								yPercent: 0,
							},
							mission.firstLine.start,
						)
						.fromTo(
							missionLineTwo,
							{ autoAlpha: 0, x: 18, yPercent: 105 },
							{
								autoAlpha: 1,
								duration: mission.secondLine.duration,
								ease: "power3.out",
								x: 0,
								yPercent: 0,
							},
							mission.secondLine.start,
						)
						.fromTo(
							missionCopy,
							{ autoAlpha: 0, yPercent: 100 },
							{
								autoAlpha: 1,
								duration: mission.copy.duration,
								ease: "power3.out",
								yPercent: 0,
							},
							mission.copy.start,
						);

					const experienceTimeline = createReveal(experienceSection);
					experienceTimeline
						.fromTo(
							experienceLabel,
							{ autoAlpha: 0, y: 14 },
							{
								autoAlpha: 1,
								duration: experience.label.duration,
								ease: "power2.out",
								y: 0,
							},
							experience.label.start,
						)
						.fromTo(
							experienceTitle,
							{ autoAlpha: 0, yPercent: 105 },
							{
								autoAlpha: 1,
								duration: experience.title.duration,
								ease: "power3.out",
								yPercent: 0,
							},
							experience.title.start,
						)
						.fromTo(
							miniCustomizer,
							{ autoAlpha: 0, scale: 0.97, y: 22 },
							{
								autoAlpha: 1,
								duration: experience.mini.duration,
								ease: "power2.out",
								scale: 1,
								y: 0,
							},
							experience.mini.start,
						)
						.fromTo(
							experienceCopy,
							{ autoAlpha: 0, yPercent: 75 },
							{
								autoAlpha: 1,
								duration: experience.copy.duration,
								ease: "power3.out",
								stagger: experience.copy.stagger,
								yPercent: 0,
							},
							experience.copy.start,
						)
						.fromTo(
							disclaimer,
							{ autoAlpha: 0, y: 12 },
							{
								autoAlpha: 1,
								duration: experience.disclaimer.duration,
								ease: "power2.out",
								y: 0,
							},
							experience.disclaimer.start,
						);
				},
			);

			return () => motion.revert();
		},
		{ scope: rootRef },
	);

	return null;
}

export default AboutAnimation;
