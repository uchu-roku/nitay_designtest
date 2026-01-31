'use client';

import dynamic from 'next/dynamic';

// Dynamically import the React component with no SSR
const App = dynamic(
  async () => {
    // Import the original React app
    const { default: App } = await import('@/frontend/src/App');
    return App;
  },
  { ssr: false }
);

export default function Home() {
  return <App />;
}
