import React, { useState, useEffect } from 'react';
import { deleteDoc, doc, setDoc } from 'firebase/firestore';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { CloudinaryUpload } from '../../components/CloudinaryUpload';
import { db } from '../../lib/firebase';
import {
  handleFirestoreError,
  OperationType,
  sanitizeFirestorePayload,
} from '../../lib/firestoreErrors';
import { slugify } from '../../lib/validation';
import { getTodayIndonesiaISO } from '../../lib/billing';
import type {
  Announcement,
  FounderProfile,
  GalleryItem,
  SiteSettings,
  Testimonial,
} from '../../types';

export const AdminCmsSection: React.FC<{
  mode:
    | 'profil-lembaga'
    | 'galeri'
    | 'testimoni'
    | 'pengumuman'
    | 'founder'
    | 'pengaturan-web'
    | 'seo'
    | 'kontak';
}> = ({ mode }) => {
  const {
    settings,
    seoSettings,
    founder,
    galleries,
    testimonials,
    announcements,
    contactMessages,
  } = useApp();

  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState('');

  // Site settings form state
  const [siteForm, setSiteForm] = useState<SiteSettings>(settings);
  const [missionText, setMissionText] = useState(settings.mission.join('\n'));

  useEffect(() => {
    setSiteForm(settings);
    setMissionText(settings.mission.join('\n'));
  }, [settings]);

  // Founder form state
  const [founderForm, setFounderForm] = useState<FounderProfile>(founder);
  const [founderEduText, setFounderEduText] = useState(founder.education.join('\n'));
  const [founderExpText, setFounderExpText] = useState(founder.experience.join('\n'));

  useEffect(() => {
    setFounderForm(founder);
    setFounderEduText(founder.education.join('\n'));
    setFounderExpText(founder.experience.join('\n'));
  }, [founder]);

  // Gallery / Testimonial / Announcement edit state
  const [editGallery, setEditGallery] = useState<Partial<GalleryItem> | null>(null);
  const [editTestimonial, setEditTestimonial] = useState<Partial<Testimonial> | null>(null);
  const [editAnnouncement, setEditAnnouncement] = useState<Partial<Announcement> | null>(null);

  // SEO form state
  const [seoKey, setSeoKey] = useState('default');
  const currentSeo = seoSettings.find((s) => s.pageKey === seoKey) || {
    id: seoKey,
    pageKey: seoKey,
    title: '',
    description: '',
    ogImageUrl: '',
    noIndex: false,
  };
  const [seoTitle, setSeoTitle] = useState(currentSeo.title);
  const [seoDesc, setSeoDesc] = useState(currentSeo.description);
  const [seoOgImg, setSeoOgImg] = useState(currentSeo.ogImageUrl);

  useEffect(() => {
    const match = seoSettings.find((s) => s.pageKey === seoKey);
    setSeoTitle(match?.title || '');
    setSeoDesc(match?.description || '');
    setSeoOgImg(match?.ogImageUrl || '');
  }, [seoKey, seoSettings]);

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedNotice('');
    try {
      const { id: _id, ...rest } = siteForm;
      await setDoc(
        doc(db, 'settings', 'main'),
        sanitizeFirestorePayload({
          ...rest,
          mission: missionText
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean)
            .slice(0, 20),
          updatedAt: new Date().toISOString(),
        })
      );
      setSavedNotice('Pengaturan berhasil disimpan ke Firestore.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/main');
    } finally {
      setSaving(false);
    }
  };

  if (mode === 'profil-lembaga' || mode === 'pengaturan-web' || mode === 'kontak') {
    const moveSection = (idx: number, dir: -1 | 1) => {
      const sorted = [...siteForm.homeSections].sort((a, b) => a.order - b.order);
      const target = idx + dir;
      if (target < 0 || target >= sorted.length) return;
      const temp = sorted[idx];
      sorted[idx] = sorted[target];
      sorted[target] = temp;
      const reordered = sorted.map((s, i) => ({ ...s, order: i + 1 }));
      setSiteForm({ ...siteForm, homeSections: reordered });
    };

    return (
      <div className="space-y-6">
        <form
          onSubmit={saveSettings}
          className="bg-white border border-slate-200 rounded-xl p-6 space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              {mode === 'profil-lembaga'
                ? 'Profil Lembaga, Visi, Misi & Filosofi TOMOYO'
                : mode === 'kontak'
                ? 'Pengaturan Kontak & WhatsApp'
                : 'Pengaturan Website & Bagian Beranda'}
            </h2>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-60"
            >
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
          {savedNotice && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
              {savedNotice}
            </div>
          )}

          {mode === 'profil-lembaga' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nama Lembaga
                  </label>
                  <input
                    type="text"
                    required
                    value={siteForm.institutionName}
                    onChange={(e) =>
                      setSiteForm({ ...siteForm, institutionName: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tanggal Berdiri Lembaga (dapat diisi kapan saja)
                  </label>
                  <input
                    type="text"
                    value={siteForm.foundedDate}
                    onChange={(e) =>
                      setSiteForm({ ...siteForm, foundedDate: e.target.value })
                    }
                    placeholder="Contoh: 12 Mei 2024 (kosongkan jika belum ditentukan)"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Makna Brand TOMOYO
                </label>
                <input
                  type="text"
                  value={siteForm.brandMeaning}
                  onChange={(e) =>
                    setSiteForm({ ...siteForm, brandMeaning: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tentang Lembaga
                </label>
                <textarea
                  rows={4}
                  value={siteForm.aboutContent}
                  onChange={(e) =>
                    setSiteForm({ ...siteForm, aboutContent: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Visi</label>
                  <textarea
                    rows={3}
                    value={siteForm.vision}
                    onChange={(e) => setSiteForm({ ...siteForm, vision: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Misi (1 poin per baris)
                  </label>
                  <textarea
                    rows={3}
                    value={missionText}
                    onChange={(e) => setMissionText(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-bold text-slate-900">Filosofi T-O-M-O-Y-O</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {siteForm.philosophy.map((item, idx) => (
                    <div key={idx} className="border border-slate-200 rounded-lg p-3 space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={item.letter}
                          maxLength={2}
                          onChange={(e) => {
                            const next = [...siteForm.philosophy];
                            next[idx] = { ...item, letter: e.target.value };
                            setSiteForm({ ...siteForm, philosophy: next });
                          }}
                          className="w-12 rounded border border-slate-300 px-2 py-1 text-sm font-bold text-center"
                        />
                        <input
                          type="text"
                          value={item.word}
                          onChange={(e) => {
                            const next = [...siteForm.philosophy];
                            next[idx] = { ...item, word: e.target.value };
                            setSiteForm({ ...siteForm, philosophy: next });
                          }}
                          className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm font-semibold"
                        />
                      </div>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => {
                          const next = [...siteForm.philosophy];
                          next[idx] = { ...item, description: e.target.value };
                          setSiteForm({ ...siteForm, philosophy: next });
                        }}
                        className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {mode === 'pengaturan-web' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Domain Canonical
                  </label>
                  <input
                    type="url"
                    required
                    value={siteForm.canonicalDomain}
                    onChange={(e) =>
                      setSiteForm({ ...siteForm, canonicalDomain: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tagline</label>
                  <input
                    type="text"
                    value={siteForm.tagline}
                    onChange={(e) => setSiteForm({ ...siteForm, tagline: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Hero Headline
                  </label>
                  <input
                    type="text"
                    value={siteForm.heroHeadline}
                    onChange={(e) =>
                      setSiteForm({ ...siteForm, heroHeadline: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Hero Subheadline
                  </label>
                  <input
                    type="text"
                    value={siteForm.heroSubheadline}
                    onChange={(e) =>
                      setSiteForm({ ...siteForm, heroSubheadline: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CloudinaryUpload
                  category="site"
                  currentUrl={siteForm.logoUrl}
                  label="Logo / Favicon Website"
                  onUploaded={(url) =>
                    setSiteForm({ ...siteForm, logoUrl: url, faviconUrl: url })
                  }
                />
                <CloudinaryUpload
                  category="site"
                  currentUrl={siteForm.headerImageUrl}
                  label="Gambar Header Beranda"
                  onUploaded={(url) => setSiteForm({ ...siteForm, headerImageUrl: url })}
                />
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-200">
                <p className="text-sm font-bold text-slate-900">
                  Urutan &amp; Visibilitas Bagian Halaman Beranda
                </p>
                <div className="space-y-2">
                  {[...siteForm.homeSections]
                    .sort((a, b) => a.order - b.order)
                    .map((sec, idx) => (
                      <div
                        key={sec.id}
                        className="flex items-center justify-between border border-slate-200 rounded-lg px-3 py-2 text-sm"
                      >
                        <label className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={sec.enabled}
                            onChange={(e) => {
                              const next = siteForm.homeSections.map((s) =>
                                s.id === sec.id ? { ...s, enabled: e.target.checked } : s
                              );
                              setSiteForm({ ...siteForm, homeSections: next });
                            }}
                          />
                          <span className="font-medium">{sec.label}</span>
                        </label>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => moveSection(idx, -1)}
                            aria-label="Naikkan urutan"
                            className="p-1 rounded border border-slate-200 hover:bg-slate-50"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveSection(idx, 1)}
                            aria-label="Turunkan urutan"
                            className="p-1 rounded border border-slate-200 hover:bg-slate-50"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {mode === 'kontak' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nomor WhatsApp Admin
                </label>
                <input
                  type="text"
                  required
                  value={siteForm.whatsappNumber}
                  onChange={(e) =>
                    setSiteForm({ ...siteForm, whatsappNumber: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Link WhatsApp (wa.me)
                </label>
                <input
                  type="url"
                  required
                  value={siteForm.whatsappUrl}
                  onChange={(e) =>
                    setSiteForm({ ...siteForm, whatsappUrl: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email Lembaga
                </label>
                <input
                  type="email"
                  value={siteForm.email}
                  onChange={(e) => setSiteForm({ ...siteForm, email: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Instagram URL
                </label>
                <input
                  type="url"
                  value={siteForm.instagramUrl}
                  onChange={(e) =>
                    setSiteForm({ ...siteForm, instagramUrl: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}
        </form>

        {mode === 'kontak' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Pesan Masuk dari Pengunjung ({contactMessages.length})
            </h3>
            {contactMessages.length === 0 ? (
              <p className="text-sm text-slate-500">Belum ada pesan masuk.</p>
            ) : (
              <div className="space-y-3">
                {contactMessages.map((msg) => (
                  <div key={msg.id} className="border border-slate-200 rounded-lg p-4 text-sm">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900">
                        {msg.name} · <span className="tabular-nums">{msg.whatsapp}</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => void deleteDoc(doc(db, 'contactMessages', msg.id))}
                        className="text-xs text-red-700 font-semibold"
                      >
                        Hapus
                      </button>
                    </div>
                    <p className="mt-1 text-slate-700">{msg.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (mode === 'founder') {
    const saveFounder = async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      setSavedNotice('');
      try {
        const { id: _id, ...rest } = founderForm;
        await setDoc(
          doc(db, 'founder', 'main'),
          sanitizeFirestorePayload({
            ...rest,
            education: founderEduText
              .split('\n')
              .map((l) => l.trim())
              .filter(Boolean)
              .slice(0, 20),
            experience: founderExpText
              .split('\n')
              .map((l) => l.trim())
              .filter(Boolean)
              .slice(0, 20),
            updatedAt: new Date().toISOString(),
          })
        );
        setSavedNotice('Profil Founder berhasil disimpan.');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'founder/main');
      } finally {
        setSaving(false);
      }
    };

    return (
      <form
        onSubmit={saveFounder}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Profil Founder (/founder)</h2>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold"
          >
            {saving ? 'Menyimpan...' : 'Simpan Profil Founder'}
          </button>
        </div>
        {savedNotice && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
            {savedNotice}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama &amp; Gelar</label>
            <input
              type="text"
              required
              value={founderForm.name}
              onChange={(e) => setFounderForm({ ...founderForm, name: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Lahir</label>
            <input
              type="text"
              required
              value={founderForm.birthDate}
              onChange={(e) => setFounderForm({ ...founderForm, birthDate: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <CloudinaryUpload
          category="founder"
          currentUrl={founderForm.photoUrl}
          label="Foto Founder"
          onUploaded={(url) => setFounderForm({ ...founderForm, photoUrl: url })}
        />
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Biografi Founder</label>
          <textarea
            rows={4}
            value={founderForm.bio}
            onChange={(e) => setFounderForm({ ...founderForm, bio: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Riwayat Pendidikan (1 poin per baris)
            </label>
            <textarea
              rows={3}
              value={founderEduText}
              onChange={(e) => setFounderEduText(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Pengalaman (1 poin per baris)
            </label>
            <textarea
              rows={3}
              value={founderExpText}
              onChange={(e) => setFounderExpText(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Visi Pendidikan</label>
          <textarea
            rows={2}
            value={founderForm.vision}
            onChange={(e) => setFounderForm({ ...founderForm, vision: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Pesan Founder</label>
          <textarea
            rows={3}
            value={founderForm.message}
            onChange={(e) => setFounderForm({ ...founderForm, message: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </form>
    );
  }

  if (mode === 'seo') {
    const saveSeo = async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      setSavedNotice('');
      try {
        await setDoc(
          doc(db, 'seoSettings', seoKey),
          sanitizeFirestorePayload({
            pageKey: seoKey,
            title: seoTitle.trim(),
            description: seoDesc.trim(),
            ogImageUrl: seoOgImg.trim(),
            noIndex: false,
            updatedAt: new Date().toISOString(),
          })
        );
        setSavedNotice(`Metadata SEO untuk "${seoKey}" berhasil diperbarui.`);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `seoSettings/${seoKey}`);
      } finally {
        setSaving(false);
      }
    };

    return (
      <form
        onSubmit={saveSeo}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-5"
      >
        <h2 className="text-lg font-bold text-slate-900">Pengaturan SEO &amp; Open Graph</h2>
        {savedNotice && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
            {savedNotice}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Halaman</label>
          <select
            value={seoKey}
            onChange={(e) => setSeoKey(e.target.value)}
            className="w-full sm:w-72 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="default">Beranda / Default</option>
            <option value="tentang">Tentang (/tentang)</option>
            <option value="program">Program (/program)</option>
            <option value="pengajar">Pengajar (/pengajar)</option>
            <option value="founder">Founder (/founder)</option>
            <option value="cabang">Cabang (/cabang)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">SEO Title</label>
          <input
            type="text"
            required
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Meta Description
          </label>
          <textarea
            rows={3}
            required
            value={seoDesc}
            onChange={(e) => setSeoDesc(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <CloudinaryUpload
          category="site"
          currentUrl={seoOgImg}
          label="Open Graph Image"
          onUploaded={setSeoOgImg}
        />
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold"
        >
          {saving ? 'Menyimpan...' : 'Simpan Metadata SEO'}
        </button>
      </form>
    );
  }

  if (mode === 'galeri') {
    const saveGallery = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editGallery?.title || !editGallery?.imageUrl) return;
      setSaving(true);
      try {
        const nowIso = new Date().toISOString();
        const id = editGallery.id || `gal_${Date.now()}`;
        await setDoc(
          doc(db, 'galleries', id),
          sanitizeFirestorePayload({
            title: editGallery.title.trim(),
            description: editGallery.description || '',
            imageUrl: editGallery.imageUrl,
            activityDate: editGallery.activityDate || getTodayIndonesiaISO(),
            category: editGallery.category || 'Kegiatan Belajar',
            order: Number(editGallery.order) || 1,
            status: editGallery.status || 'published',
            createdAt: editGallery.createdAt || nowIso,
            updatedAt: nowIso,
          })
        );
        setEditGallery(null);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'galleries');
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Galeri Kegiatan ({galleries.length})
            </h2>
            <button
              type="button"
              onClick={() =>
                setEditGallery({
                  id: `gal_${Date.now()}`,
                  title: '',
                  description: '',
                  imageUrl: '',
                  activityDate: getTodayIndonesiaISO(),
                  category: 'Kegiatan Belajar',
                  order: galleries.length + 1,
                  status: 'published',
                })
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Foto</span>
            </button>
          </div>
          {galleries.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada foto galeri.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {galleries.map((g) => (
                <div key={g.id} className="border border-slate-200 rounded-lg overflow-hidden">
                  <img src={g.imageUrl} alt={g.title} className="w-full h-36 object-cover" />
                  <div className="p-3 space-y-2">
                    <p className="font-bold text-sm">{g.title}</p>
                    <p className="text-xs text-slate-500">
                      {g.category} · {g.status}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditGallery(g)}
                        className="px-2.5 py-1 rounded border border-slate-300 text-xs font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteDoc(doc(db, 'galleries', g.id))}
                        className="px-2.5 py-1 rounded border border-red-200 text-red-700 text-xs font-semibold"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {editGallery && (
          <form
            onSubmit={saveGallery}
            className="bg-white border border-blue-300 rounded-xl p-6 space-y-4"
          >
            <h3 className="text-lg font-bold text-slate-900">Form Galeri</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Judul *</label>
                <input
                  type="text"
                  required
                  value={editGallery.title || ''}
                  onChange={(e) => setEditGallery({ ...editGallery, title: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
                <input
                  type="text"
                  value={editGallery.category || ''}
                  onChange={(e) => setEditGallery({ ...editGallery, category: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tanggal Kegiatan
                </label>
                <input
                  type="date"
                  value={editGallery.activityDate || ''}
                  onChange={(e) =>
                    setEditGallery({ ...editGallery, activityDate: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={editGallery.status || 'published'}
                  onChange={(e) =>
                    setEditGallery({
                      ...editGallery,
                      status: e.target.value as 'draft' | 'published',
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="published">Publish</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>
            <CloudinaryUpload
              category="gallery"
              currentUrl={editGallery.imageUrl}
              label="Foto Kegiatan *"
              onUploaded={(url) => setEditGallery({ ...editGallery, imageUrl: url })}
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
              <textarea
                rows={2}
                value={editGallery.description || ''}
                onChange={(e) =>
                  setEditGallery({ ...editGallery, description: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold"
              >
                Simpan Galeri
              </button>
              <button
                type="button"
                onClick={() => setEditGallery(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold"
              >
                Batal
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  if (mode === 'testimoni') {
    const saveTestimonial = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editTestimonial?.authorName || !editTestimonial?.content) return;
      setSaving(true);
      try {
        const nowIso = new Date().toISOString();
        const id = editTestimonial.id || `testi_${Date.now()}`;
        await setDoc(
          doc(db, 'testimonials', id),
          sanitizeFirestorePayload({
            authorName: editTestimonial.authorName.trim(),
            authorRole: editTestimonial.authorRole || '',
            photoUrl: editTestimonial.photoUrl || '',
            content: editTestimonial.content.trim(),
            isVisible: editTestimonial.isVisible ?? true,
            order: Number(editTestimonial.order) || 1,
            createdAt: editTestimonial.createdAt || nowIso,
            updatedAt: nowIso,
          })
        );
        setEditTestimonial(null);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'testimonials');
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Testimoni ({testimonials.length})
            </h2>
            <button
              type="button"
              onClick={() =>
                setEditTestimonial({
                  id: `testi_${Date.now()}`,
                  authorName: '',
                  authorRole: 'Orang Tua Siswa',
                  photoUrl: '',
                  content: '',
                  isVisible: true,
                  order: testimonials.length + 1,
                })
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Testimoni</span>
            </button>
          </div>
          {testimonials.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada testimoni.</p>
          ) : (
            <div className="space-y-3">
              {testimonials.map((t) => (
                <div
                  key={t.id}
                  className="border border-slate-200 rounded-lg p-4 flex items-start justify-between gap-4 text-sm"
                >
                  <div>
                    <p className="font-bold">
                      {t.authorName} ({t.authorRole}) · {t.isVisible ? 'Tampil' : 'Tersembunyi'}
                    </p>
                    <p className="text-slate-600 mt-1">"{t.content}"</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditTestimonial(t)}
                      className="px-2.5 py-1 rounded border border-slate-300 text-xs font-semibold"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteDoc(doc(db, 'testimonials', t.id))}
                      className="px-2.5 py-1 rounded border border-red-200 text-red-700 text-xs font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {editTestimonial && (
          <form
            onSubmit={saveTestimonial}
            className="bg-white border border-blue-300 rounded-xl p-6 space-y-4"
          >
            <h3 className="text-lg font-bold text-slate-900">Form Testimoni Asli</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama *</label>
                <input
                  type="text"
                  required
                  value={editTestimonial.authorName || ''}
                  onChange={(e) =>
                    setEditTestimonial({ ...editTestimonial, authorName: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Peran / Keterangan
                </label>
                <input
                  type="text"
                  value={editTestimonial.authorRole || ''}
                  onChange={(e) =>
                    setEditTestimonial({ ...editTestimonial, authorRole: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <CloudinaryUpload
              category="site"
              currentUrl={editTestimonial.photoUrl}
              label="Foto (Opsional)"
              onUploaded={(url) => setEditTestimonial({ ...editTestimonial, photoUrl: url })}
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Isi Testimoni *
              </label>
              <textarea
                rows={3}
                required
                value={editTestimonial.content || ''}
                onChange={(e) =>
                  setEditTestimonial({ ...editTestimonial, content: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editTestimonial.isVisible ?? true}
                onChange={(e) =>
                  setEditTestimonial({ ...editTestimonial, isVisible: e.target.checked })
                }
              />
              <span>Tampilkan di Website Publik</span>
            </label>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold"
              >
                Simpan Testimoni
              </button>
              <button
                type="button"
                onClick={() => setEditTestimonial(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold"
              >
                Batal
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  // mode === 'pengumuman'
  const saveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAnnouncement?.title || !editAnnouncement?.content) return;
    setSaving(true);
    try {
      const nowIso = new Date().toISOString();
      const id = editAnnouncement.id || `ann_${Date.now()}`;
      const existing = announcements.find((a) => a.id === id);
      const newSlug = slugify(editAnnouncement.slug || editAnnouncement.title);
      const prevSlugs = [...(existing?.previousSlugs || editAnnouncement.previousSlugs || [])];
      if (existing && existing.slug && existing.slug !== newSlug && !prevSlugs.includes(existing.slug)) {
        prevSlugs.push(existing.slug);
      }

      await setDoc(
        doc(db, 'announcements', id),
        sanitizeFirestorePayload({
          title: editAnnouncement.title.trim(),
          slug: newSlug,
          previousSlugs: prevSlugs.slice(-20),
          excerpt: editAnnouncement.excerpt || editAnnouncement.content.slice(0, 160),
          content: editAnnouncement.content.trim(),
          imageUrl: editAnnouncement.imageUrl || '',
          publishedAt: editAnnouncement.publishedAt || getTodayIndonesiaISO(),
          status: editAnnouncement.status || 'published',
          seoTitle: editAnnouncement.seoTitle || `${editAnnouncement.title.trim()} – TOMOYO`,
          seoDescription: editAnnouncement.seoDescription || '',
          createdAt: existing?.createdAt || nowIso,
          updatedAt: nowIso,
        })
      );
      setEditAnnouncement(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'announcements');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            Pengumuman ({announcements.length})
          </h2>
          <button
            type="button"
            onClick={() =>
              setEditAnnouncement({
                id: `ann_${Date.now()}`,
                title: '',
                slug: '',
                content: '',
                excerpt: '',
                imageUrl: '',
                publishedAt: getTodayIndonesiaISO(),
                status: 'published',
              })
            }
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Pengumuman</span>
          </button>
        </div>
        {announcements.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada pengumuman.</p>
        ) : (
          <div className="space-y-3">
            {announcements.map((a) => (
              <div
                key={a.id}
                className="border border-slate-200 rounded-lg p-4 flex items-center justify-between gap-4 text-sm"
              >
                <div>
                  <p className="font-bold text-slate-900">{a.title}</p>
                  <p className="text-xs text-slate-500">
                    /pengumuman/{a.slug} · {a.publishedAt} · {a.status}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditAnnouncement(a)}
                    className="px-2.5 py-1 rounded border border-slate-300 text-xs font-semibold"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteDoc(doc(db, 'announcements', a.id))}
                    className="px-2.5 py-1 rounded border border-red-200 text-red-700 text-xs font-semibold"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editAnnouncement && (
        <form
          onSubmit={saveAnnouncement}
          className="bg-white border border-blue-300 rounded-xl p-6 space-y-4"
        >
          <h3 className="text-lg font-bold text-slate-900">Form Pengumuman</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Judul *</label>
              <input
                type="text"
                required
                value={editAnnouncement.title || ''}
                onChange={(e) =>
                  setEditAnnouncement({ ...editAnnouncement, title: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Slug URL</label>
              <input
                type="text"
                value={editAnnouncement.slug || ''}
                onChange={(e) =>
                  setEditAnnouncement({ ...editAnnouncement, slug: e.target.value })
                }
                placeholder="Otomatis dari judul"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tanggal Publikasi
              </label>
              <input
                type="date"
                value={editAnnouncement.publishedAt || ''}
                onChange={(e) =>
                  setEditAnnouncement({ ...editAnnouncement, publishedAt: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                value={editAnnouncement.status || 'published'}
                onChange={(e) =>
                  setEditAnnouncement({
                    ...editAnnouncement,
                    status: e.target.value as 'draft' | 'published',
                  })
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="published">Publish</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
          <CloudinaryUpload
            category="announcement"
            currentUrl={editAnnouncement.imageUrl}
            label="Gambar Pengumuman (Opsional)"
            onUploaded={(url) => setEditAnnouncement({ ...editAnnouncement, imageUrl: url })}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Isi Pengumuman *
            </label>
            <textarea
              rows={5}
              required
              value={editAnnouncement.content || ''}
              onChange={(e) =>
                setEditAnnouncement({ ...editAnnouncement, content: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold"
            >
              Simpan Pengumuman
            </button>
            <button
              type="button"
              onClick={() => setEditAnnouncement(null)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold"
            >
              Batal
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
