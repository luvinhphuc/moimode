import React from "react";

const Header = ({ heroCopy }) => {
	return (
		<header className="hero-header">
			<a
				className="hero-brand"
				href="#home"
				aria-label={`${heroCopy.brand} home`}
			>
				{heroCopy.brand}
				<span>.</span>
			</a>
			<button className="hero-customize" type="button" onClick={void 0}>
				{heroCopy.buttonLabel}
			</button>
		</header>
	);
};

export default Header;
