import HeroScene from "./HeroScene.jsx";
import SceneStatus from "../components/SceneStatus.jsx";

function ModelStage({
	ariaLabel,
	hasError,
	isReady,
	progress,
	isRenderActive,
	stageLabel,
	transitionControlRef,
	onError,
	onLoadProgress,
	onReady,
}) {
	return (
		<section className="hero-model-stage" aria-label={stageLabel}>
			<div className="hero-model-motion" data-hero="model-motion">
				<HeroScene
					ariaLabel={ariaLabel}
					isRenderActive={isRenderActive}
					transitionControlRef={transitionControlRef}
					onReady={onReady}
					onLoadProgress={onLoadProgress}
					onError={onError}
				/>
				<SceneStatus
					hasError={hasError}
					isReady={isReady}
					progress={progress}
				/>
			</div>
		</section>
	);
}

export default ModelStage;

