import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

import { ACESFilmicToneMapping, SRGBColorSpace } from "../../../utils/three.js";
import CustomizableCrocs from "./CustomizableCrocs.jsx";
import CustomizerCameraRig from "./CustomizerCameraRig.jsx";
import { INITIAL_CAMERA_POSITION } from "./customizerCameraConfig.js";
import {
	SceneErrorBoundary,
	SceneLoadingStatus,
} from "./CustomizerSceneFeedback.jsx";
import CustomizerStudioLights from "./CustomizerStudioLights.jsx";

function WebGLContextMonitor({ onLost, onRestored }) {
	const gl = useThree((state) => state.gl);
	const invalidate = useThree((state) => state.invalidate);

	useEffect(() => {
		const canvas = gl.domElement;
		const handleLost = (event) => {
			event.preventDefault();
			onLost();
		};

		canvas.addEventListener("webglcontextlost", handleLost, false);
		const handleRestored = () => {
			onRestored();
			invalidate();
		};
		canvas.addEventListener("webglcontextrestored", handleRestored, false);

		return () => {
			canvas.removeEventListener("webglcontextlost", handleLost, false);
			canvas.removeEventListener("webglcontextrestored", handleRestored, false);
		};
	}, [gl, invalidate, onLost, onRestored]);

	return null;
}

function CaptureObserver({ ready, onCapture, onCaptureError }) {
	const captured = useRef(false);
	useFrame(({ gl, scene, camera }) => {
		gl.render(scene, camera);
		if (!ready || captured.current) return;
		captured.current = true;
		gl.domElement.toBlob((blob) => {
			if (blob) onCapture?.(blob);
			else onCaptureError?.(new Error("Could not capture the Crocs image."));
		}, "image/png");
	}, 1);
	return null;
}

function CustomizerScene({
	bodyColour,
	compactPreview = false,
	interactiveSlots = false,
	controlsEnabled = true,
	modelPending,
	onError,
	onLoadProgress,
	onSlotSelect,
	onModelReady,
	placements,
	rotations,
	selectedCharmId,
	selectedSlot,
	view,
	onViewChange,
	captureMode = false,
	onCapture,
	onCaptureError,
}) {
	const controlsRef = useRef(null);
	const [modelSize, setModelSize] = useState(1);
	const [isContextLost, setIsContextLost] = useState(false);
	const [modelReady, setModelReady] = useState(false);
	const [readySlots, setReadySlots] = useState(() => new Set());
	const handleCharmReady = useCallback((slotName) => {
		setReadySlots((current) => current.has(slotName) ? current : new Set([...current, slotName]));
	}, []);
	const handleModelReady = useCallback(() => { setModelReady(true); }, []);
	const captureReady = modelReady && readySlots.size >= Object.keys(placements).length;
	useEffect(() => {
		if (!captureMode && captureReady) onModelReady?.();
	}, [captureMode, captureReady, onModelReady]);
	const handleContextLost = useCallback(() => {
		setIsContextLost(true);
		if (captureMode) onCaptureError?.(new Error("The 3D renderer was interrupted. Please retry the capture."));
	}, [captureMode, onCaptureError]);
	const handleContextRestored = useCallback(() => {
		setIsContextLost(false);
	}, []);
	const handleControlsStart = useCallback(() => onViewChange?.("free"), [onViewChange]);

	return (
		<div
			className="customizer-scene"
			aria-label="Interactive Classic Clog preview"
		>
			<SceneErrorBoundary onError={onError}>
				<Canvas
					frameloop={captureMode ? "always" : "demand"}
					camera={{ fov: 36, near: 0.01, far: 200, position: INITIAL_CAMERA_POSITION }}
					dpr={captureMode ? 1 : [1, 2]}
					gl={{
						alpha: true,
						preserveDrawingBuffer: captureMode,
						antialias: true,
						powerPreference: "high-performance",
					}}
					onCreated={({ gl }) => {
						gl.outputColorSpace = SRGBColorSpace;
						gl.toneMapping = ACESFilmicToneMapping;
						gl.toneMappingExposure = 1;
					}}
				>
					<WebGLContextMonitor
						onLost={handleContextLost}
						onRestored={handleContextRestored}
					/>
					{captureMode ? <CaptureObserver ready={captureReady} onCapture={onCapture} onCaptureError={onCaptureError} /> : null}
					<CustomizerStudioLights />
					<CustomizerCameraRig
						compactPreview={compactPreview}
						controlsRef={controlsRef}
						modelSize={modelSize}
						view={view}
					/>
					<Suspense fallback={null}>
						<CustomizableCrocs
							bodyColour={bodyColour}
							animateCharms={!captureMode}
							onCharmReady={captureMode || onModelReady ? handleCharmReady : undefined}
							interactiveSlots={interactiveSlots}
							onLoadProgress={onLoadProgress}
							onMetrics={setModelSize}
							onModelReady={handleModelReady}
							onSlotSelect={onSlotSelect}
							placements={placements}
							rotations={rotations}
							selectedCharmId={selectedCharmId}
							selectedSlot={selectedSlot}
						/>
					</Suspense>
					<OrbitControls
						ref={controlsRef}
						enabled={controlsEnabled}
						enableRotate={controlsEnabled}
						enableZoom={controlsEnabled}
						enableDamping
						dampingFactor={0.08}
						enablePan={false}
						minDistance={modelSize * 0.55}
						maxDistance={modelSize * 4.5}
						onStart={handleControlsStart}
					/>
				</Canvas>
				<SceneLoadingStatus isContextLost={isContextLost} modelPending={modelPending} />
			</SceneErrorBoundary>
		</div>
	);
}

export default CustomizerScene;
