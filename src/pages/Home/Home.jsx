import { useCallback, useState } from "react";

import Header from "../../components/layout/Header/Header.jsx";
import { HERO_COPY } from "./config/heroContent.js";
import AboutSection from "./components/AboutSection.jsx";
import HeroSection from "./components/HeroSection.jsx";
import PeopleSection from "./components/PeopleSection.jsx";
import SmoothScroll from "./components/SmoothScroll.jsx";
import StorySection from "./features/stories/components/StorySection.jsx";
import GallerySection from "./features/gallery/components/GallerySection.jsx";
import "./Home.css";

function Home() {
	const [ctaStatus, setCtaStatus] = useState("");
	const [isIntroDone, setIsIntroDone] = useState(false);
	const [previewStatus, setPreviewStatus] = useState("loading");
	const [downloadProgress, setDownloadProgress] = useState(null);
	const handleModelProgress = useCallback(({ loaded, total }) => {
		if (total <= 0) return;
		const progress = Math.min(100, Math.floor((loaded / total) * 100));
		setDownloadProgress((previous) => Math.max(previous ?? 0, progress));
	}, []);
	const handleStartCustomizing = useCallback(() => {
		setCtaStatus(HERO_COPY.buttonStatus);
	}, []);
	const handleIntroComplete = useCallback(() => setIsIntroDone(true), []);

	return (
		<SmoothScroll>
			<div className="home-shell">
				<Header onAction={handleStartCustomizing} />
				<HeroSection
					downloadProgress={downloadProgress}
					isIntroDone={isIntroDone}
					onIntroComplete={handleIntroComplete}
					onLoadProgress={handleModelProgress}
				/>
				<AboutSection
					isIntroDone={isIntroDone}
					onPreviewStatus={setPreviewStatus}
					previewStatus={previewStatus}
				/>
				<PeopleSection />
				<StorySection />
				<GallerySection />
				<p className="home-shell__status" role="status" aria-live="polite">
					{ctaStatus}
				</p>
			</div>
		</SmoothScroll>
	);
}

export default Home;
