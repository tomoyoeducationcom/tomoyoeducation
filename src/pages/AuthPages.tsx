import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Loader2, Mail, RefreshCw } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { SeoHead } from '../components/SeoHead';
import { mapFirebaseAuthErrorIndonesian } from '../lib/validation';

export const EmailVerificationGate: React.FC<{ onVerified?: () => void }> = ({
  onVerified,
}) => {
  const { user, resendVerification, refreshAuthUser, logout } = useApp();
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const handleResend = async () => {
    setError('');
    setFeedback('');
    setSending(true);
    try {
      await resendVerification();
      setFeedback(
        'Email verifikasi baru telah dikirim. Silakan periksa kotak masuk atau folder Spam Anda.'
      );
    } catch (err) {
      const code = (err as { code?: string })?.code || '';
      setError(mapFirebaseAuthErrorIndonesian(code));
    } finally {
      setSending(false);
    }
  };

  const handleCheck = async () => {
    setError('');
    setFeedback('');
    setChecking(true);
    try {
      const refreshed = await refreshAuthUser();
      if (refreshed?.emailVerified) {
        onVerified?.();
      } else {
        setError(
          'Email Anda belum terverifikasi. Klik tautan pada email dari Firebase terlebih dahulu (periksa juga folder Spam).'
        );
      }
    } catch {
      setError('Gagal memeriksa status verifikasi. Silakan coba lagi.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-5">
      <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
        <Mail className="w-6 h-6" aria-hidden="true" />
      </div>
      <div className="space-y-2">
        <h1 className="text-xl font-bold text-slate-900">
          Verifikasi Alamat Email Anda
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Kami telah mengirimkan tautan verifikasi ke{' '}
          <strong className="text-slate-900">{user?.email}</strong>. Anda wajib mengklik tautan verifikasi tersebut sebelum melanjutkan proses pendaftaran siswa atau mengakses dashboard orang tua.
        </p>
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-900 leading-relaxed">
          <strong>Catatan Penting:</strong> Apabila email verifikasi tidak muncul di Kotak Masuk (Inbox), silakan periksa folder <strong>Spam / Junk</strong> pada akun email Anda.
        </div>
      </div>

      {feedback && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
          {feedback}
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleCheck}
          disabled={checking}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-60 transition-colors"
        >
          {checking ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          <span>Saya Sudah Verifikasi</span>
        </button>
        <button
          type="button"
          onClick={handleResend}
          disabled={sending}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${sending ? 'animate-spin' : ''}`} />
          <span>Kirim Ulang Email</span>
        </button>
      </div>

      <div className="pt-3 border-t border-slate-100 text-center">
        <button
          type="button"
          onClick={() => void logout()}
          className="text-xs font-medium text-slate-500 hover:text-slate-800 underline"
        >
          Keluar dan gunakan akun lain
        </button>
      </div>
    </div>
  );
};

export const LoginPage: React.FC = () => {
  const { user, isAdmin, settings, loginWithEmail, loginWithGoogle, sendResetPassword } =
    useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    if (user) {
      navigate(isAdmin ? '/admin' : '/akun', { replace: true });
    }
  }, [user, isAdmin, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      await loginWithEmail(email, password);
    } catch (err) {
      const code = (err as { code?: string })?.code || '';
      setError(mapFirebaseAuthErrorIndonesian(code));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!email.trim()) {
      setError('Masukkan alamat email Anda terlebih dahulu.');
      return;
    }
    setLoading(true);
    try {
      await sendResetPassword(email);
      setInfo(
        'Tautan atur ulang kata sandi telah dikirim ke email Anda. Periksa kotak masuk atau folder Spam.'
      );
    } catch (err) {
      const code = (err as { code?: string })?.code || '';
      setError(mapFirebaseAuthErrorIndonesian(code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      const code = (err as { code?: string })?.code || '';
      setError(mapFirebaseAuthErrorIndonesian(code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SeoHead
        title={`Masuk Akun Orang Tua – ${settings.institutionName}`}
        description="Masuk ke portal orang tua dan siswa TOMOYO PRIVAT & BIMBEL EDUCATION."
        path="/login"
        noIndex
      />
      <div className="min-h-[75vh] bg-slate-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <img
              src={settings.logoUrl || '/assets/aistudio/favicon_67ba3fe5.png'}
              alt="Logo TOMOYO"
              className="w-14 h-14 mx-auto object-contain"
            />
            <h1 className="text-2xl font-extrabold text-slate-900">
              {resetMode ? 'Lupa Kata Sandi' : 'Masuk Portal Orang Tua'}
            </h1>
            <p className="text-sm text-slate-600">
              {resetMode
                ? 'Masukkan email terdaftar untuk menerima tautan reset kata sandi.'
                : 'Masuk untuk mengelola pendaftaran anak, jadwal belajar, dan pembayaran SPP.'}
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}
          {info && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
              {info}
            </div>
          )}

          {resetMode ? (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium text-slate-700 mb-1">
                  Alamat Email
                </label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
                  placeholder="nama@email.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-60 transition-colors"
              >
                {loading ? 'Mengirim...' : 'Kirim Tautan Reset Password'}
              </button>
              <button
                type="button"
                onClick={() => setResetMode(false)}
                className="w-full text-center text-xs font-semibold text-blue-700 hover:underline"
              >
                Kembali ke Halaman Masuk
              </button>
            </form>
          ) : (
            <>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
                    placeholder="nama@email.com"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="login-password" className="block text-sm font-medium text-slate-700">
                      Kata Sandi
                    </label>
                    <button
                      type="button"
                      onClick={() => setResetMode(true)}
                      className="text-xs font-semibold text-blue-700 hover:underline"
                    >
                      Lupa password?
                    </button>
                  </div>
                  <input
                    id="login-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
                    placeholder="Masukkan kata sandi"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-60 transition-colors"
                >
                  {loading ? 'Memproses...' : 'Masuk dengan Email'}
                </button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-slate-500">atau</span>
                </div>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleGoogle}
                className="w-full inline-flex items-center justify-center gap-2.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                  />
                </svg>
                <span>Masuk dengan Google</span>
              </button>

              <p className="text-center text-xs text-slate-600">
                Belum memiliki akun orang tua?{' '}
                <Link to="/register" className="font-semibold text-blue-700 hover:underline">
                  Daftar Akun di Sini
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export const RegisterPage: React.FC = () => {
  const { user, settings, registerWithEmail, loginWithGoogle } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && user.emailVerified) {
      navigate('/pendaftaran', { replace: true });
    }
  }, [user, navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }
    setLoading(true);
    try {
      await registerWithEmail(email, password);
    } catch (err) {
      const code = (err as { code?: string })?.code || '';
      setError(mapFirebaseAuthErrorIndonesian(code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      const code = (err as { code?: string })?.code || '';
      setError(mapFirebaseAuthErrorIndonesian(code));
    } finally {
      setLoading(false);
    }
  };

  if (user && !user.emailVerified) {
    return (
      <>
        <SeoHead
          title={`Verifikasi Email – ${settings.institutionName}`}
          description="Verifikasi alamat email akun orang tua sebelum melanjutkan pendaftaran siswa."
          path="/register"
          noIndex
        />
        <div className="min-h-[75vh] bg-slate-50 flex items-center justify-center px-4 py-12">
          <EmailVerificationGate onVerified={() => navigate('/pendaftaran')} />
        </div>
      </>
    );
  }

  return (
    <>
      <SeoHead
        title={`Buat Akun Orang Tua – ${settings.institutionName}`}
        description="Buat akun orang tua/wali untuk mendaftarkan siswa baru di TOMOYO PRIVAT & BIMBEL EDUCATION."
        path="/register"
        noIndex
      />
      <div className="min-h-[75vh] bg-slate-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <img
              src={settings.logoUrl || '/assets/aistudio/favicon_67ba3fe5.png'}
              alt="Logo TOMOYO"
              className="w-14 h-14 mx-auto object-contain"
            />
            <h1 className="text-2xl font-extrabold text-slate-900">
              Buat Akun Orang Tua / Wali
            </h1>
            <p className="text-sm text-slate-600">
              Satu akun orang tua dapat mengelola satu atau beberapa anak sekaligus.
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700 mb-1">
                Alamat Email Aktif
              </label>
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
                placeholder="nama@email.com"
              />
            </div>
            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium text-slate-700 mb-1">
                Kata Sandi (min. 6 karakter)
              </label>
              <input
                id="reg-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
                placeholder="Minimal 6 karakter"
              />
            </div>
            <div>
              <label htmlFor="reg-confirm" className="block text-sm font-medium text-slate-700 mb-1">
                Konfirmasi Kata Sandi
              </label>
              <input
                id="reg-confirm"
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
                placeholder="Ulangi kata sandi"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-60 transition-colors"
            >
              {loading ? 'Mendaftar...' : 'Daftar & Kirim Email Verifikasi'}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-slate-500">atau</span>
            </div>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handleGoogle}
            className="w-full inline-flex items-center justify-center gap-2.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60 transition-colors"
          >
            <span>Daftar / Masuk Cepat dengan Google</span>
          </button>

          <p className="text-center text-xs text-slate-600">
            Sudah memiliki akun?{' '}
            <Link to="/login" className="font-semibold text-blue-700 hover:underline">
              Masuk di Sini
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};
