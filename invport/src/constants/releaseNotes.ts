export const CURRENT_RELEASE_NOTES_VERSION = "2026.03.08";

export const RELEASE_NOTES_ITEMS: { title: string; details?: string }[] = [
  { title: "Fresh mint & teal color theme", details: "Beautiful light mint (#ECF5E9) sidebar with dark teal (#1C4840) accents for a modern, clean look." },
  { title: "Page transition spinner", details: "Custom spinning logo animation between page navigations for smooth transitions." },
  { title: "Restructured navigation layout", details: "Flattened menu structure with Inventory and Add Item as separate main menu items for easier access." },
  { title: "Optimized page titles", details: "Page titles moved to header row alongside Sign Out button, with breadcrumb navigation on separate row." },
  { title: "Enhanced reports dashboard", details: "Added calculated price ranges, year ranges, and average statistics from live inventory data." },
  { title: "Footer with disclaimer", details: "Minimal 20px footer with 'Information subject to change' notice." },
  { title: "VIN Decoder for vehicles", details: "Automatically extract vehicle features from VIN codes and add them to your inventory." },
  { title: "Sticky sidebar + header", details: "Navigation remains visible while scrolling on desktop." },
  { title: "Accurate submenu highlighting", details: "Active states reflect nested routes and exact matches." },
  { title: "Sequential image loading", details: "Cards and edit gallery unlock images one-by-one for smoother UX." },
  { title: "Security headers baseline", details: "HSTS, X-CTO, X-Frame-Options, Referrer-Policy, Permissions-Policy." },
  { title: "Static export reliability", details: "Build now consistently produces the 'out' folder; edit route preserved." },
];
