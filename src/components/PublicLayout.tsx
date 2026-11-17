import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Phone, MapPin } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings, user, isAdmin, branches } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { to: '/tentang', label: 'Tentang' },
    { to: '/program', label: 'Program' },
    { to: '/pengajar', label: 'Pengajar' },
    { to: '/cabang', label: 'Cabang' },
    { to: '/kontak', label: 'Kontak' },
  ];

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const primaryAction =
    user && !isAdmin
      ? { to: '/akun', label: 'Dashboard Akun' }
      : { to: '/pendaftaran', label: 'Daftar Sekarang' };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Zone */}
          <Link
            to="/"
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-md"
          >
            <img
              src={settings.logoUrl || '/assets/aistudio/favicon_67ba3fe5.png'}
              alt={`Logo ${settings.institutionName}`}
              className="w-9 h-9 object-contain shrink-0"
            />
            <span className="text-base sm:text-lg font-extrabold tracking-tight text-blue-900 whitespace-nowrap shrink-0">
              TOMOYO EDUCATION
            </span>
          </Link>

          {/* Zone 2: 5 concise single-line nav links */}
          <nav
            aria-label="Navigasi utama"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
          >
            {navLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                  isActive(item.to)
                    ? 'border-blue-700 text-blue-800 font-semibold'
                    : 'border-transparent hover:text-blue-700 hover:border-amber-400'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Zone 3: 1 primary action + mobile menu button */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to={primaryAction.to}
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg bg-blue-700 text-white hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              {primaryAction.label}
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
              className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <nav
            aria-label="Menu navigasi mobile"
            className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-1 max-h-[80vh] overflow-y-auto"
          >
            {[
              { to: '/', label: 'Beranda' },
              { to: '/tentang', label: 'Tentang Kami' },
              { to: '/program', label: 'Program Belajar' },
              { to: '/pengajar', label: 'Daftar Pengajar' },
              { to: '/founder', label: 'Profil Founder' },
              { to: '/cabang', label: 'Cabang & Lokasi' },
              { to: '/jadwal', label: 'Jadwal Belajar' },
              { to: '/galeri', label: 'Galeri Kegiatan' },
              { to: '/testimoni', label: 'Testimoni' },
              { to: '/pengumuman', label: 'Pengumuman' },
              { to: '/pendaftaran', label: 'Pendaftaran Siswa' },
              { to: '/kontak', label: 'Kontak & WhatsApp' },
              { to: '/peta-situs', label: 'Peta Situs' },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium ${
                  location.pathname === item.to
                    ? 'bg-blue-50 text-blue-800 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-3 mt-3 border-t border-slate-200 flex flex-col gap-2">
              {user && !isAdmin ? (
                <Link
                  to="/akun"
                  onClick={() => setMobileOpen(false)}
                  className="w-full text-center px-4 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-semibold"
                >
                  Dashboard Akun Orang Tua
                </Link>
              ) : (
                <>
                  <Link
                    to="/pendaftaran"
                    onClick={() => setMobileOpen(false)}
                    className="w-full text-center px-4 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-semibold"
                  >
                    Daftar Siswa Sekarang
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="w-full text-center px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold"
                  >
                    Masuk Akun Orang Tua
                  </Link>
                </>
              )}
            </div>
          </nav>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={settings.logoUrl || '/assets/aistudio/favicon_67ba3fe5.png'}
                alt={`Logo ${settings.institutionName}`}
                className="w-10 h-10 object-contain bg-white rounded-lg p-1"
              />
              <div>
                <p className="text-sm font-bold text-white leading-tight">
                  {settings.institutionName}
                </p>
                <p className="text-xs text-amber-400 font-medium mt-0.5">
                  {settings.tagline}
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              {settings.brandMeaning}
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white mb-3">Profil & Akademik</h2>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/tentang" className="hover:text-white transition-colors">
                  Tentang Lembaga
                </Link>
              </li>
              <li>
                <Link to="/founder" className="hover:text-white transition-colors">
                  Profil Founder
                </Link>
              </li>
              <li>
                <Link to="/program" className="hover:text-white transition-colors">
                  Program Belajar
                </Link>
              </li>
              <li>
                <Link to="/pengajar" className="hover:text-white transition-colors">
                  Daftar Pengajar
                </Link>
              </li>
              <li>
                <Link to="/jadwal" className="hover:text-white transition-colors">
                  Jadwal Belajar
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white mb-3">Informasi & Portal</h2>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/pendaftaran" className="hover:text-white transition-colors">
                  Pendaftaran Siswa
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Masuk Akun Orang Tua
                </Link>
              </li>
              <li>
                <Link to="/pengumuman" className="hover:text-white transition-colors">
                  Pengumuman
                </Link>
              </li>
              <li>
                <Link to="/galeri" className="hover:text-white transition-colors">
                  Galeri Kegiatan
                </Link>
              </li>
              <li>
                <Link to="/testimoni" className="hover:text-white transition-colors">
                  Testimoni
                </Link>
              </li>
              <li>
                <Link to="/peta-situs" className="hover:text-white transition-colors">
                  Peta Situs
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white mb-3">Cabang & Kontak</h2>
            <ul className="space-y-3 text-sm">
              {branches.map((b) => (
                <li key={b.id} className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <Link to={`/cabang/${b.slug}`} className="hover:text-white transition-colors">
                    {b.name}
                  </Link>
                </li>
              ))}
              <li className="flex items-center gap-2 pt-1">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
                <a
                  href={settings.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors tabular-nums"
                >
                  {settings.whatsappNumber}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 py-5 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
            <p>
              &copy; {new Date().getFullYear()} {settings.institutionName}. Seluruh hak cipta dilindungi.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/kontak" className="hover:text-white transition-colors">
                Hubungi Kami
              </Link>
              <Link to="/peta-situs" className="hover:text-white transition-colors">
                Peta Situs
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
