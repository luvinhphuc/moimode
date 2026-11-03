import { Component, Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, useProgress } from "@react-three/drei";

import { MODEL_ASSETS } from "../../../config/modelAssets.js";
import {
	ACESFilmicToneMapping,
	SRGBColorSpace,
} from "../../../utils/three.js";
import { CAMERA, CROCS_POSE } from "../config/sceneConfig.js";
import CrocsModel from "./CrocsModel.jsx";
import HeroStudioLights from "./HeroStudioLights.jsx";

function LoadingProgress({ onLoadProgress }) {
	const { progress } = useProgress();

	useEffect(() => {
		const frame = window.requestAnimationFrame(() => {
			onLoadProgress?.(Math.min(99, Math.round(progress)));
		});

		return () => window.cancelAnimationFrame(frame);
	}, [onLoadProgress, progress]);

	return null;
}

class SceneErrorBoundary extends Component {
	state = { hasError: false };

	static getDerivedStateFromError() {
		return { hasError: true };
	}

	componentDidCatch(error) {
		this.props.onError?.(error);
	}

	render() {
		return this.state.hasError ? null : this.props.children;
	}
}

function HeroScene({
	ariaLabel,
	charmAnimationReady,
	isRenderActive = true,
	transitionControlRef,
	onError,
	onLoadProgress,
	onReady,
}) {
	return (
		<div className="hero-canvas" role="img" aria-label={ariaLabel}>
			<LoadingProgress onLoadProgress={onLoadProgress} />
			<SceneErrorBoundary onError={onError}>
				<Canvas
					className="hero-canvas-output"
					frameloop={isRenderActive ? "always" : "never"}
					camera={{
						fov: CAMERA.fov,
						near: CAMERA.near,
						far: CAMERA.far,
						position: CAMERA.direction,
					}}
					dpr={[1, 2]}
					gl={{
						alpha: true,
						antialias: true,
						powerPreference: "high-performance",
					}}
					onCreated={({ gl }) => {
						gl.outputColorSpace = SRGBColorSpace;
						gl.toneMapping = ACESFilmicToneMapping;
						gl.toneMappingExposure = 1;
					}}
				>
					<HeroStudioLights />
					<Suspense fallback={null}>
						<CrocsModel
							charmAnimationReady={charmAnimationReady}
							enablePointerMotion={isRenderActive}
							onReady={onReady}
							pose={CROCS_POSE}
							transitionControlRef={transitionControlRef}
						/>
					</Suspense>
				</Canvas>
			</SceneErrorBoundary>
		</div>
	);
}

useGLTF.preload(MODEL_ASSETS.classicClog);

export default HeroScene;
