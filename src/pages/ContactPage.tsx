import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { SeoHead } from '../components/SeoHead';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType, sanitizeFirestorePayload } from '../lib/firestoreErrors';

export const ContactPage: React.FC = () => {
  const { settings, branches } = useApp();
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [branchName, setBranchName] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (name.trim().length < 2 || whatsapp.trim().length < 6 || message.trim().length < 5) {
      setError('Mohon lengkapi nama, nomor WhatsApp, dan pesan Anda dengan benar.');
      return;
    }
    setSubmitting(true);
    try {
      const id = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      await setDoc(
        doc(db, 'contactMessages', id),
        sanitizeFirestorePayload({
          name: name.trim(),
          whatsapp: whatsapp.trim(),
          email: email.trim(),
          branchName: branchName.trim(),
          message: message.trim(),
          status: 'new',
          createdAt: new Date().toISOString(),
        })
      );
      setSent(true);
      setName('');
      setWhatsapp('');
      setEmail('');
      setMessage('');
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.CREATE, 'contactMessages');
      } catch {
        setError('Gagal mengirim pesan. Silakan hubungi kami langsung melalui WhatsApp.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SeoHead
        title={`Kontak & WhatsApp – ${settings.institutionName}`}
        description={`Hubungi admin resmi ${settings.institutionName} via WhatsApp ${settings.whatsappNumber}.`}
        path="/kontak"
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        <div className="max-w-3xl space-y-3">
          <p className="text-sm font-semibold text-blue-700">Layanan Informasi</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Hubungi {settings.institutionName}
          </h1>
          <p className="text-slate-600 leading-relaxed">
            Untuk konsultasi program belajar, jadwal kelas, pendaftaran siswa baru, atau konfirmasi pembayaran SPP, silakan hubungi admin resmi kami.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Kontak Resmi</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="font-semibold text-slate-900">WhatsApp Admin</p>
                    <p className="text-slate-600 tabular-nums">{settings.whatsappNumber}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="font-semibold text-slate-900">Email Resmi</p>
                    <p className="text-slate-600">{settings.email}</p>
                  </div>
                </div>
              </div>
              <a
                href={settings.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                <span>Chat WhatsApp Admin Sekarang</span>
              </a>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Lokasi Cabang</h2>
              <div className="space-y-4">
                {branches.map((b) => (
                  <div key={b.id} className="pb-4 last:pb-0 border-b last:border-b-0 border-slate-100 space-y-1.5">
                    <p className="text-sm font-bold text-slate-900">{b.name}</p>
                    <p className="text-xs text-slate-600">
                      {b.address || 'Alamat lengkap dikelola melalui Dashboard Admin.'}
                    </p>
                    <a
                      href={b.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:underline"
                    >
                      <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Buka Google Maps</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Kirim Pesan ke Admin</h2>
            <p className="text-sm text-slate-600 mb-6">
              Pesan Anda akan langsung masuk ke Dashboard Admin TOMOYO Education.
            </p>
            {sent && (
              <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                Pesan Anda berhasil dikirim. Admin akan segera menghubungi Anda melalui WhatsApp atau email.
              </div>
            )}
            {error && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-medium text-slate-700 mb-1">
                    Nama Lengkap *
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
                    placeholder="Nama Orang Tua / Wali"
                  />
                </div>
                <div>
                  <label htmlFor="contact-wa" className="block text-sm font-medium text-slate-700 mb-1">
                    Nomor WhatsApp *
                  </label>
                  <input
                    id="contact-wa"
                    type="tel"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-slate-700 mb-1">
                    Email (Opsional)
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
                    placeholder="email@contoh.com"
                  />
                </div>
                <div>
                  <label htmlFor="contact-branch" className="block text-sm font-medium text-slate-700 mb-1">
                    Cabang Tujuan
                  </label>
                  <select
                    id="contact-branch"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm"
                  >
                    <option value="">Pilih cabang (opsional)</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="contact-message" className="block text-sm font-medium text-slate-700 mb-1">
                  Pesan *
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
                  placeholder="Tuliskan pertanyaan Anda mengenai program belajar, jadwal, atau pendaftaran..."
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-60 transition-colors"
              >
                <Send className="w-4 h-4" aria-hidden="true" />
                <span>{submitting ? 'Mengirim...' : 'Kirim Pesan'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};
