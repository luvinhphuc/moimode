import { BrowserRouter } from "react-router-dom";

import PageTransition from "./components/PageTransition/PageTransition.jsx";
import OverlayScrollbar from "./components/layout/OverlayScrollbar.jsx";

function App() {
	return (
		<BrowserRouter>
			<PageTransition />
			<OverlayScrollbar />
		</BrowserRouter>
	);
}

export default App;
