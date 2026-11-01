import HeroSection from "./components/HeroSection.jsx";
import SmoothScroll from "./components/SmoothScroll.jsx";
import HomeCanvas from "./three/HomeCanvas.jsx";
import "./Home.css";

function Home() {
	return (
		<SmoothScroll>
			<div className="home-shell">
				<HomeCanvas />
				<HeroSection />
			</div>
		</SmoothScroll>
	);
}

export default Home;

