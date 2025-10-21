// This file is required for Next.js static export with dynamic routes
// Since we can't pre-generate all possible IDs, we return an empty array
// and handle the actual ID via query parameters in the component

export async function generateStaticParams() {
  // Return empty array - we'll use query parameters instead of route parameters
  return [];
}

export { default } from './page';

