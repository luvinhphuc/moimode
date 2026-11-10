import { useCallback, useState } from "react";

import Header from "../../components/layout/Header/Header.jsx";
import { HERO_COPY } from "./config/heroContent.js";
import AboutSection from "./components/AboutSection.jsx";
import HeroSection from "./components/HeroSection.jsx";
import PeopleSection from "./components/PeopleSection.jsx";
import SmoothScroll from "./components/SmoothScroll.jsx";
import "./Home.css";

function Home() {
	const [ctaStatus, setCtaStatus] = useState("");
	const handleStartCustomizing = useCallback(() => {
		setCtaStatus(HERO_COPY.buttonStatus);
	}, []);

	return (
		<SmoothScroll>
			<div className="home-shell">
				<Header onAction={handleStartCustomizing} />
				<HeroSection />
				<AboutSection />
				<PeopleSection />
				<p className="sr-only" role="status" aria-live="polite">
					{ctaStatus}
				</p>
			</div>
		</SmoothScroll>
	);
}

export default Home;
