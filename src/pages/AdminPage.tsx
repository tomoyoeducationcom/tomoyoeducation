import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  BookOpen,
  Building2,
  Calendar,
  CreditCard,
  FileDown,
  FileText,
  Globe,
  GraduationCap,
  Image,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Phone,
  Receipt,
  Settings,
  ShieldAlert,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { SeoHead } from '../components/SeoHead';
import { mapFirebaseAuthErrorIndonesian } from '../lib/validation';
import {
  AdminOverviewSection,
  type AdminMenuKey,
} from './admin/AdminOverviewSection';
import { AdminStudentsSection } from './admin/AdminStudentsSection';
import { AdminCurriculumSection } from './admin/AdminCurriculumSection';
import { AdminBillingSection } from './admin/AdminBillingSection';
import { AdminCmsSection } from './admin/AdminCmsSection';
import { AdminReportsSection } from './admin/AdminReportsSection';

const ADMIN_MENUS: Array<{
  key: AdminMenuKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: 'dashboard', label: '1. Dashboard Utama', icon: LayoutDashboard },
  { key: 'profil-lembaga', label: '2. Profil Lembaga', icon: Building2 },
  { key: 'siswa', label: '3. Data Siswa', icon: GraduationCap },
  { key: 'orang-tua', label: '4. Data Orang Tua', icon: Users },
  { key: 'pendaftaran', label: '5. Pendaftaran', icon: UserCheck },
  { key: 'pengajar', label: '6. Data Pengajar', icon: Users },
  { key: 'program', label: '7. Program Belajar', icon: BookOpen },
  { key: 'mapel', label: '8. Mata Pelajaran', icon: BookOpen },
  { key: 'pembayaran', label: '9. Pembayaran SPP', icon: CreditCard },
  { key: 'tagihan', label: '10. Tagihan & Jatuh Tempo', icon: Receipt },
  { key: 'laporan', label: '11. Laporan', icon: FileText },
  { key: 'galeri', label: '12. Galeri', icon: Image },
  { key: 'testimoni', label: '13. Testimoni', icon: MessageSquare },
  { key: 'pengumuman', label: '14. Pengumuman', icon: FileText },
  { key: 'jadwal', label: '15. Jadwal', icon: Calendar },
  { key: 'cabang', label: '16. Cabang', icon: Building2 },
  { key: 'founder', label: '17. Profil Founder', icon: Users },
  { key: 'pengaturan-web', label: '18. Pengaturan Website', icon: Settings },
  { key: 'seo', label: '19. Pengaturan SEO', icon: Globe },
  { key: 'kontak', label: '20. Pengaturan Kontak', icon: Phone },
  { key: 'ekspor-pdf', label: '21. Ekspor PDF', icon: FileDown },
];

