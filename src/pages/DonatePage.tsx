import { useEffect } from 'react';

export function DonatePage() {
  useEffect(() => {
    window.location.href = 'https://app.irm.io/ajrcanada.com';
  }, []);

  return null;
}
