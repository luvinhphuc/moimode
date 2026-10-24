function Preloader({ isDone = false, progress = 0 }) {
	const safeProgress = Number.isFinite(Number(progress))
		? Math.min(100, Math.max(0, Math.round(Number(progress))))
		: 0;

	return (
		<div
			className={`model-intro ${isDone ? "is-done" : ""}`}
			data-hero="intro"
			aria-hidden="true"
		>
			<span
				className="model-intro__mark"
				data-hero="intro-mark"
				aria-hidden="true"
			/>

			<div className="model-intro__progress" data-hero="intro-progress">
				<span>{safeProgress}</span>
				<i>%</i>
			</div>
		</div>
	);
}

export default Preloader;
