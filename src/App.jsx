import { BrowserRouter } from "react-router-dom";

import AppRoutes from "./routes/AppRoutes.jsx";

function App() {
	return (
		<BrowserRouter>
			<div id="site-page-content">
				<AppRoutes />
			</div>
		</BrowserRouter>
	);
}

export default App;
