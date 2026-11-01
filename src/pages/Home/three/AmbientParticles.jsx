import { Sparkles } from "@react-three/drei";
import { useThree } from "@react-three/fiber";

const MOBILE_BREAKPOINT = 768;
const PARTICLE_COUNT = {
	desktop: 180,
	mobile: 120,
};

function AmbientParticles() {
	const viewportWidth = useThree((state) => state.size.width);
	const count =
		viewportWidth < MOBILE_BREAKPOINT
			? PARTICLE_COUNT.mobile
			: PARTICLE_COUNT.desktop;

	return (
		<Sparkles
			count={count}
			scale={[10, 6, 10]}
			size={1.85}
			speed={0.2}
			noise={0.85}
			color="#4da8ed"
			opacity={0.78}
		/>
	);
}

export default AmbientParticles;
