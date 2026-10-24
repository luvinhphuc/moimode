import { useCallback, useRef, useState } from "react";

import Header from "../../../components/layout/Header/Header.jsx";
import Preloader from "../../../components/layout/Preloader/Preloader.jsx";
import HeroAnimation from "../animations/HeroAnimation.jsx";
import { HERO_COPY } from "../config/heroContent.js";
import ModelStage from "../three/ModelStage.jsx";
import Sparkle from "./Sparkle.jsx";

function HeroSection() {
	const rootRef = useRef(null);
	const [isSceneReady, setIsSceneReady] = useState(false);
	const [loadProgress, setLoadProgress] = useState(0);
	const [hasSceneError, setHasSceneError] = useState(false);
	const [isIntroDone, setIsIntroDone] = useState(false);
	const [ctaStatus, setCtaStatus] = useState("");
	const handleSceneReady = useCallback(() => {
		setIsSceneReady(true);
		setLoadProgress(100);
	}, []);

	const handleSceneError = useCallback(() => {
		setHasSceneError(true);
		setIsIntroDone(true);
	}, []);

	const handleIntroComplete = useCallback(() => {
		setIsIntroDone(true);
	}, []);

	const handleStartCustomizing = useCallback(() => {
		setCtaStatus(HERO_COPY.buttonStatus);
	}, []);

	return (
		<div ref={rootRef} className="hero-shell">
			<Preloader isDone={isIntroDone} progress={loadProgress} />
			<Header onAction={handleStartCustomizing} />

			<div className="hero-backdrop" aria-hidden="true">
				<div className="hero-halo" />
				<svg
					className="hero-wave"
					viewBox="0 0 1440 260"
					preserveAspectRatio="none"
				>
					<path d="M-20 170C270 55 430 255 720 142S1180 35 1460 134" />
				</svg>
			</div>
			<main id="home" className="hero-composition">
				<h1 className="sr-only">{HERO_COPY.heading}</h1>

				<div
					className="hero-slogan hero-slogan-crocs"
					data-hero="first-slogan"
					aria-hidden="true"
				>
					<span className="hero-slogan-text" data-hero="first-slogan-text">
						{HERO_COPY.firstSlogan}
					</span>
				</div>

				<ModelStage
					ariaLabel={HERO_COPY.modelAlt}
					hasError={hasSceneError}
					isReady={isSceneReady}
					progress={loadProgress}
					stageLabel={HERO_COPY.modelLabel}
					onReady={handleSceneReady}
					onLoadProgress={setLoadProgress}
					onError={handleSceneError}
				/>

				<div
					className="hero-slogan hero-slogan-way"
					data-hero="second-slogan"
					aria-hidden="true"
				>
					<span className="hero-slogan-text" data-hero="second-slogan-text">
						{HERO_COPY.secondSlogan}
					</span>
				</div>

				<Sparkle className="hero-sparkle hero-sparkle-one" />
				<Sparkle className="hero-sparkle hero-sparkle-two" />
			</main>

			<p className="sr-only" role="status" aria-live="polite">
				{ctaStatus}
			</p>

			<HeroAnimation
				hasSceneError={hasSceneError}
				isIntroDone={isIntroDone}
				isSceneReady={isSceneReady}
				onIntroComplete={handleIntroComplete}
				rootRef={rootRef}
			/>
		</div>
	);
}

export default HeroSection;
