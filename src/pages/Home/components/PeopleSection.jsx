import { useRef } from "react";

import PeopleAnimation from "../animations/PeopleAnimation.jsx";
import { PEOPLE_COPY } from "../config/peopleContent.js";
import SketchArrow from "./SketchArrow.jsx";

function PeopleSection() {
	const rootRef = useRef(null);

	return (
		<>
			<section
				ref={rootRef}
				id="our-people"
				className="people-section relative z-[21] overflow-clip border-t border-moi-line bg-moi-bg text-moi-ink"
				aria-labelledby="people-title"
			>
				<div className="people-intro-track">
					<div className="people-intro-frame grid justify-items-center gap-[clamp(2.5rem,7svh,5rem)] px-[clamp(1rem,4vw,3rem)] pt-[clamp(5rem,13svh,8rem)]">
						<h2
							id="people-title"
							className="people-title m-0 flex w-full items-center justify-center gap-[0.16em] whitespace-nowrap font-display text-[clamp(3.2rem,8vw,9rem)] leading-[0.85] font-black tracking-[-0.075em] max-md:text-[clamp(2.2rem,9vw,4.5rem)]"
							aria-label={PEOPLE_COPY.title}
						>
							<span
								className="people-title__word inline-block motion-safe:will-change-transform"
								data-people-our
								aria-hidden="true"
							>
								OUR
							</span>
							<span
								className="people-title__word inline-block motion-safe:will-change-transform"
								data-people-people
								aria-hidden="true"
							>
								PEOPLE
							</span>
						</h2>
					</div>
				</div>
				<div className="people-portrait-track">
					<div className="people-portrait-frame">
						<div className="people-portrait-stage">
							<figure className="people-portrait m-0" data-people-portrait>
								<img
									className="block aspect-3/4 w-full object-cover object-[center_55%]"
									src={PEOPLE_COPY.photo}
									alt={PEOPLE_COPY.photoAlt}
									width="900"
									height="1350"
								/>
							</figure>
							{PEOPLE_COPY.callouts.map(({ name, side, labelTop }) => (
								<div
									className={`people-callout people-callout--${side}`}
									key={side}
								>
									<SketchArrow
										className="people-callout__arrow"
										outlined
									/>
									<span
										className="people-callout__name"
										style={{ top: labelTop }}
									>
										{name}
									</span>
								</div>
							))}
						</div>
					</div>
				</div>
				<div className="people-story mx-auto grid w-[min(100%-2.5rem,56rem)] gap-[clamp(2rem,5svh,3.5rem)] pt-[clamp(5rem,12svh,9rem)] pb-[clamp(14rem,40svh,30rem)] text-center max-md:w-[min(100%-2.5rem,34rem)]">
					{PEOPLE_COPY.paragraphs.map((paragraph) => (
						<p
							className="people-story__paragraph m-0 font-body text-[clamp(1.25rem,1.1rem+0.8vw,2rem)] leading-[1.42] font-semibold tracking-[-0.025em] first:font-extrabold max-md:text-[clamp(1.1rem,4.5vw,1.5rem)] max-md:leading-[1.5]"
							data-people-copy
							key={paragraph}
						>
							{paragraph}
						</p>
					))}
				</div>
			</section>
			<PeopleAnimation
				rootRef={rootRef}
				peopleCallouts={PEOPLE_COPY.callouts}
			/>
		</>
	);
}

export default PeopleSection;
