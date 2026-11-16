import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
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
	selectedSlot,
	view,
	onViewChange,
}) {
	const controlsRef = useRef(null);
	const [modelSize, setModelSize] = useState(1);
	const [isContextLost, setIsContextLost] = useState(false);
	const handleContextLost = useCallback(() => {
		setIsContextLost(true);
	}, []);
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
					frameloop="demand"
					camera={{ fov: 36, near: 0.01, far: 200, position: INITIAL_CAMERA_POSITION }}
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
					<WebGLContextMonitor
						onLost={handleContextLost}
						onRestored={handleContextRestored}
					/>
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
							interactiveSlots={interactiveSlots}
							onLoadProgress={onLoadProgress}
							onMetrics={setModelSize}
							onModelReady={onModelReady}
							onSlotSelect={onSlotSelect}
							placements={placements}
							rotations={rotations}
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
