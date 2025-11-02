import { Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { DonatePage } from './pages/DonatePage';
import { AdminRedirect } from './pages/AdminRedirect';
import { EventDetailPage } from './pages/EventDetailPage';
import { ProgramDetailPage } from './pages/ProgramDetailPage';
import { ServicesDetailPage } from './pages/ServicesDetailPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/donate" element={<DonatePage />} />
      <Route path="/admin" element={<AdminRedirect />} />
      <Route path="/programs/:slug" element={<ProgramDetailPage />} />
      <Route path="/events/:slug" element={<EventDetailPage />} />
      <Route path="/services/:slug" element={<ServicesDetailPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;