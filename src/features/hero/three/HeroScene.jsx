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
		onLoadProgress?.(Math.min(99, Math.round(progress)));
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

function HeroScene({ ariaLabel, onError, onLoadProgress, onReady }) {
	return (
		<div className="hero-canvas" role="img" aria-label={ariaLabel}>
			<SceneErrorBoundary onError={onError}>
				<Canvas
					className="hero-canvas-output"
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
					<LoadingProgress onLoadProgress={onLoadProgress} />
					<HeroStudioLights />
					<Suspense fallback={null}>
						<CrocsModel onReady={onReady} pose={CROCS_POSE} />
					</Suspense>
				</Canvas>
			</SceneErrorBoundary>
		</div>
	);
}

useGLTF.preload(MODEL_ASSETS.classicClog);

export default HeroScene;
