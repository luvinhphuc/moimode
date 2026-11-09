function CustomizerStudioLights() {
	return (
		<>
			<hemisphereLight args={[0xffffff, 0xded1a9, 2]} />
			<directionalLight color="#ffffff" intensity={3.2} position={[4, 7, 6]} />
			<directionalLight color="#ffb2a9" intensity={1.15} position={[-5, 3, 2]} />
			<directionalLight color="#20afc5" intensity={1.4} position={[2, 3, -5]} />
		</>
	);
}

export default CustomizerStudioLights;
