import React, { useEffect } from 'react';
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppProvider } from './contexts/AppContext';
import { PublicLayout } from './components/PublicLayout';
import { SeoHead } from './components/SeoHead';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { ProgramsPage } from './pages/ProgramsPage';
import { TeachersPage } from './pages/TeachersPage';
import { TeacherDetailPage } from './pages/TeacherDetailPage';
import { FounderPage } from './pages/FounderPage';
import { BranchesPage } from './pages/BranchesPage';
import { TestimonialsPage } from './pages/TestimonialsPage';
import { GalleryPage } from './pages/GalleryPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { SchedulePage } from './pages/SchedulePage';
import { ContactPage } from './pages/ContactPage';
import { SitemapHtmlPage } from './pages/SitemapHtmlPage';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import { RegistrationPage } from './pages/RegistrationPage';
import { ParentDashboardPage } from './pages/ParentDashboardPage';
import { AdminPage } from './pages/AdminPage';

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const NotFoundPage: React.FC = () => (
  <>
    <SeoHead
      title="Halaman Tidak Ditemukan – TOMOYO PRIVAT & BIMBEL EDUCATION"
      description="Halaman yang Anda cari tidak tersedia."
      path="/404"
      noIndex
    />
    <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-5">
      <p className="text-sm font-bold text-blue-700">404</p>
      <h1 className="text-3xl font-extrabold text-slate-900">Halaman Tidak Ditemukan</h1>
      <p className="text-sm text-slate-600 max-w-md mx-auto">
        Maaf, tautan yang Anda tuju tidak tersedia atau telah berpindah. Silakan kembali ke beranda atau jelajahi peta situs kami.
      </p>
      <div className="flex flex-wrap justify-center gap-3 pt-2">
        <Link
          to="/"
          className="px-5 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 transition-colors"
        >
          Kembali ke Beranda
        </Link>
        <Link
          to="/peta-situs"
          className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
        >
          Lihat Peta Situs
        </Link>
      </div>
    </div>
  </>
);

const withPublicLayout = (element: React.ReactNode) => (
  <PublicLayout>{element}</PublicLayout>
);

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Halaman Publik */}
            <Route path="/" element={withPublicLayout(<HomePage />)} />
            <Route path="/tentang" element={withPublicLayout(<AboutPage />)} />
            <Route path="/program" element={withPublicLayout(<ProgramsPage />)} />
            <Route path="/pengajar" element={withPublicLayout(<TeachersPage />)} />
            <Route path="/pengajar/:slug" element={withPublicLayout(<TeacherDetailPage />)} />
            <Route path="/founder" element={withPublicLayout(<FounderPage />)} />
            <Route path="/cabang" element={withPublicLayout(<BranchesPage />)} />
            <Route path="/cabang/:slug" element={withPublicLayout(<BranchesPage />)} />
            <Route path="/testimoni" element={withPublicLayout(<TestimonialsPage />)} />
            <Route path="/galeri" element={withPublicLayout(<GalleryPage />)} />
            <Route path="/pengumuman" element={withPublicLayout(<AnnouncementsPage />)} />
            <Route path="/pengumuman/:slug" element={withPublicLayout(<AnnouncementsPage />)} />
            <Route path="/jadwal" element={withPublicLayout(<SchedulePage />)} />
            <Route path="/pendaftaran" element={withPublicLayout(<RegistrationPage />)} />
            <Route path="/kontak" element={withPublicLayout(<ContactPage />)} />
            <Route path="/peta-situs" element={withPublicLayout(<SitemapHtmlPage />)} />

            {/* Portal Autentikasi & Akun Orang Tua */}
            <Route path="/login" element={withPublicLayout(<LoginPage />)} />
            <Route path="/register" element={withPublicLayout(<RegisterPage />)} />
            <Route path="/akun" element={withPublicLayout(<ParentDashboardPage />)} />

            {/* Dashboard Admin (terpisah tanpa tautan publik) */}
            <Route path="/admin" element={<AdminPage />} />

            {/* Fallback 404 */}
            <Route path="*" element={withPublicLayout(<NotFoundPage />)} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );
}
