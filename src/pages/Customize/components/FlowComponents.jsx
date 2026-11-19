import { ArrowLeft, ArrowRight } from "lucide-react";
import { CUSTOMIZER_STEPS } from "../config/customizerConfig.js";

function StepHeading({ step, title, description, accent = "ink" }) {
	return (
		<div className={`customizer-heading customizer-heading--${accent}`}>
			<p>Step {step}/4</p>
			<h1>{title}</h1>
			<span>{description}</span>
		</div>
	);
}

function ProgressDots({ step }) {
	return (
		<div className="customizer-progress" aria-label={`Step ${step} of 4`}>
			{CUSTOMIZER_STEPS.map((item) => (
				<span
					key={item.id}
					className={
						item.id === step ? "customizer-progress__dot customizer-progress__dot--active" : item.id < step ? "customizer-progress__dot customizer-progress__dot--done" : "customizer-progress__dot"
					}
				/>
			))}
		</div>
	);
}

function StepRail({ currentStep, onEdit }) {
	return (
		<ol className="step-rail" aria-label="Customization steps">
			{CUSTOMIZER_STEPS.map((item) => (
				<li
					key={item.id}
					className={`step-rail__step${item.id === currentStep ? " step-rail__step--active" : ""}`}
				>
					<button type="button" onClick={() => onEdit(item.id)}>
						<span>{item.id}</span>
						{item.label}
					</button>
				</li>
			))}
		</ol>
	);
}

function ViewControls({ view, onChange }) {
	return (
		<div className="view-controls" aria-label="Model view">
			{[
				["side", "Side view"],
				["top", "Top view"],
				["back", "Back view"],
			].map(([id, label]) => (
				<button
					key={id}
					type="button"
					className={`view-controls__button${view === id ? " view-controls__button--active" : ""}`}
					aria-pressed={view === id}
					onClick={() => onChange(id)}
				>
					{label}
				</button>
			))}
		</div>
	);
}

function FlowFooter({ backLabel = "Back", nextLabel, onBack, onNext, step }) {
	return (
		<footer className={`customizer-footer${step > 1 ? " customizer-footer--compact" : ""}`}>
			<button
				className="paper-button paper-button--back"
				type="button"
				onClick={onBack}
			>
				<ArrowLeft aria-hidden="true" size={17} />
				{backLabel}
			</button>
			<ProgressDots step={step} />
			<button
				className="paper-button paper-button--primary paper-button--next"
				type="button"
				onClick={onNext}
			>
				{nextLabel}
				<ArrowRight aria-hidden="true" size={18} />
			</button>
		</footer>
	);
}

export { StepHeading, StepRail, ViewControls, FlowFooter };
