import HeroSection from "../../features/hero/components/HeroSection.jsx";
import SmoothScroll from "../../features/hero/components/SmoothScroll.jsx";
import "./Home.css";

function Home() {
	return (
		<SmoothScroll>
			<HeroSection />
		</SmoothScroll>
	);
}

export default Home;
