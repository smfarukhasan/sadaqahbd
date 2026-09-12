import React from 'react';
import Link from 'next/link';

export default function RootNotFound() {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', margin: 0 }}>
        <div style={{ textAlign: 'center' }}>
          <h1>404 - Page Not Found</h1>
          <p>The requested page could not be found.</p>
          <Link href="/bn">Go to Home</Link>
        </div>
      </body>
    </html>
  );
}
