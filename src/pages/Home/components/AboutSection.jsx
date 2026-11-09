import { useRef } from "react";

import { gsap, useGSAP } from "../../../utils/gsap.js";

function AboutSection() {
	const sectionRef = useRef(null);
	const stageRef = useRef(null);
	const titleRef = useRef(null);

	useGSAP(
		() => {
			const section = sectionRef.current;
			const stage = stageRef.current;
			const title = titleRef.current;
			const paragraphs = section.querySelectorAll(".about-copy > p");
			const motion = gsap.matchMedia();

			motion.add("(prefers-reduced-motion: no-preference)", () => {
				const viewportHeight = () => parseFloat(getComputedStyle(stage).minHeight);
				const dockedScale = () =>
					parseFloat(getComputedStyle(title).getPropertyValue("--about-docked-scale"));

				// The heading lives in its final layout slot; start it at viewport center.
				gsap.timeline({
					defaults: { ease: "none" },
					scrollTrigger: {
						id: "home-about-reveal",
						trigger: section,
						start: "top top",
						end: () => `+=${gsap.utils.clamp(320, 720, viewportHeight() * 0.7)}`,
						pin: stage,
						scrub: true,
						invalidateOnRefresh: true,
					},
				})
					.fromTo(
						title,
						{
							scale: () => 1 / dockedScale(),
							y: () => viewportHeight() / 2 - title.offsetTop - title.offsetHeight / 2,
						},
						{ scale: 1, y: 0, duration: 0.66 },
					)
					.fromTo(
						paragraphs,
						{ opacity: 0, y: 16 },
						{ opacity: 1, y: 0, duration: 0.16, stagger: { amount: 0.18 } },
					);
			});

			return () => motion.revert();
		},
		{ scope: sectionRef },
	);

	return (
		<section
			ref={sectionRef}
			id="about"
			className="about-section"
			aria-labelledby="about-title"
		>
			<div ref={stageRef} className="about-stage">
				<h2 ref={titleRef} id="about-title" className="about-title">
					ABOUT
				</h2>
				<div className="about-copy">
					<p>
						Móimode is an independent youth advocacy project that encourages Vietnamese
						Gen Z to embrace individuality and express themselves beyond fashion trends.
					</p>
					<p>
						In Vietnam's fast-moving digital fashion landscape, social media, influencers,
						and peer influence shape how young people discover and adopt styles. This
						creates a tension between wanting to fit in with popular trends and wanting to
						express their own identities. For fashion-conscious youth, the pressure to keep
						up with trends can also lead to unnecessary spending.
					</p>
					<p>
						Móimode aims to shift this mindset by promoting self-expression without the
						pressure to constantly buy new things. Through an interactive customisation
						experience, users can explore their personal styles, discover different forms
						of individuality, and share their stories with others.
					</p>
					<p>
						Using Crocs Classic Clog and Jibbitz charms as an illustrative canvas for
						creativity, Móimode is an independent project and is not sponsored or endorsed
						by Crocs.
					</p>
				</div>
			</div>
		</section>
	);
}

export default AboutSection;
