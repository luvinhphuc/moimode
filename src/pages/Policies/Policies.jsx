import { useEffect } from "react";
import { ArrowDown, ArrowLeft, ArrowUpRight, Eye, LockKeyhole, Mail } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { Shape } from "../../components/Shapes.jsx";
import { ROUTE_PATHS } from "../../config/routePaths.js";
import { CURRENT_DATA, LEGAL_SOURCES, POLICY_DETAILS, POLICY_NAV, RIGHTS, SHARE_DATA } from "./config/policyContent.js";

const linkStyle = "rounded-sm text-moi-accent underline underline-offset-4 decoration-moi-accent/40 hover:decoration-moi-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-moi-accent";
const bodyStyle = "space-y-4 text-base leading-[1.85] text-moi-ink/85 [&_p]:m-0";
const highlights = [
	{ Icon: LockKeyhole, title: "Your email stays private", text: "An email shared with your design is used to receive your submission and contact you about it.", colour: "bg-moi-powder/50", shape: "softStar", shapeColour: "var(--color-moi-sage)" },
	{ Icon: Eye, title: "You choose what to share", text: "Your display name and Crocs design appear in the Gallery only within the permission you give.", colour: "bg-moi-coral/35", shape: "flower", shapeColour: "var(--color-moi-coral)" },
	{ Icon: Mail, title: "You can ask for a change", text: "You can request access, corrections or removal, or withdraw your consent as provided by law.", colour: "bg-moi-sky/35", shape: "sunburst", shapeColour: "var(--color-moi-sky)" },
];

function PolicySection({ id, number, title, children }) {
	return (
		<section id={id} aria-labelledby={id + "-title"} className="scroll-mt-8 border-t border-moi-line py-9 first:border-t-0 first:pt-0 md:py-12">
			<div className="mb-5 flex items-start gap-4">
				<span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-moi-powder text-[12px] font-bold tabular-nums text-moi-accent" aria-hidden="true">{number}</span>
				<h2 id={id + "-title"} className="m-0 text-balance font-display text-2xl leading-tight font-normal md:text-3xl">{title}</h2>
			</div>
			<div className={bodyStyle}>{children}</div>
		</section>
	);
}

