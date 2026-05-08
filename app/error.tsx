'use client';

import { useEffect } from 'react';

export default function Error({
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
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2>Algo deu errado!</h2>
      <button
        onClick={() => reset()}
        className="px-4 py-2 mt-4 bg-cyan-600 text-white rounded"
      >
        Tentar novamente
      </button>
    </div>
  );
}
