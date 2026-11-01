import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera, View } from "@react-three/drei";

import { SRGBColorSpace } from "../../../utils/three.js";
import AmbientParticles from "./AmbientParticles.jsx";

function HomeCanvas() {
	return (
		<>
			<View className="home-background-view" index={1} aria-hidden="true">
				<PerspectiveCamera
					makeDefault
					fov={38}
					near={0.01}
					far={100}
					position={[0, 0, 5.5]}
				/>
				<AmbientParticles />
			</View>

			<div className="home-canvas" aria-hidden="true">
				<Canvas
					className="home-canvas-output"
					camera={{ fov: 36, near: 0.01, far: 100, position: [0, 0, 5] }}
					dpr={[1, 1.75]}
					flat
					gl={{
						alpha: true,
						antialias: true,
						powerPreference: "high-performance",
					}}
					onCreated={({ gl }) => {
						gl.outputColorSpace = SRGBColorSpace;
					}}
				>
					<View.Port />
				</Canvas>
			</div>
		</>
	);
}

export default HomeCanvas;
