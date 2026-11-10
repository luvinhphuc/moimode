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
				className="people-section"
				aria-labelledby="people-title"
			>
				<div className="people-intro-track">
					<div className="people-intro-frame">
						<h2
							id="people-title"
							className="people-title"
							aria-label={PEOPLE_COPY.title}
						>
							<span
								className="people-title__word"
								data-people-our
								aria-hidden="true"
							>
								OUR
							</span>
							<span
								className="people-title__word"
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
							<figure className="people-portrait" data-people-portrait>
								<img
									className="people-portrait__image"
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
									<SketchArrow className="people-callout__arrow" outlined />
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
				<div className="people-story">
					{PEOPLE_COPY.paragraphs.map((paragraph) => (
						<p
							className="people-story__paragraph"
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
