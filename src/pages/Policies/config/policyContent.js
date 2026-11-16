// Add operational details here as they are confirmed. This configuration is public.
export const POLICY_DETAILS = Object.freeze({
	operator: "The MOIMODE team",
	operatorDetails: "",
	contactEmail: "",
	contactAddress: "",
	emailProviders: "",
	hostingProvider: "",
	processingLocations: "",
	retentionPeriod: "",
	updatedAt: "16 November 2026",
	updatedAtISO: "2026-11-16",
	version: "1.0",
});

export const POLICY_NAV = Object.freeze([
	{ id: "overview", label: "About this policy" },
	{ id: "personal-data", label: "Data & purposes" },
	{ id: "share-gallery", label: "Share & the Gallery" },
	{ id: "consent", label: "Your choices" },
	{ id: "third-parties", label: "Third-party services" },
	{ id: "retention", label: "Storage & protection" },
	{ id: "your-rights", label: "Your rights & removal" },
	{ id: "submissions", label: "Submission guidelines" },
	{ id: "children", label: "Children’s data" },
	{ id: "updates", label: "Updates & references" },
]);

export const CURRENT_DATA = Object.freeze([
	{ name: "Names, images and stories", purpose: "Introducing the MOIMODE team and sharing stories about personal style. Published content can be viewed by anyone visiting the website.", note: "If an image or story relates to you, see Your rights & removal below." },
	{ name: "Your customisation choices", purpose: "Displaying the colours, charms and viewing angles you choose while exploring a Crocs design.", note: "You can explore the customiser without creating an account or entering an email address." },
	{ name: "Technical connection information", purpose: "Your browser connects to services providing fonts and video. Providers may receive your IP address, browser information and request details needed to deliver these resources.", note: "The services used by the website are described under Third-party services." },
]);

export const SHARE_DATA = Object.freeze([
	{ name: "Contact email", visibility: "Kept private", purpose: "Receiving your submission and contacting you about it. Your email is not displayed in the Gallery." },
	{ name: "Display name", visibility: "With your permission", purpose: "Crediting you alongside your design. You can choose a suitable nickname." },
	{ name: "Crocs design", visibility: "With your permission", purpose: "Letting the team review and feature the design you choose to submit." },
	{ name: "Consent choices", visibility: "Kept private", purpose: "Recording what processing and publication you agreed to, when you agreed and which notice applied." },
]);

export const RIGHTS = Object.freeze([
	"Know what personal data is being processed and why.",
	"Give, decline or request to withdraw your consent.",
	"Access your data and request a copy, correction or deletion.",
	"Request restrictions on processing or object to it as provided by law.",
	"Make a complaint, report a concern, bring legal proceedings or seek compensation as provided by law.",
]);

export const LEGAL_SOURCES = Object.freeze([
	{ label: "Vietnam’s Personal Data Protection Law No. 91/2025/QH15", href: "https://chinhphu.vn/?docid=214590&pageid=27160&typegroupid=3" },
	{ label: "Decree No. 356/2025/ND-CP", href: "https://vanban.chinhphu.vn/?docid=216387&pageid=27160" },
]);
