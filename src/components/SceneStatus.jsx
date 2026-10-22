import { HERO_COPY } from "../lib/content.js";

function SceneStatus({ hasError, isReady, progress }) {
	const label = hasError
		? HERO_COPY.errorLabel
		: `${HERO_COPY.loadingLabel} ${progress}%`;

	return (
		<div
			className={`scene-status ${isReady ? "is-ready" : ""} ${hasError ? "is-error" : ""}`}
			role="status"
			aria-live="polite"
		>
			<span className="scene-status-dot" aria-hidden="true" />
			<span>{label}</span>
		</div>
	);
}

export default SceneStatus;
