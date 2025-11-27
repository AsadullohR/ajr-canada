import { Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { DonatePage } from './pages/DonatePage';
import { AdminRedirect } from './pages/AdminRedirect';
import { EventDetailPage } from './pages/EventDetailPage';
import { EventsListingPage } from './pages/EventsListingPage';
import { ProgramDetailPage } from './pages/ProgramDetailPage';
import { ServicesDetailPage } from './pages/ServicesDetailPage';
import { AnnouncementDetailPage } from './pages/AnnouncementDetailPage';
import { AnnouncementsListingPage } from './pages/AnnouncementsListingPage';
import { GalleryPage } from './pages/GalleryPage';
import { GalleryAlbumPage } from './pages/GalleryAlbumPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/donate" element={<DonatePage />} />
      <Route path="/admin" element={<AdminRedirect />} />
      <Route path="/programs/:slug" element={<ProgramDetailPage />} />
      <Route path="/events" element={<EventsListingPage />} />
      <Route path="/events/:slug" element={<EventDetailPage />} />
      <Route path="/services/:slug" element={<ServicesDetailPage />} />
      <Route path="/announcements" element={<AnnouncementsListingPage />} />
      <Route path="/announcements/:slug" element={<AnnouncementDetailPage />} />
      <Route path="/gallery" element={<GalleryPage />} />
      <Route path="/gallery/:slug" element={<GalleryAlbumPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;