import { Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { DonatePage } from './pages/DonatePage';
import { AdminRedirect } from './pages/AdminRedirect';
import { EventDetailPage } from './pages/EventDetailPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/donate" element={<DonatePage />} />
      <Route path="/admin" element={<AdminRedirect />} />
      <Route path="/:slug" element={<EventDetailPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;