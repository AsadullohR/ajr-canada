import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Images, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import {
  fetchGalleryAlbums,
  GalleryAlbum,
} from '../services/strapi';
import { getAlbumSlug, getPreferredGalleryUrl } from '../utils/gallery';

export function GalleryPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [loadingAlbums, setLoadingAlbums] = useState(true);
  const [albumsError, setAlbumsError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const loadAlbums = async () => {
      setLoadingAlbums(true);
      setAlbumsError(null);

      try {
        const data = await fetchGalleryAlbums();
        setAlbums(data);
        if (!data.length) {
          setAlbumsError('No albums have been published yet. Please check back soon.');
        }
      } catch (error) {
        console.error('Error loading gallery albums:', error);
        setAlbumsError('Unable to load gallery albums right now.');
      } finally {
        setLoadingAlbums(false);
      }
    };

    loadAlbums();
  }, []);

  const handleAlbumClick = (album: GalleryAlbum) => {
    navigate(`/gallery/${getAlbumSlug(album.name)}`);
  };

  const renderLoadingState = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center gap-3 text-gray-600">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
          <span>Loading gallery...</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isScrolled={isScrolled} activeSection="gallery" />

      <main className="pb-16">
        {/* Hero */}
        <section className="relative w-full h-[320px] md:h-[360px] overflow-hidden bg-gray-950">
          <img
            src="/images/pattern_background.jpg"
            alt="Pattern background"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950/85 via-gray-900/80 to-gray-950/85" />

          <div className="relative h-full flex flex-col justify-end px-4 md:px-8 lg:px-12 xl:px-16 pb-12 text-white">
            <p className="uppercase tracking-[0.3em] text-xs md:text-sm text-white/70 mb-3 text-left">
              Memories & Moments
            </p>
            <h1 className="font-serif font-bold text-4xl md:text-5xl mb-4 text-left">Photo Gallery</h1>
            <p className="text-white/90 max-w-2xl text-base md:text-lg text-left">
              Explore highlights from our programs, events, and gatherings captured through the lens of our volunteers.
            </p>
          </div>
        </section>

        {loadingAlbums ? (
          renderLoadingState()
        ) : (
          <>
            <section className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 xl:px-16 py-12">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
                <div>
                  <p className="text-sm uppercase tracking-widest text-emerald-600 font-semibold mb-2">
                    Albums
                  </p>
                  <h2 className="font-serif text-3xl text-gray-900">Browse by occasion</h2>
                  <p className="text-gray-600 mt-2 max-w-2xl">
                    Flip through curated highlights from gatherings large and small—family festivals,
                    youth programs, workshops, and quiet moments in between. New albums appear here as
                    soon as our media team publishes them.
                  </p>
                </div>
              </div>

              {albumsError && (
                <div className="rounded-2xl bg-white border border-rose-100 p-6 text-center text-rose-600">
                  {albumsError}
                </div>
              )}

              {!albumsError && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {albums.map((album, index) => (
                    <motion.button
                      key={album.id}
                      type="button"
                      onClick={() => handleAlbumClick(album)}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="text-left rounded-3xl overflow-hidden bg-white shadow-lg hover:shadow-xl transition-all duration-300 border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden">
                        {album.coverPhoto ? (
                          <img
                            src={
                              getPreferredGalleryUrl(album.coverPhoto) ?? album.coverPhoto.url
                            }
                            alt={album.coverPhoto.alternativeText || album.coverPhoto.name}
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 flex flex-col items-center justify-center gap-3 text-gray-500">
                            <Images className="w-10 h-10" />
                            <span className="text-sm font-medium">Awaiting cover photo</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
                        <div className="absolute bottom-4 left-4 rounded-full bg-white/90 text-gray-900 text-xs font-semibold px-3 py-1">
                          {album.photoCount} {album.photoCount === 1 ? 'photo' : 'photos'}
                        </div>
                      </div>
                      <div className="px-5 py-5">
                        <p className="uppercase tracking-[0.3em] text-xs text-emerald-600 mb-2">
                          Album
                        </p>
                        <h3 className="font-serif text-2xl text-gray-900 mb-1">{album.name}</h3>
                        <p className="text-sm text-gray-500">Click to view collage</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </section>

          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

