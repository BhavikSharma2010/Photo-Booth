/**
 * SocialLinks - Instagram and LinkedIn profile links for the landing header.
 * Calm ink icons that shift to their brand color on hover, with a small lift.
 */

const INSTAGRAM_URL = 'https://www.instagram.com/bhaviksharma204';
const LINKEDIN_URL = 'https://www.linkedin.com/in/bhavik-sharma-3b71b22b6';

const linkClasses =
  'text-[#2C2A29]/80 transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C2A29] rounded';

export const SocialLinks = () => (
  <div className="flex items-center gap-5">
    <a
      href={INSTAGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Bhavik on Instagram"
      title="@bhaviksharma204"
      className={`${linkClasses} hover:text-[#DD2A7B]`}
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    </a>
    <a
      href={LINKEDIN_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Bhavik on LinkedIn"
      title="Bhavik Sharma on LinkedIn"
      className={`${linkClasses} hover:text-[#0A66C2]`}
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    </a>
  </div>
);
