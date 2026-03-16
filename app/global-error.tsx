'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
          padding: '2rem',
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Something went wrong!
          </h2>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            An unexpected error occurred.{error.digest && ` (ref: ${error.digest})`}
          </p>
          <button
            onClick={reset}
            style={{
              padding: '0.5rem 1.5rem',
              borderRadius: '0.375rem',
              border: '1px solid #ccc',
              background: '#fff',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
