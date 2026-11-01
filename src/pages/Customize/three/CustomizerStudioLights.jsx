function CustomizerStudioLights() {
	return (
		<>
			<hemisphereLight args={[0xffffff, 0xbfd7e7, 2]} />
			<directionalLight color="#ffffff" intensity={3.2} position={[4, 7, 6]} />
			<directionalLight color="#ffd9e8" intensity={1.15} position={[-5, 3, 2]} />
			<directionalLight color="#b8dcf7" intensity={1.4} position={[2, 3, -5]} />
		</>
	);
}

export default CustomizerStudioLights;
