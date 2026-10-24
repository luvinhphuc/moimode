import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";

import { MODEL_ASSETS } from "../../../config/modelAssets.js";
import {
	ACESFilmicToneMapping,
	SRGBColorSpace,
} from "../../../utils/three.js";
import CustomizableCrocs from "./CustomizableCrocs.jsx";
import CustomizerCameraRig from "./CustomizerCameraRig.jsx";
import {
	SceneErrorBoundary,
	SceneLoadingStatus,
} from "./CustomizerSceneFeedback.jsx";
import CustomizerStudioLights from "./CustomizerStudioLights.jsx";

function WebGLContextMonitor({ onLost, onRestored }) {
	const { gl } = useThree();

	useEffect(() => {
		const canvas = gl.domElement;
		const handleLost = (event) => {
			event.preventDefault();
			onLost();
		};

		canvas.addEventListener("webglcontextlost", handleLost, false);
		canvas.addEventListener("webglcontextrestored", onRestored, false);

		return () => {
			canvas.removeEventListener("webglcontextlost", handleLost, false);
			canvas.removeEventListener("webglcontextrestored", onRestored, false);
		};
	}, [gl, onLost, onRestored]);

	return null;
}

function CustomizerScene({
	bodyColour,
	interactiveSlots = false,
	onSlotSelect,
	placements,
	view,
	onViewChange,
}) {
	const controlsRef = useRef(null);
	const [modelSize, setModelSize] = useState(4);
	const [isContextLost, setIsContextLost] = useState(false);
	const handleContextLost = useCallback(() => {
		setIsContextLost(true);
	}, []);
	const handleContextRestored = useCallback(() => {
		setIsContextLost(false);
	}, []);

	return (
		<div className="customizer-scene" aria-label="Interactive Classic Clog preview">
			<SceneErrorBoundary>
				<Canvas
					camera={{ fov: 36, near: 0.01, far: 200, position: [4, 2.2, 7] }}
					dpr={[1, 2]}
					gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
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
						controlsRef={controlsRef}
						modelSize={modelSize}
						view={view}
					/>
					<Suspense fallback={null}>
						<CustomizableCrocs
							bodyColour={bodyColour}
							interactiveSlots={interactiveSlots}
							onMetrics={setModelSize}
							onSlotSelect={onSlotSelect}
							placements={placements}
						/>
					</Suspense>
					<OrbitControls
						ref={controlsRef}
						enableDamping
						dampingFactor={0.08}
						enablePan={false}
						minDistance={modelSize * 0.55}
						maxDistance={modelSize * 4.5}
						onStart={() => onViewChange("free")}
					/>
				</Canvas>
			</SceneErrorBoundary>
			<SceneLoadingStatus isContextLost={isContextLost} />
		</div>
	);
}

useGLTF.preload(MODEL_ASSETS.classicClog);

export default CustomizerScene;
