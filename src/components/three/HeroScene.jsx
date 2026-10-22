import { Component, Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, useProgress } from "@react-three/drei";
import * as THREE from "three";

import { CAMERA, CROCS_MODEL_URL, CROCS_POSE, LIGHTS } from "./sceneConfig.js";
import CrocsModel from "./CrocsModel.jsx";

function LoadingProgress({ onLoadProgress }) {
	const { progress } = useProgress();

	useEffect(() => {
		onLoadProgress?.(Math.min(99, Math.round(progress)));
	}, [onLoadProgress, progress]);

	return null;
}

function StudioLights() {
	return (
		<>
			<hemisphereLight
				args={[
					LIGHTS.hemisphere.sky,
					LIGHTS.hemisphere.ground,
					LIGHTS.hemisphere.intensity,
				]}
			/>
			<directionalLight
				color={LIGHTS.key.color}
				intensity={LIGHTS.key.intensity}
				position={LIGHTS.key.position}
			/>
			<directionalLight
				color={LIGHTS.fill.color}
				intensity={LIGHTS.fill.intensity}
				position={LIGHTS.fill.position}
			/>
			<directionalLight
				color={LIGHTS.rim.color}
				intensity={LIGHTS.rim.intensity}
				position={LIGHTS.rim.position}
			/>
		</>
	);
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
						gl.outputColorSpace = THREE.SRGBColorSpace;
						gl.toneMapping = THREE.ACESFilmicToneMapping;
						gl.toneMappingExposure = 1;
					}}
				>
					<LoadingProgress onLoadProgress={onLoadProgress} />
					<StudioLights />
					<Suspense fallback={null}>
						<CrocsModel
							onReady={onReady}
							pose={CROCS_POSE}
						/>
					</Suspense>
				</Canvas>
			</SceneErrorBoundary>
		</div>
	);
}

useGLTF.preload(CROCS_MODEL_URL);

export default HeroScene;