export const AdminPage: React.FC = () => {
  const {
    user,
    authReady,
    isAdmin,
    serverVerifiedAdmin,
    adminVerifyLoading,
    settings,
    branches,
    loginWithEmail,
    loginWithGoogle,
    logout,
  } = useApp();

  const [activeMenu, setActiveMenu] = useState<AdminMenuKey>('dashboard');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Admin Login Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  const handleAdminEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setSigningIn(true);
    try {
      await loginWithEmail(email, password);
    } catch (err) {
      const code = (err as { code?: string })?.code || '';
      setAuthError(mapFirebaseAuthErrorIndonesian(code));
    } finally {
      setSigningIn(false);
    }
  };

  const handleAdminGoogleLogin = async () => {
    setAuthError('');
    setSigningIn(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      const code = (err as { code?: string })?.code || '';
      setAuthError(mapFirebaseAuthErrorIndonesian(code));
    } finally {
      setSigningIn(false);
    }
  };

  if (!authReady || adminVerifyLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-sm text-slate-600">
        Memverifikasi otorisasi administrator...
      </div>
    );
  }

  // Not signed in -> Admin Authentication Gate
  if (!user) {
    return (
      <>
        <SeoHead
          title={`Admin Login – ${settings.institutionName}`}
          description="Autentikasi administrator."
          path="/admin"
          noIndex
        />
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <img
                src={settings.logoUrl || '/assets/aistudio/favicon_67ba3fe5.png'}
                alt="Logo TOMOYO"
                className="w-12 h-12 mx-auto object-contain"
              />
              <h1 className="text-xl font-extrabold text-slate-900">
                Portal Administrator
              </h1>
              <p className="text-xs text-slate-500">
                Masuk menggunakan akun Firebase Administrator utama yang telah terdaftar.
              </p>
            </div>
            {authError && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}
            <form onSubmit={handleAdminEmailLogin} className="space-y-4">
              <div>
                <label htmlFor="admin-email" className="block text-sm font-medium text-slate-700 mb-1">
                  Email Admin
                </label>
                <input
                  id="admin-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="admin-pass" className="block text-sm font-medium text-slate-700 mb-1">
                  Kata Sandi
                </label>
                <input
                  id="admin-pass"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={signingIn}
                className="w-full py-2.5 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-60"
              >
                {signingIn ? 'Memverifikasi...' : 'Masuk Administrator'}
              </button>
            </form>
            <button
              type="button"
              disabled={signingIn}
              onClick={handleAdminGoogleLogin}
              className="w-full py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm font-semibold hover:bg-slate-50"
            >
              Masuk dengan Google Admin
            </button>
          </div>
        </div>
      </>
    );
  }

  // Signed in, but NOT the verified Admin UID -> Access Denied
  if (!isAdmin || !serverVerifiedAdmin) {
    return (
      <>
        <SeoHead
          title="Akses Ditolak"
          description="Halaman ini hanya dapat diakses oleh administrator resmi."
          path="/admin"
          noIndex
        />
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-red-200 rounded-xl p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-700 mx-auto flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" aria-hidden="true" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900">Akses Ditolak</h1>
            <p className="text-sm text-slate-600">
              Akun <strong>{user.email}</strong> tidak memiliki otorisasi administrator untuk mengakses panel ini.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link
                to="/akun"
                className="px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold"
              >
                Ke Dashboard Orang Tua
              </Link>
              <button
                type="button"
                onClick={() => void logout()}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold"
              >
                Keluar Akun
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const currentMenuObj = ADMIN_MENUS.find((m) => m.key === activeMenu);

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return (
          <AdminOverviewSection
            branchFilter={branchFilter}
            onNavigate={setActiveMenu}
          />
        );
      case 'siswa':
      case 'orang-tua':
      case 'pendaftaran':
        return (
          <AdminStudentsSection mode={activeMenu} branchFilter={branchFilter} />
        );
      case 'pengajar':
      case 'program':
      case 'mapel':
      case 'jadwal':
      case 'cabang':
        return <AdminCurriculumSection mode={activeMenu} />;
      case 'pembayaran':
      case 'tagihan':
        return (
          <AdminBillingSection mode={activeMenu} branchFilter={branchFilter} />
        );
      case 'laporan':
      case 'ekspor-pdf':
        return <AdminReportsSection branchFilter={branchFilter} />;
      case 'profil-lembaga':
      case 'galeri':
      case 'testimoni':
      case 'pengumuman':
      case 'founder':
      case 'pengaturan-web':
      case 'seo':
      case 'kontak':
        return <AdminCmsSection mode={activeMenu} />;
      default:
        return null;
    }
  };

  return (
    <>
      <SeoHead
        title={`Dashboard Admin – ${settings.institutionName}`}
        description="Panel manajemen internal TOMOYO PRIVAT & BIMBEL EDUCATION."
        path="/admin"
        noIndex
      />
      <div className="min-h-screen bg-slate-50 flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col w-64 bg-slate-900 text-slate-300 shrink-0 border-r border-slate-800">
          <div className="p-4 border-b border-slate-800 flex items-center gap-2.5">
            <img
              src={settings.logoUrl || '/assets/aistudio/favicon_67ba3fe5.png'}
              alt="Logo"
              className="w-8 h-8 object-contain bg-white rounded p-0.5"
            />
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-white truncate">TOMOYO ADMIN</p>
              <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
            {ADMIN_MENUS.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setActiveMenu(m.key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                    activeMenu === m.key
                      ? 'bg-blue-700 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{m.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="p-3 border-t border-slate-800 space-y-2">
            <Link
              to="/"
              className="block w-full text-center py-2 rounded-lg border border-slate-700 text-xs font-semibold text-slate-200 hover:bg-slate-800"
            >
              Lihat Website Publik
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-red-700 hover:text-white transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar Admin</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Buka menu admin"
                className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-700"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 truncate">
                {currentMenuObj?.label || 'Dashboard Admin'}
              </h1>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <label htmlFor="admin-branch-filter" className="hidden sm:inline text-xs font-semibold text-slate-600">
                Cabang:
              </label>
              <select
                id="admin-branch-filter"
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs sm:text-sm max-w-[200px]"
              >
                <option value="all">Semua Cabang</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
            {renderContent()}
          </main>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/50"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-72 max-w-[85vw] bg-slate-900 text-slate-200 h-full flex flex-col z-10">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <span className="text-sm font-extrabold text-white">Menu Admin</span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Tutup menu admin"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                {ADMIN_MENUS.map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => {
                        setActiveMenu(m.key);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-left ${
                        activeMenu === m.key
                          ? 'bg-blue-700 text-white font-semibold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </nav>
              <div className="p-3 border-t border-slate-800 flex gap-2">
                <Link
                  to="/"
                  className="flex-1 text-center py-2 rounded-lg border border-slate-700 text-xs font-semibold"
                >
                  Website
                </Link>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="flex-1 py-2 rounded-lg bg-red-700 text-white text-xs font-semibold"
                >
                  Keluar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
