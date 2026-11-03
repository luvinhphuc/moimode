import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./styles/globals.css";
import App from "./App.jsx";

if ("scrollRestoration" in window.history) {
	window.history.scrollRestoration = "manual";
}

const resetWindowScroll = () => {
	window.scrollTo({ top: 0, left: 0, behavior: "auto" });
	window.requestAnimationFrame(() => {
		window.requestAnimationFrame(() => {
			window.scrollTo({ top: 0, left: 0, behavior: "auto" });
		});
	});
};

window.addEventListener("load", resetWindowScroll);
window.addEventListener("pageshow", resetWindowScroll);
resetWindowScroll();

createRoot(document.getElementById("root")).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
