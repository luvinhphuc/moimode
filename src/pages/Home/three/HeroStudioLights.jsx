import { LIGHTS } from "../config/sceneConfig.js";

function HeroStudioLights() {
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

export default HeroStudioLights;
