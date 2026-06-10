import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

const DONATE_URL = 'https://app.irm.io/ajrcanada.com';
const STORAGE_KEY = 'ajr-donation-modal-dismissed';
const LOGO_SRC = '/images/Ajr Islamic Foundation Logo PNG.png';

interface DonationModalProps {
  /** Delay in milliseconds before the modal appears. Defaults to 5000ms. */
  delay?: number;
}

export function DonationModal({ delay = 5000 }: DonationModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) {
      return;
    }

    const timer = setTimeout(() => setIsOpen(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const close = () => {
    setIsOpen(false);
    sessionStorage.setItem(STORAGE_KEY, 'true');
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="donation-modal-title"
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
            onClick={close}
          />

          <motion.div
            className="relative w-full max-w-sm overflow-hidden rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-br from-gray-900/80 via-gray-800/80 to-gray-900/80 px-8 py-10 shadow-lg backdrop-blur-md"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <button
              onClick={close}
              className="absolute right-4 top-4 text-emerald-400/70 transition-colors hover:text-emerald-300"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <img
              src={LOGO_SRC}
              alt="Ajr Islamic Foundation"
              className="mx-auto mb-8 h-14 w-auto"
            />

            <h2
              id="donation-modal-title"
              className="text-center font-serif text-xl font-medium text-white"
            >
              Support Our Community
            </h2>

            <p className="mt-3 text-center text-sm leading-relaxed text-emerald-300/70">
              Help keep our masjid and programs running.
            </p>

            <a
              href={DONATE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={close}
              className="btn btn-secondary mt-8 w-full"
            >
              Donate
            </a>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