function Policies() {
	const { hash } = useLocation();

	useEffect(() => {
		const oldTitle = document.title;
		document.title = "Policies · Privacy & Sharing | MOIMODE";
		return () => { document.title = oldTitle; };
	}, []);

	useEffect(() => {
		if (!hash) return undefined;
		const frame = window.requestAnimationFrame(() => {
			document.getElementById(hash.slice(1))?.scrollIntoView({ block: "start" });
		});
		return () => window.cancelAnimationFrame(frame);
	}, [hash]);

	return (
		<div lang="en" className="bg-moi-bg text-moi-ink">
			<a href="#policy-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-moi-ink focus:px-5 focus:py-3 focus:text-moi-bg">Skip to policy content</a>
			<header className="border-b border-moi-line px-6 py-6 md:px-12">
				<div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
					<Link to={ROUTE_PATHS.home} aria-label="MOIMODE home" className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-moi-accent">
						<img src="/images/moimode-logo.svg" alt="MOIMODE" width="144" height="31" className="h-auto w-28 md:w-36" />
					</Link>
					<Link to={ROUTE_PATHS.home} className="inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-bold text-moi-ink no-underline hover:text-moi-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-moi-accent"><ArrowLeft size={16} aria-hidden="true" /> Back home</Link>
				</div>
			</header>

			<main id="policy-content">
				<div className="relative isolate overflow-hidden border-b border-moi-line bg-moi-powder px-6 pb-10 pt-12 md:px-12 md:pb-14 md:pt-20">
					<div aria-hidden="true" className="pointer-events-none absolute right-5 top-7 -z-10 w-16 rotate-12 text-moi-gold sm:right-12 sm:w-24 lg:right-[10%] lg:top-12 lg:w-44"><Shape type="sunburst" width="100%" color="currentColor" /></div>
					<div aria-hidden="true" className="pointer-events-none absolute -right-8 bottom-10 -z-10 hidden w-36 -rotate-12 text-moi-coral lg:block"><Shape type="flower" width="100%" color="currentColor" /></div>
					<div className="mx-auto max-w-7xl">
						<p className="mb-5 mt-0 max-w-56 text-xs font-bold uppercase tracking-[0.2em]">Your style. Your choice.</p>
						<div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
							<div className="max-w-3xl">
								<h1 className="m-0 w-fit font-display text-[clamp(3.5rem,9vw,8rem)] leading-[0.95] tracking-[-0.045em] font-normal">Policies<span className="text-moi-accent">.</span></h1>
								<p className="mb-0 mt-6 max-w-xl text-lg leading-relaxed md:text-xl">A little clarity on privacy, personal data and sharing your style with MOIMODE.</p>
							</div>
							<a href="#overview" className="inline-flex min-h-12 w-fit shrink-0 items-center gap-4 rounded-full border border-moi-ink bg-moi-powder px-5 py-3 text-sm font-bold text-moi-ink no-underline hover:bg-moi-ink hover:text-moi-bg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-moi-accent">Read the policies <ArrowDown size={17} aria-hidden="true" /></a>
						</div>
						<div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-moi-ink/20 pt-5 text-xs text-moi-ink/80">
							<span className="rounded-full bg-moi-ink px-3 py-1.5 font-bold text-moi-bg">Privacy & sharing</span>
							<span>Updated <time dateTime={POLICY_DETAILS.updatedAtISO}>{POLICY_DETAILS.updatedAt}</time></span>
							<span>Version {POLICY_DETAILS.version}</span>
						</div>
					</div>
				</div>

				<div className="mx-auto max-w-[86rem] px-6 py-10 md:px-12 md:py-14">
					<div className="mb-12 grid gap-4 md:grid-cols-3">
						{highlights.map(({ Icon, title, text, colour, shape, shapeColour }) => (
							<div key={title} className={"relative isolate overflow-hidden rounded-2xl border border-moi-line p-6 " + colour}>
								<div aria-hidden="true" className="pointer-events-none absolute -right-3 -top-4 -z-10 w-24 rotate-12 opacity-65"><Shape type={shape} width="100%" color={shapeColour} /></div>
								<Icon size={22} strokeWidth={1.5} className="mb-5 text-moi-accent" aria-hidden="true" />
								<h2 className="m-0 text-base font-bold">{title}</h2>
								<p className="mb-0 mt-3 text-sm leading-relaxed text-moi-ink/75">{text}</p>
							</div>
						))}
					</div>

					<div className="grid items-start gap-10 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-16 xl:gap-24">
						<aside className="lg:sticky lg:top-8">
							<nav aria-label="Policy contents" className="rounded-2xl bg-moi-surface/60 p-5 lg:rounded-none lg:bg-transparent lg:p-0">
								<p className="mb-4 mt-0 text-xs font-bold uppercase tracking-[0.15em] text-moi-muted">On this page</p>
								<ol className="m-0 grid list-none gap-1 p-0 sm:grid-cols-2 lg:grid-cols-1">
									{POLICY_NAV.map(({ id, label }, index) => <li key={id}><a href={"#" + id} className="flex min-h-11 items-center gap-3 rounded-md px-2 py-2 text-sm leading-snug text-moi-ink no-underline hover:bg-moi-powder focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moi-accent"><span className="text-[12px] tabular-nums text-moi-accent" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{label}</a></li>)}
								</ol>
							</nav>
							<div aria-hidden="true" className="pointer-events-none relative mx-3 mt-10 hidden -rotate-3 rounded-2xl bg-moi-coral/55 px-5 py-6 lg:block">
								<div className="absolute -right-3 -top-5 w-12 rotate-12 text-moi-gold"><Shape type="softStar" width="100%" color="currentColor" /></div>
								<p className="m-0 font-display text-xl leading-tight">Your style.<br />Your story.<br /><span className="text-moi-accent">Your say.</span></p>
							</div>
						</aside>

						<div className="min-w-0 max-w-3xl">
							<PolicySection id="overview" number="01" title="About this policy">
								<p>{POLICY_DETAILS.operator} created MOIMODE as a space to explore personal style, customise Crocs designs and share ideas. This policy explains how personal data is used in connection with the website.</p>
								<p>You can browse and explore the customiser without an account or an email address. If you choose to submit a design through Share, the submission and Gallery terms below apply.</p>
								{POLICY_DETAILS.operatorDetails && <p>Website operator: {POLICY_DETAILS.operatorDetails}.</p>}
								{POLICY_DETAILS.contactAddress && <p>Contact address: {POLICY_DETAILS.contactAddress}.</p>}
							</PolicySection>

							<PolicySection id="personal-data" number="02" title="The data we use & why">
								<p>The information involved depends on how you interact with MOIMODE. A design linked to your name or email also forms part of the submission associated with you.</p>
								<dl className="m-0 divide-y divide-moi-line">{CURRENT_DATA.map(({ name, purpose, note }) => <div key={name} className="py-5 first:pt-1"><dt className="font-bold">{name}</dt><dd className="ml-0 mt-2 space-y-2"><p>{purpose}</p><p className="text-sm text-moi-muted">{note}</p></dd></div>)}</dl>
								<p>Personal data is used for the purposes explained to you or on another applicable legal basis. If an additional purpose requires your consent, we will explain it and ask for your choice before using your data for it.</p>
							</PolicySection>

							<PolicySection id="share-gallery" number="03" title="Sharing your design & the Gallery">
								<p>When you submit through Share, your contact email, chosen display name and Crocs design are sent to the team’s inbox for review. Receiving a submission does not guarantee it will be featured.</p>
								<dl className="m-0 overflow-hidden rounded-2xl border border-moi-line">{SHARE_DATA.map(({ name, visibility, purpose }) => <div key={name} className="border-b border-moi-line p-5 last:border-b-0"><dt className="flex flex-wrap items-center justify-between gap-2 font-bold"><span>{name}</span><span className="rounded-full bg-moi-powder px-3 py-1 text-xs font-normal">{visibility}</span></dt><dd className="mb-0 ml-0 mt-2 text-sm leading-relaxed">{purpose}</dd></div>)}</dl>
								<p>After review, the team may publish only the display name, design and content you have allowed us to share. Your contact email and consent records stay private. The submission notice should make clear what you are sending and what may be made public before you confirm.</p>
								<p>The Gallery is public. Other people may view, save or reshare published content. MOIMODE can remove content from systems it controls, but cannot guarantee the recovery of every copy saved by someone else.</p>
								<p>If an edit changes the meaning of your story, or we want to use it on social media, in advertising or for another purpose, we will discuss the change with you and establish the appropriate permission or legal basis first.</p>
							</PolicySection>

							<PolicySection id="consent" number="04" title="Your choices come first">
								<p>Opening or continuing to use this website does not mean you consent to every use of your personal data.</p>
								<p>A submission notice must distinguish receiving, reviewing and contacting you about your submission from publishing your display name and design in the Gallery. Consent choices must not be preselected, and the scope, time and relevant notice must be recorded.</p>
								<p>You can choose not to submit and still use the customiser. If you choose to submit specifically for the Gallery, you need to actively allow the content intended for publication. The team’s approval does not replace your permission.</p>
								<p>Providing an email for a submission does not sign you up for marketing. Any future marketing programme requires its own notice and appropriate choice. You can request to withdraw your consent as described under <a href="#your-rights" className={linkStyle}>Your rights & removal</a>.</p>
							</PolicySection>

							<PolicySection id="third-parties" number="05" title="Third-party services & cookies">
								<p>The website loads fonts from Google Fonts and video from Squarespace CDN. Your browser may connect to these services as soon as it loads a page containing the relevant resources. These connections currently do not wait for a separate choice on this website.</p>
								<ul className="m-0 list-disc space-y-3 pl-5">
									<li><strong>Google Fonts</strong> delivers fonts through fonts.googleapis.com and fonts.gstatic.com.</li>
									<li><strong>Squarespace CDN</strong> delivers background video resources through video.squarespace-cdn.com.</li>
									{POLICY_DETAILS.hostingProvider && <li><strong>Website hosting:</strong> {POLICY_DETAILS.hostingProvider}.</li>}
									{POLICY_DETAILS.emailProviders && <li><strong>Email delivery and the team inbox:</strong> {POLICY_DETAILS.emailProviders}.</li>}
								</ul>
								<p>For submissions sent by email, the email delivery service and the provider hosting the team’s inbox may process the message, attachments and delivery information. Team members reviewing or responding to a submission may access the information needed for that purpose.</p>
								<p>Resource providers may receive technical connection information under their own service practices. These connections do not, by themselves, mean MOIMODE uses behavioural advertising tools.</p>
								<p>The current MOIMODE website does not integrate Google Analytics, Meta Pixel or analytics and advertising cookies in its own application features. If this changes, we will update this information and provide any required choices before optional tools operate.</p>
								{POLICY_DETAILS.processingLocations ? <p>Storage and processing locations: {POLICY_DETAILS.processingLocations}.</p> : <p>Depending on the services involved, data may be processed outside Vietnam. Cross-border processing is subject to applicable personal data protection requirements.</p>}
							</PolicySection>

							<PolicySection id="retention" number="06" title="Storage & protecting your data">
								<p>We retain personal data only for as long as needed for the purposes described here, unless a longer period is required by law. For Share, this includes submissions under review, submissions not selected, published work, emails, attachments, consent records and relevant backups.</p>
								{POLICY_DETAILS.retentionPeriod && <p><strong>Retention periods:</strong> {POLICY_DETAILS.retentionPeriod}.</p>}
								<p>Access should be limited to people handling the relevant activity. When a purpose ends or a valid removal request applies, the review must cover the public content, related files and copies under the team’s control, taking account of lawful retention obligations.</p>
								<p>No method of transmission or storage is completely secure. Please do not send passwords, identity documents, financial information, health data or private information that is unnecessary for your submission.</p>
							</PolicySection>

							<PolicySection id="your-rights" number="07" title="Your rights & removal requests">
								<ul className="m-0 list-disc space-y-3 pl-5">{RIGHTS.map((right) => <li key={right}>{right}</li>)}</ul>
								<div className="rounded-2xl bg-moi-powder/60 p-6">
									<h3 className="mb-2 mt-0 text-lg font-bold">Making a request</h3>
									{POLICY_DETAILS.contactEmail && <p>Contact us at <a href={"mailto:" + POLICY_DETAILS.contactEmail} className={linkStyle + " [overflow-wrap:anywhere]"}>{POLICY_DETAILS.contactEmail}</a>.</p>}
									<p>When contacting MOIMODE about your data, include the submission reference or a link to the content, what you would like changed or removed, and how we can reply. Provide only the information reasonably needed to verify your request.</p>
								</div>
								<p>Valid requests are handled under applicable law. The process requires an initial response within 2 working days. Standard processing periods are 15 days for withdrawing consent, restrictions or objections; 10 days for access, correction or a copy; and 20 days for deletion. Cases requiring another party’s involvement or an extension follow Article 5 of Decree No. 356/2025/ND-CP, including any required explanation.</p>
								<p>Withdrawing consent does not affect the lawfulness of processing already carried out on an appropriate basis. Some requests may be subject to legal exceptions or retention duties; the team should explain the basis and scope of any such exception.</p>
							</PolicySection>

							<PolicySection id="submissions" number="08" title="Your content & how it is used">
								<p>Only submit content you have the right to provide and allow us to use within your chosen scope. You keep your rights in your content; sending a submission does not transfer all ownership to MOIMODE.</p>
								<ul className="m-0 list-disc space-y-3 pl-5">
									<li>Do not submit another person’s private information or image without the appropriate rights and legal basis. Images featuring several people require consideration of each person’s rights.</li>
									<li>Do not submit impersonation, harassment, abusive or discriminatory content, or material that infringes intellectual property rights or the law.</li>
									<li>Gallery permission covers receiving, displaying and making necessary technical adjustments, such as resizing images, within the scope explained to you. It does not automatically extend to advertising or other channels.</li>
									<li>The team may decline to feature a submission or remove unsuitable content. If a story or more information is needed, we should ask you rather than write a testimonial in your name.</li>
								</ul>
								<p>Illustrative or fictional content should be clearly identified as such. A person’s name or image appearing beside a story does not, by itself, establish that they wrote it or endorsed a product.</p>
							</PolicySection>

							<PolicySection id="children" number="09" title="Children’s personal data">
								<p>Do not submit children’s private information or identifiable images unless the applicable legal requirements are met. Where a submission relates to a child, the team needs to consider the role of their legal representative and the basis for processing before accepting or publishing it.</p>
								<p>Publishing or disclosing information about the private life or personal secrets of a child aged 7 or older requires consent from both the child and their legal representative under Article 24 of Vietnam’s Personal Data Protection Law. This policy does not require every visitor to provide a date of birth or identity document.</p>
							</PolicySection>

							<PolicySection id="updates" number="10" title="Policy updates & legal references">
								<p>We will update this page when the website’s features, data, purposes or service providers change. The version and update date appear at the top. If a change requires fresh consent, publishing a revised policy does not replace your choice.</p>
								<p>This policy refers to the following Vietnamese legislation:</p>
								<ul className="m-0 list-none space-y-3 p-0">{LEGAL_SOURCES.map(({ label, href }) => <li key={href}><a href={href} target="_blank" rel="noopener noreferrer" className={linkStyle + " inline-flex items-start gap-2"}>{label}<ArrowUpRight size={16} className="mt-1 shrink-0" aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a></li>)}</ul>
							</PolicySection>
						</div>
					</div>

					<div className="relative isolate mt-12 overflow-hidden rounded-3xl bg-moi-sky/50 px-6 py-9 text-center md:mt-16 md:py-12">
						<div aria-hidden="true" className="pointer-events-none absolute -bottom-6 -left-5 -z-10 w-24 -rotate-12 text-moi-gold md:left-8 md:w-32"><Shape type="flower" width="100%" color="currentColor" /></div>
						<div aria-hidden="true" className="pointer-events-none absolute -right-3 -top-4 -z-10 w-20 rotate-12 text-moi-coral md:right-8 md:w-28"><Shape type="softStar" width="100%" color="currentColor" /></div>
						<p className="relative m-0 text-balance font-display text-2xl leading-tight md:text-4xl">Your creativity.<br className="sm:hidden" /> Your choice.</p>
						<p className="relative mb-0 mt-3 text-sm text-moi-ink/75">A space to express yourself, with room for your boundaries.</p>
					</div>
				</div>
			</main>
		</div>
	);
}

export default Policies;
