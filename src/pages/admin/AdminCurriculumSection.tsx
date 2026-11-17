import React, { useState } from 'react';
import { deleteDoc, doc, setDoc } from 'firebase/firestore';
import { Edit3, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { CloudinaryUpload } from '../../components/CloudinaryUpload';
import { db } from '../../lib/firebase';
import {
  handleFirestoreError,
  OperationType,
  sanitizeFirestorePayload,
} from '../../lib/firestoreErrors';
import { slugify } from '../../lib/validation';
import type { Branch, Program, Schedule, Subject, Teacher } from '../../types';

export const AdminCurriculumSection: React.FC<{
  mode: 'pengajar' | 'program' | 'mapel' | 'jadwal' | 'cabang';
}> = ({ mode }) => {
  const { teachers, programs, subjects, schedules, branches } = useApp();
  const [saving, setSaving] = useState(false);

  // Teacher form
  const [editTeacher, setEditTeacher] = useState<Partial<Teacher> | null>(null);
  const [tSubjectsText, setTSubjectsText] = useState('');

  // Program form
  const [editProgram, setEditProgram] = useState<Partial<Program> | null>(null);

  // Subject form
  const [editSubject, setEditSubject] = useState<Partial<Subject> | null>(null);

  // Schedule form
  const [editSchedule, setEditSchedule] = useState<Partial<Schedule> | null>(null);

  // Branch form
  const [editBranch, setEditBranch] = useState<Partial<Branch> | null>(null);

  if (mode === 'pengajar') {
    const startEditTeacher = (t?: Teacher) => {
      if (t) {
        setEditTeacher({ ...t });
        setTSubjectsText((t.subjects || []).join(', '));
      } else {
        setEditTeacher({
          id: `t_${Date.now()}`,
          name: '',
          slug: '',
          previousSlugs: [],
          photoUrl: '',
          bio: '',
          education: '',
          experience: '',
          subjects: [],
          isActive: true,
          status: 'draft',
          order: teachers.length + 1,
          seoTitle: '',
          seoDescription: '',
        });
        setTSubjectsText('');
      }
    };

    const saveTeacher = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editTeacher?.name) return;
      setSaving(true);
      try {
        const nowIso = new Date().toISOString();
        const id = editTeacher.id || `t_${Date.now()}`;
        const existing = teachers.find((x) => x.id === id);
        const newSlug = slugify(editTeacher.slug || editTeacher.name);
        const prevSlugs = [...(existing?.previousSlugs || editTeacher.previousSlugs || [])];
        if (existing && existing.slug && existing.slug !== newSlug && !prevSlugs.includes(existing.slug)) {
          prevSlugs.push(existing.slug);
        }
        const subArray = tSubjectsText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

        await setDoc(
          doc(db, 'teachers', id),
          sanitizeFirestorePayload({
            name: editTeacher.name.trim(),
            slug: newSlug,
            previousSlugs: prevSlugs.slice(-20),
            photoUrl: editTeacher.photoUrl || '',
            bio: editTeacher.bio || '',
            education: editTeacher.education || '',
            experience: editTeacher.experience || '',
            subjects: subArray.slice(0, 20),
            isActive: editTeacher.isActive ?? true,
            status: editTeacher.status || 'draft',
            order: Number(editTeacher.order) || 1,
            seoTitle: editTeacher.seoTitle || `${editTeacher.name.trim()} – Pengajar TOMOYO`,
            seoDescription: editTeacher.seoDescription || '',
            createdAt: existing?.createdAt || nowIso,
            updatedAt: nowIso,
          })
        );
        setEditTeacher(null);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'teachers');
      } finally {
        setSaving(false);
      }
    };

    const deleteTeacher = async (id: string) => {
      if (!window.confirm('Hapus data pengajar ini?')) return;
      await deleteDoc(doc(db, 'teachers', id));
    };

    return (
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Manajemen Pengajar ({teachers.length})
            </h2>
            <button
              type="button"
              onClick={() => startEditTeacher()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Pengajar</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-3 py-2.5">Urutan</th>
                  <th className="px-3 py-2.5">Nama &amp; Slug</th>
                  <th className="px-3 py-2.5">Pendidikan</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teachers.map((t) => (
                  <tr key={t.id}>
                    <td className="px-3 py-2.5 tabular-nums">{t.order}</td>
                    <td className="px-3 py-2.5">
                      <p className="font-semibold text-slate-900">{t.name}</p>
                      <p className="text-xs text-slate-500">/pengajar/{t.slug}</p>
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">{t.education || '-'}</td>
                    <td className="px-3 py-2.5 text-xs font-semibold">
                      {t.status === 'published' ? 'Publik' : 'Draf'} ·{' '}
                      {t.isActive ? 'Aktif' : 'Nonaktif'}
                    </td>
                    <td className="px-3 py-2.5 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => startEditTeacher(t)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-300 text-xs font-semibold"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteTeacher(t.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-red-200 text-red-700 text-xs font-semibold"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {editTeacher && (
          <form
            onSubmit={saveTeacher}
            className="bg-white border border-blue-300 rounded-xl p-6 space-y-4"
          >
            <h3 className="text-lg font-bold text-slate-900">
              {editTeacher.name ? `Edit Pengajar: ${editTeacher.name}` : 'Tambah Pengajar Baru'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nama Lengkap &amp; Gelar *
                </label>
                <input
                  type="text"
                  required
                  value={editTeacher.name || ''}
                  onChange={(e) => setEditTeacher({ ...editTeacher, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Slug URL (/pengajar/[slug])
                </label>
                <input
                  type="text"
                  value={editTeacher.slug || ''}
                  onChange={(e) => setEditTeacher({ ...editTeacher, slug: e.target.value })}
                  placeholder="Otomatis dari nama jika dikosongkan"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Pendidikan
                </label>
                <input
                  type="text"
                  value={editTeacher.education || ''}
                  onChange={(e) => setEditTeacher({ ...editTeacher, education: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Mata Pelajaran (pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  value={tSubjectsText}
                  onChange={(e) => setTSubjectsText(e.target.value)}
                  placeholder="Contoh: Matematika, IPAS"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Urutan Tampil
                </label>
                <input
                  type="number"
                  value={editTeacher.order ?? 1}
                  onChange={(e) => setEditTeacher({ ...editTeacher, order: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm tabular-nums"
                />
              </div>
              <div className="flex items-end gap-6 pb-2">
                <select
                  value={editTeacher.status || 'draft'}
                  onChange={(e) =>
                    setEditTeacher({
                      ...editTeacher,
                      status: e.target.value as 'draft' | 'published',
                    })
                  }
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="published">Publish</option>
                  <option value="draft">Draft</option>
                </select>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={editTeacher.isActive ?? true}
                    onChange={(e) =>
                      setEditTeacher({ ...editTeacher, isActive: e.target.checked })
                    }
                  />
                  <span>Aktif</span>
                </label>
              </div>
            </div>
            <CloudinaryUpload
              category="teacher"
              currentUrl={editTeacher.photoUrl}
              label="Foto Pengajar"
              onUploaded={(url) => setEditTeacher({ ...editTeacher, photoUrl: url })}
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Biodata</label>
              <textarea
                rows={3}
                value={editTeacher.bio || ''}
                onChange={(e) => setEditTeacher({ ...editTeacher, bio: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Pengalaman</label>
              <textarea
                rows={2}
                value={editTeacher.experience || ''}
                onChange={(e) => setEditTeacher({ ...editTeacher, experience: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">SEO Title</label>
                <input
                  type="text"
                  value={editTeacher.seoTitle || ''}
                  onChange={(e) => setEditTeacher({ ...editTeacher, seoTitle: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  SEO Description
                </label>
                <input
                  type="text"
                  value={editTeacher.seoDescription || ''}
                  onChange={(e) =>
                    setEditTeacher({ ...editTeacher, seoDescription: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800"
              >
                {saving ? 'Menyimpan...' : 'Simpan Pengajar'}
              </button>
              <button
                type="button"
                onClick={() => setEditTeacher(null)}
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

  if (mode === 'program') {
    const saveProgram = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editProgram?.name || !editProgram?.levelLabel) return;
      setSaving(true);
      try {
        const nowIso = new Date().toISOString();
        const id = editProgram.id || `prog_${Date.now()}`;
        await setDoc(
          doc(db, 'programs', id),
          sanitizeFirestorePayload({
            name: editProgram.name.trim(),
            slug: slugify(editProgram.slug || editProgram.name),
            levelLabel: editProgram.levelLabel.trim(),
            description: editProgram.description || '',
            selectionMode: editProgram.selectionMode || 'multiple',
            status: editProgram.status || 'published',
            isActive: editProgram.isActive ?? true,
            order: Number(editProgram.order) || 1,
            createdAt: editProgram.createdAt || nowIso,
            updatedAt: nowIso,
          })
        );
        setEditProgram(null);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'programs');
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Program Belajar ({programs.length})
            </h2>
            <button
              type="button"
              onClick={() =>
                setEditProgram({
                  id: `prog_${Date.now()}`,
                  name: '',
                  slug: '',
                  levelLabel: '',
                  description: '',
                  selectionMode: 'multiple',
                  status: 'published',
                  isActive: true,
                  order: programs.length + 1,
                })
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Program</span>
            </button>
          </div>
          <div className="space-y-3">
            {programs.map((p) => (
              <div
                key={p.id}
                className="border border-slate-200 rounded-lg p-4 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="font-bold text-slate-900">
                    {p.name} ({p.levelLabel})
                  </p>
                  <p className="text-xs text-slate-500">
                    Mode: {p.selectionMode === 'single' ? 'Pilih 1 Mapel' : 'Multi Mapel'} ·{' '}
                    {p.status} · {p.isActive ? 'Aktif' : 'Nonaktif'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditProgram(p)}
                    className="px-3 py-1.5 rounded border border-slate-300 text-xs font-semibold"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Hapus program ini?')) {
                        void deleteDoc(doc(db, 'programs', p.id));
                      }
                    }}
                    className="px-3 py-1.5 rounded border border-red-200 text-red-700 text-xs font-semibold"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {editProgram && (
          <form
            onSubmit={saveProgram}
            className="bg-white border border-blue-300 rounded-xl p-6 space-y-4"
          >
            <h3 className="text-lg font-bold text-slate-900">Form Program Belajar</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nama Program *
                </label>
                <input
                  type="text"
                  required
                  value={editProgram.name || ''}
                  onChange={(e) => setEditProgram({ ...editProgram, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Jenjang Kelas *
                </label>
                <input
                  type="text"
                  required
                  value={editProgram.levelLabel || ''}
                  onChange={(e) =>
                    setEditProgram({ ...editProgram, levelLabel: e.target.value })
                  }
                  placeholder="Contoh: TK – Kelas 1"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Aturan Pilih Mapel
                </label>
                <select
                  value={editProgram.selectionMode || 'multiple'}
                  onChange={(e) =>
                    setEditProgram({
                      ...editProgram,
                      selectionMode: e.target.value as 'single' | 'multiple',
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="single">Pilih 1 Mata Pelajaran</option>
                  <option value="multiple">Boleh Beberapa Mata Pelajaran</option>
                </select>
              </div>
              <div className="flex items-end gap-4 pb-2">
                <select
                  value={editProgram.status || 'published'}
                  onChange={(e) =>
                    setEditProgram({
                      ...editProgram,
                      status: e.target.value as 'draft' | 'published',
                    })
                  }
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="published">Publish</option>
                  <option value="draft">Draft</option>
                </select>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editProgram.isActive ?? true}
                    onChange={(e) =>
                      setEditProgram({ ...editProgram, isActive: e.target.checked })
                    }
                  />
                  <span>Aktif</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
              <textarea
                rows={3}
                value={editProgram.description || ''}
                onChange={(e) =>
                  setEditProgram({ ...editProgram, description: e.target.value })
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
                {saving ? 'Menyimpan...' : 'Simpan Program'}
              </button>
              <button
                type="button"
                onClick={() => setEditProgram(null)}
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

  if (mode === 'mapel') {
    const saveSubject = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editSubject?.name || !editSubject?.programId) return;
      setSaving(true);
      try {
        const nowIso = new Date().toISOString();
        const id = editSubject.id || `sub_${Date.now()}`;
        const prog = programs.find((p) => p.id === editSubject.programId);
        await setDoc(
          doc(db, 'subjects', id),
          sanitizeFirestorePayload({
            programId: editSubject.programId,
            name: editSubject.name.trim(),
            levelLabel: editSubject.levelLabel || prog?.levelLabel || '',
            description: editSubject.description || '',
            isActive: editSubject.isActive ?? true,
            order: Number(editSubject.order) || 1,
            createdAt: editSubject.createdAt || nowIso,
            updatedAt: nowIso,
          })
        );
        setEditSubject(null);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'subjects');
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Mata Pelajaran ({subjects.length})
            </h2>
            <button
              type="button"
              onClick={() =>
                setEditSubject({
                  id: `sub_${Date.now()}`,
                  programId: programs[0]?.id || '',
                  name: '',
                  description: '',
                  isActive: true,
                  order: subjects.length + 1,
                })
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Mapel</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-3 py-2.5">Mata Pelajaran</th>
                  <th className="px-3 py-2.5">Program Terkait</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjects.map((sub) => {
                  const prog = programs.find((p) => p.id === sub.programId);
                  return (
                    <tr key={sub.id}>
                      <td className="px-3 py-2.5 font-semibold">{sub.name}</td>
                      <td className="px-3 py-2.5 text-slate-600">
                        {prog?.name || sub.levelLabel}
                      </td>
                      <td className="px-3 py-2.5 text-xs font-semibold">
                        {sub.isActive ? 'Aktif' : 'Nonaktif'}
                      </td>
                      <td className="px-3 py-2.5 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => setEditSubject(sub)}
                          className="px-2.5 py-1 rounded border border-slate-300 text-xs font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Hapus mata pelajaran ini?')) {
                              void deleteDoc(doc(db, 'subjects', sub.id));
                            }
                          }}
                          className="px-2.5 py-1 rounded border border-red-200 text-red-700 text-xs font-semibold"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {editSubject && (
          <form
            onSubmit={saveSubject}
            className="bg-white border border-blue-300 rounded-xl p-6 space-y-4"
          >
            <h3 className="text-lg font-bold text-slate-900">Form Mata Pelajaran</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Program Belajar *
                </label>
                <select
                  required
                  value={editSubject.programId || ''}
                  onChange={(e) =>
                    setEditSubject({ ...editSubject, programId: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.levelLabel})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nama Mata Pelajaran *
                </label>
                <input
                  type="text"
                  required
                  value={editSubject.name || ''}
                  onChange={(e) => setEditSubject({ ...editSubject, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Urutan
                </label>
                <input
                  type="number"
                  value={editSubject.order ?? 1}
                  onChange={(e) =>
                    setEditSubject({ ...editSubject, order: Number(e.target.value) })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editSubject.isActive ?? true}
                    onChange={(e) =>
                      setEditSubject({ ...editSubject, isActive: e.target.checked })
                    }
                  />
                  <span>Mata Pelajaran Aktif</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold"
              >
                {saving ? 'Menyimpan...' : 'Simpan Mapel'}
              </button>
              <button
                type="button"
                onClick={() => setEditSubject(null)}
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

  if (mode === 'jadwal') {
    const saveSchedule = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editSchedule?.programId || !editSchedule?.branchId || !editSchedule?.className) return;
      setSaving(true);
      try {
        const nowIso = new Date().toISOString();
        const id = editSchedule.id || `sch_${Date.now()}`;
        const prog = programs.find((p) => p.id === editSchedule.programId);
        const br = branches.find((b) => b.id === editSchedule.branchId);
        const tch = teachers.find((t) => t.id === editSchedule.teacherId);
        await setDoc(
          doc(db, 'schedules', id),
          sanitizeFirestorePayload({
            programId: editSchedule.programId,
            programName: prog?.name || '',
            className: editSchedule.className.trim(),
            subjectName: editSchedule.subjectName || '',
            teacherId: editSchedule.teacherId || '',
            teacherName: tch?.name || editSchedule.teacherName || '',
            dayOfWeek: editSchedule.dayOfWeek || 'Senin',
            startTime: editSchedule.startTime || '15:30',
            endTime: editSchedule.endTime || '17:00',
            branchId: editSchedule.branchId,
            branchName: br?.name || '',
            isActive: editSchedule.isActive ?? true,
            createdAt: editSchedule.createdAt || nowIso,
            updatedAt: nowIso,
          })
        );
        setEditSchedule(null);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'schedules');
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Jadwal Belajar ({schedules.length})
            </h2>
            <button
              type="button"
              onClick={() =>
                setEditSchedule({
                  id: `sch_${Date.now()}`,
                  programId: programs[0]?.id || '',
                  branchId: branches[0]?.id || '',
                  teacherId: teachers[0]?.id || '',
                  className: '',
                  subjectName: '',
                  dayOfWeek: 'Senin',
                  startTime: '15:30',
                  endTime: '17:00',
                  isActive: true,
                })
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Jadwal</span>
            </button>
          </div>
          {schedules.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada jadwal belajar.</p>
          ) : (
            <div className="space-y-2.5">
              {schedules.map((s) => (
                <div
                  key={s.id}
                  className="border border-slate-200 rounded-lg p-3.5 flex items-center justify-between gap-4 text-sm"
                >
                  <div>
                    <p className="font-bold">
                      {s.dayOfWeek} ({s.startTime}–{s.endTime}) · {s.programName} — {s.className}
                    </p>
                    <p className="text-xs text-slate-500">
                      {s.subjectName} · Pengajar: {s.teacherName || '-'} · {s.branchName}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditSchedule(s)}
                      className="px-2.5 py-1 rounded border border-slate-300 text-xs font-semibold"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteDoc(doc(db, 'schedules', s.id))}
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

        {editSchedule && (
          <form
            onSubmit={saveSchedule}
            className="bg-white border border-blue-300 rounded-xl p-6 space-y-4"
          >
            <h3 className="text-lg font-bold text-slate-900">Form Jadwal Belajar</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Program</label>
                <select
                  value={editSchedule.programId || ''}
                  onChange={(e) =>
                    setEditSchedule({ ...editSchedule, programId: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cabang</label>
                <select
                  value={editSchedule.branchId || ''}
                  onChange={(e) =>
                    setEditSchedule({ ...editSchedule, branchId: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pengajar</label>
                <select
                  value={editSchedule.teacherId || ''}
                  onChange={(e) =>
                    setEditSchedule({ ...editSchedule, teacherId: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">-- Pilih Pengajar --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kelas *</label>
                <input
                  type="text"
                  required
                  value={editSchedule.className || ''}
                  onChange={(e) =>
                    setEditSchedule({ ...editSchedule, className: e.target.value })
                  }
                  placeholder="Contoh: Kelas 4 SD / Reguler A"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Mata Pelajaran
                </label>
                <input
                  type="text"
                  value={editSchedule.subjectName || ''}
                  onChange={(e) =>
                    setEditSchedule({ ...editSchedule, subjectName: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Hari</label>
                <select
                  value={editSchedule.dayOfWeek || 'Senin'}
                  onChange={(e) =>
                    setEditSchedule({ ...editSchedule, dayOfWeek: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Jam Mulai</label>
                <input
                  type="time"
                  value={editSchedule.startTime || '15:30'}
                  onChange={(e) =>
                    setEditSchedule({ ...editSchedule, startTime: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Jam Selesai</label>
                <input
                  type="time"
                  value={editSchedule.endTime || '17:00'}
                  onChange={(e) =>
                    setEditSchedule({ ...editSchedule, endTime: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editSchedule.isActive ?? true}
                    onChange={(e) =>
                      setEditSchedule({ ...editSchedule, isActive: e.target.checked })
                    }
                  />
                  <span>Aktif</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold"
              >
                {saving ? 'Menyimpan...' : 'Simpan Jadwal'}
              </button>
              <button
                type="button"
                onClick={() => setEditSchedule(null)}
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

  // mode === 'cabang'
  const saveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBranch?.name || !editBranch?.mapsUrl) return;
    setSaving(true);
    try {
      const nowIso = new Date().toISOString();
      const id = editBranch.id || slugify(editBranch.name);
      await setDoc(
        doc(db, 'branches', id),
        sanitizeFirestorePayload({
          name: editBranch.name.trim(),
          slug: slugify(editBranch.slug || id),
          isCenter: Boolean(editBranch.isCenter),
          photoUrl: editBranch.photoUrl || '',
          description: editBranch.description || '',
          address: editBranch.address || '',
          whatsapp: editBranch.whatsapp || '',
          operatingHours: editBranch.operatingHours || '',
          mapsUrl: editBranch.mapsUrl.trim(),
          isActive: editBranch.isActive ?? true,
          order: Number(editBranch.order) || 1,
          createdAt: editBranch.createdAt || nowIso,
          updatedAt: nowIso,
        })
      );
      setEditBranch(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'branches');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            Manajemen Cabang ({branches.length})
          </h2>
          <button
            type="button"
            onClick={() =>
              setEditBranch({
                id: `br_${Date.now()}`,
                name: '',
                slug: '',
                isCenter: false,
                mapsUrl: '',
                isActive: true,
                order: branches.length + 1,
              })
            }
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Cabang</span>
          </button>
        </div>
        <div className="space-y-3">
          {branches.map((b) => (
            <div
              key={b.id}
              className="border border-slate-200 rounded-lg p-4 flex items-center justify-between gap-4"
            >
              <div>
                <p className="font-bold text-slate-900">{b.name}</p>
                <p className="text-xs text-slate-500">
                  /cabang/{b.slug} · {b.isActive ? 'Aktif' : 'Nonaktif'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditBranch(b)}
                  className="px-3 py-1.5 rounded border border-slate-300 text-xs font-semibold"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Hapus cabang ini?')) {
                      void deleteDoc(doc(db, 'branches', b.id));
                    }
                  }}
                  className="px-3 py-1.5 rounded border border-red-200 text-red-700 text-xs font-semibold"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editBranch && (
        <form
          onSubmit={saveBranch}
          className="bg-white border border-blue-300 rounded-xl p-6 space-y-4"
        >
          <h3 className="text-lg font-bold text-slate-900">Form Cabang</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Cabang *</label>
              <input
                type="text"
                required
                value={editBranch.name || ''}
                onChange={(e) => setEditBranch({ ...editBranch, name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Slug URL</label>
              <input
                type="text"
                value={editBranch.slug || ''}
                onChange={(e) => setEditBranch({ ...editBranch, slug: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Link Google Maps *
              </label>
              <input
                type="url"
                required
                value={editBranch.mapsUrl || ''}
                onChange={(e) => setEditBranch({ ...editBranch, mapsUrl: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp</label>
              <input
                type="text"
                value={editBranch.whatsapp || ''}
                onChange={(e) => setEditBranch({ ...editBranch, whatsapp: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Alamat Lengkap
              </label>
              <input
                type="text"
                value={editBranch.address || ''}
                onChange={(e) => setEditBranch({ ...editBranch, address: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Jam Operasional
              </label>
              <input
                type="text"
                value={editBranch.operatingHours || ''}
                onChange={(e) =>
                  setEditBranch({ ...editBranch, operatingHours: e.target.value })
                }
                placeholder="Contoh: Senin – Sabtu, 09.00 – 20.00 WIB"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <CloudinaryUpload
            category="branch"
            currentUrl={editBranch.photoUrl}
            label="Foto Cabang (Opsional)"
            onUploaded={(url) => setEditBranch({ ...editBranch, photoUrl: url })}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
            <textarea
              rows={2}
              value={editBranch.description || ''}
              onChange={(e) => setEditBranch({ ...editBranch, description: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editBranch.isCenter ?? false}
                onChange={(e) => setEditBranch({ ...editBranch, isCenter: e.target.checked })}
              />
              <span>Kantor Pusat</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editBranch.isActive ?? true}
                onChange={(e) => setEditBranch({ ...editBranch, isActive: e.target.checked })}
              />
              <span>Cabang Aktif</span>
            </label>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold"
            >
              {saving ? 'Menyimpan...' : 'Simpan Cabang'}
            </button>
            <button
              type="button"
              onClick={() => setEditBranch(null)}
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
