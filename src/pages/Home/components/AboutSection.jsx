import { useRef } from "react";

import AboutAnimation from "../animations/AboutAnimation.jsx";
import { ABOUT_COPY } from "../config/aboutContent.js";
import MiniCustomizer from "./MiniCustomizer.jsx";

function AboutSection() {
	const rootRef = useRef(null);
	const { title, who, challenge, mission, experience } = ABOUT_COPY;

	return (
		<>
			<section
				ref={rootRef}
				id="about"
				className="about-section"
				aria-labelledby="about-title"
			>
				<div className="about-frame">
					<div className="about-stage">
						<h2 id="about-title" className="about-title">
							{title}
						</h2>
					</div>

					<div className="about-editorial">
						<section
							id="about-who-we-are"
							className="about-editorial__section about-editorial__section--who"
							data-about-who
							aria-labelledby="about-who-title"
						>
							<div className="about-editorial__row">
								<p className="about-editorial__label" data-about-who-label>
									<span className="about-editorial__label-number">{who.number}</span>
									<span className="about-editorial__label-divider">/</span>
									<span>{who.label}</span>
								</p>
								<div className="about-editorial__content">
									<div className="about-editorial__mask">
										<h2
											id="about-who-title"
											className="about-editorial__headline about-editorial__headline--who"
											data-about-who-title
										>
											{who.headline[0]}
											<br />
											{who.headline[1]}
										</h2>
									</div>
									<div className="about-editorial__body-mask">
										<p className="about-editorial__body" data-about-who-copy>
											{who.body}
										</p>
									</div>
								</div>
							</div>
						</section>

						<section
							id="about-challenge"
							className="about-editorial__section about-editorial__section--challenge"
							data-about-challenge
							aria-labelledby="about-challenge-title"
						>
							<p className="about-editorial__label" data-about-challenge-label>
								<span className="about-editorial__label-number">{challenge.number}</span>
								<span className="about-editorial__label-divider">/</span>
								<span>{challenge.label}</span>
							</p>
							<h2
								id="about-challenge-title"
								className="about-editorial__challenge-title"
								aria-label={challenge.headlineLabel}
							>
								<span className="about-editorial__challenge-line-mask" aria-hidden="true">
									<span
										className="about-editorial__challenge-line about-editorial__challenge-line--fit"
										data-about-fit-line
									>
										{challenge.headline[0]}
									</span>
								</span>
								<span className="about-editorial__challenge-line-mask" aria-hidden="true">
									<span
										className="about-editorial__challenge-line about-editorial__challenge-line--stand"
										data-about-stand-line
									>
										{challenge.headline[1]}
									</span>
								</span>
							</h2>
							<div className="about-editorial__challenge-copy">
								<p className="about-editorial__body" data-about-challenge-copy>
									{challenge.body}
								</p>
							</div>
						</section>

						<section
							id="about-mission"
							className="about-editorial__section about-editorial__section--mission"
							data-about-mission
							aria-labelledby="about-mission-title"
						>
							<div className="about-editorial__row">
								<p className="about-editorial__label" data-about-mission-label>
									<span className="about-editorial__label-number">{mission.number}</span>
									<span className="about-editorial__label-divider">/</span>
									<span>{mission.label}</span>
								</p>
								<div className="about-editorial__content about-editorial__content--mission">
									<div className="about-editorial__mission-lines">
										<h2
											id="about-mission-title"
											className="about-editorial__headline about-editorial__headline--mission"
										>
											<span className="about-editorial__line-mask">
												<span
													className="about-editorial__mission-line"
													data-about-mission-line-one
												>
													{mission.headline[0]}
												</span>
											</span>
											<span className="about-editorial__line-mask">
												<span
													className="about-editorial__mission-line about-editorial__mission-line--second"
													data-about-mission-line-two
												>
													{mission.headline[1]}
												</span>
											</span>
										</h2>
									</div>
									<div className="about-editorial__body-mask">
										<p className="about-editorial__body" data-about-mission-copy>
											{mission.body}
										</p>
									</div>
								</div>
							</div>
						</section>

						<section
							id="about-experience"
							className="about-editorial__section about-editorial__section--experience"
							data-about-experience
							aria-labelledby="about-experience-title"
						>
							<div className="about-editorial__row about-editorial__row--experience">
								<p className="about-editorial__label" data-about-experience-label>
									<span className="about-editorial__label-number">{experience.number}</span>
									<span className="about-editorial__label-divider">/</span>
									<span>{experience.label}</span>
								</p>
								<div className="about-editorial__content">
									<div className="about-editorial__mask">
										<h2
											id="about-experience-title"
											className="about-editorial__headline about-editorial__headline--experience"
											data-about-experience-title
										>
											{experience.headline}
										</h2>
									</div>
								</div>
							</div>

							<div className="about-editorial__experience-layout">
								<MiniCustomizer />
								<div className="about-editorial__experience-copy">
									<div className="about-editorial__copy-mask" data-about-experience-copy>
										<p className="about-editorial__body">
											{experience.body}
										</p>
									</div>
									<div className="about-editorial__copy-mask" data-about-experience-copy>
										<p className="about-editorial__body">
											{experience.detail}
										</p>
									</div>
									<p className="about-editorial__disclaimer" data-about-disclaimer>
										{experience.disclaimer}
									</p>
								</div>
							</div>
						</section>
					</div>
				</div>
			</section>
			<AboutAnimation rootRef={rootRef} />
		</>
	);
}

export default AboutSection;
