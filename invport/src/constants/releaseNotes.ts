export const CURRENT_RELEASE_NOTES_VERSION = "2026.01.25";

export const RELEASE_NOTES_ITEMS: { title: string; details?: string }[] = [
  { title: "VIN Decoder for vehicles", details: "Automatically extract vehicle features from VIN codes and add them to your inventory." },
  { title: "Sticky sidebar + header", details: "Navigation remains visible while scrolling on desktop." },
  { title: "Accurate submenu highlighting", details: "Active states reflect nested routes and exact matches." },
  { title: "Sequential image loading", details: "Cards and edit gallery unlock images one-by-one for smoother UX." },
  { title: "Security headers baseline", details: "HSTS, X-CTO, X-Frame-Options, Referrer-Policy, Permissions-Policy." },
  { title: "Static export reliability", details: "Build now consistently produces the 'out' folder; edit route preserved." },
];
