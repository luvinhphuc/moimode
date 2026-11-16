import { Component, Suspense } from "react";
import { Canvas } from "@react-three/fiber";

import {
	ACESFilmicToneMapping,
	SRGBColorSpace,
} from "../../../utils/three.js";
import { CAMERA, CROCS_POSE } from "../config/sceneConfig.js";
import CrocsModel from "./CrocsModel.jsx";
import HeroStudioLights from "./HeroStudioLights.jsx";

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
	isRenderActive = true,
	enablePointerMotion = isRenderActive,
	transitionControlRef,
	onError,
	onLoadProgress,
	onReady,
}) {
	return (
		<div className="hero-canvas" role="img" aria-label={ariaLabel}>
			<SceneErrorBoundary onError={onError}>
				<Canvas
					className="hero-canvas-output"
					frameloop={isRenderActive ? "demand" : "never"}
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
							enablePointerMotion={enablePointerMotion}
							onLoadProgress={onLoadProgress}
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

export default HeroScene;
