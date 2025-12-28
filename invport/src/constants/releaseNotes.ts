export const CURRENT_RELEASE_NOTES_VERSION = "2025.12.28";

export const RELEASE_NOTES_ITEMS: { title: string; details?: string }[] = [
  { title: "Sticky sidebar + header", details: "Navigation remains visible while scrolling on desktop." },
  { title: "Accurate submenu highlighting", details: "Active states reflect nested routes and exact matches." },
  { title: "Sequential image loading", details: "Cards and edit gallery unlock images one-by-one for smoother UX." },
  { title: "Security headers baseline", details: "HSTS, X-CTO, X-Frame-Options, Referrer-Policy, Permissions-Policy." },
  { title: "Static export reliability", details: "Build now consistently produces the 'out' folder; edit route preserved." },
];
