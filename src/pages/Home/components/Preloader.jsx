import { createPortal } from "react-dom";

function Preloader({ isDone = false, progress = 0 }) {
	return createPortal(
		<div
			className={`model-intro ${isDone ? "model-intro--done" : ""}`}
			data-hero="intro"
		>
			<span
				className="model-intro__mark"
				data-hero="intro-mark"
				aria-hidden="true"
			/>

			<div className="model-intro__progress" data-hero="intro-progress">
				<div className="model-intro__percent" role="progressbar" aria-label="Loading" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
					<span>{progress}</span>
					<i aria-hidden="true">%</i>
				</div>
			</div>
		</div>,
		document.body,
	);
}

export default Preloader;
