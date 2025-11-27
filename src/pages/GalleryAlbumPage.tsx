import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, ChevronLeft, X } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import {
  fetchGalleryAlbumPhotos,
  fetchGalleryAlbums,
  GalleryAlbum,
  GalleryAlbumDetail,
  GalleryPhoto,
} from '../services/strapi';
import { getAlbumSlug, getPreferredGalleryUrl } from '../utils/gallery';

export function GalleryAlbumPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [albumSummary, setAlbumSummary] = useState<GalleryAlbum | null>(null);
  const [albumDetail, setAlbumDetail] = useState<GalleryAlbumDetail | null>(null);
  const [modalPhoto, setModalPhoto] = useState<GalleryPhoto | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const loadAlbum = async () => {
      if (!slug) {
        setError('Album not found.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const albums = await fetchGalleryAlbums();
        const match = albums.find(album => getAlbumSlug(album.name) === slug);

        if (!match) {
          setError('We could not find that album.');
          setAlbumSummary(null);
          setAlbumDetail(null);
          return;
        }

        setAlbumSummary(match);
        const detail = await fetchGalleryAlbumPhotos(match.id);

        if (!detail) {
          setError('Unable to load photos for this album right now.');
          setAlbumDetail(null);
          return;
        }

        setAlbumDetail(detail);
      } catch (err) {
        console.error('Error loading album detail:', err);
        setError('Something went wrong while loading the album.');
      } finally {
        setLoading(false);
      }
    };

    loadAlbum();
  }, [slug]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setModalPhoto(null);
      }
    };

    if (modalPhoto) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => window.removeEventListener('keydown', handleEscape);
  }, [modalPhoto]);

  const heroBackground = useMemo(() => {
    return (
      getPreferredGalleryUrl(albumSummary?.coverPhoto) ??
      getPreferredGalleryUrl(albumDetail?.photos[0]) ??
      '/images/pattern_background.jpg'
    );
  }, [albumSummary, albumDetail]);

  const handlePhotoClick = (photo: GalleryPhoto) => setModalPhoto(photo);

  const renderLoadingState = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto mb-4" />
        <p className="text-gray-600">Loading album...</p>
      </div>
    </div>
  );

  const renderErrorState = () => (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar isScrolled={isScrolled} activeSection="gallery" />
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div className="max-w-md">
          <h1 className="font-serif text-3xl text-gray-900 mb-4">Album unavailable</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            type="button"
            onClick={() => navigate('/gallery')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to gallery
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );

  if (loading) {
    return renderLoadingState();
  }

  if (error || !albumSummary || !albumDetail) {
    return renderErrorState();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isScrolled={isScrolled} activeSection="gallery" />

      <main className="pb-16">
        <section className="relative w-full h-[320px] md:h-[360px] overflow-hidden bg-gray-950">
          <img
            src={heroBackground}
            alt={`${albumSummary.name} cover`}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950/85 via-gray-900/75 to-gray-950/85" />

          <div className="relative h-full flex flex-col justify-end px-4 md:px-8 lg:px-12 xl:px-16 pb-12 text-white">
            <button
              type="button"
              onClick={() => navigate('/gallery')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white transition-colors mb-6"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to gallery
            </button>
            <p className="uppercase tracking-[0.3em] text-xs md:text-sm text-white/70 mb-3 text-left">
              Album
            </p>
            <h1 className="font-serif font-bold text-4xl md:text-5xl mb-4 text-left">
              {albumSummary.name}
            </h1>
            <p className="text-white/85 text-left">
              {albumDetail.photos.length} {albumDetail.photos.length === 1 ? 'photo' : 'photos'}
            </p>
          </div>
        </section>

        <section className=" px-4 md:px-6 lg:px-8 xl:px-16 py-12">
          {albumDetail.photos.length === 0 ? (
            <div className="rounded-3xl bg-white border border-gray-100 p-12 text-center text-gray-600 shadow-sm">
              This album does not have any photos yet. Check back soon!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {albumDetail.photos.map(photo => (
                <motion.button
                  key={photo.id}
                  type="button"
                  onClick={() => handlePhotoClick(photo)}
                  className="group relative overflow-hidden rounded-2xl shadow-md bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.01 }}
                >
                  <img
                    src={getPreferredGalleryUrl(photo) ?? photo.url}
                    alt={photo.alternativeText || photo.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </motion.button>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />

      <AnimatePresence>
        {modalPhoto && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/70"
              onClick={() => setModalPhoto(null)}
              aria-hidden="true"
            />
            <motion.div
              className="relative z-10 max-w-4xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <button
                type="button"
                onClick={() => setModalPhoto(null)}
                className="absolute top-4 right-4 inline-flex items-center justify-center rounded-full bg-black/60 text-white p-2 hover:bg-black/80 transition-colors"
                aria-label="Close photo"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={modalPhoto.url}
                alt={modalPhoto.alternativeText || modalPhoto.name}
                className="w-full h-full object-contain bg-black"
              />
              {modalPhoto.caption && (
                <div className="p-4 bg-white text-gray-700 text-sm">
                  {modalPhoto.caption}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

