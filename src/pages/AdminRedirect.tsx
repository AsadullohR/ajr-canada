import { useEffect } from 'react';

const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || 'https://harmonious-kindness-705e180c6b.strapiapp.com';

export function AdminRedirect() {
  useEffect(() => {
    window.location.href = `${STRAPI_URL}/admin`;
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center space-y-4">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        <p className="text-white text-lg">Redirecting to Strapi Admin...</p>
      </div>
    </div>
  );
}
