import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  GraduationCap,
  MapPin,
  MessageCircle,
  Users,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { SeoHead } from '../components/SeoHead';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { formatIndonesianDate } from '../lib/billing';

export const HomePage: React.FC = () => {
  const {
    settings,
    seoSettings,
    programs,
    subjects,
    teachers,
    testimonials,
    galleries,
    announcements,
    branches,
    allStudents,
  } = useApp();

  const homeSeo = seoSettings.find((s) => s.pageKey === 'default');
  const activeTeachers = teachers.filter((t) => t.status === 'published' && t.isActive);
  const activePrograms = programs.filter((p) => p.status === 'published' && p.isActive);
  const activeBranches = branches.filter((b) => b.isActive);
  const visibleTestimonials = testimonials.filter((t) => t.isVisible);
  const publishedGallery = galleries.filter((g) => g.status === 'published').slice(0, 6);
  const publishedAnnouncements = announcements
    .filter((a) => a.status === 'published')
    .slice(0, 3);

  const realStudentsCount =
    settings.statsOverride?.studentsCount !== undefined &&
    !settings.statsOverride.useRealData
      ? settings.statsOverride.studentsCount
      : settings.statsOverride?.studentsCount ??
        allStudents.filter((s) => s.isActive && s.registrationStatus === 'approved').length;

  const stats = [
    {
      label: 'Siswa Aktif',
      value: realStudentsCount,
      icon: GraduationCap,
      note: 'Tercatat di sistem',
    },
    {
      label: 'Pengajar',
      value:
        settings.statsOverride?.teachersCount !== undefined &&
        !settings.statsOverride.useRealData
          ? settings.statsOverride.teachersCount
          : activeTeachers.length,
      icon: Users,
      note: 'Tenaga pendidik aktif',
    },
    {
      label: 'Program Belajar',
      value:
        settings.statsOverride?.programsCount !== undefined &&
        !settings.statsOverride.useRealData
          ? settings.statsOverride.programsCount
          : activePrograms.length,
      icon: BookOpen,
      note: 'Kurikulum terstruktur',
    },
    {
      label: 'Lokasi Cabang',
      value:
        settings.statsOverride?.branchesCount !== undefined &&
        !settings.statsOverride.useRealData
          ? settings.statsOverride.branchesCount
          : activeBranches.length,
      icon: Building2,
      note: 'Indramayu Kota & Terisi',
    },
  ];

  const orderedSections = [...(settings.homeSections || [])]
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'hero':
        return (
          <section key="hero" className="bg-slate-50 border-b border-slate-200">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 lg:py-9">
              {settings.headerImageUrl && (
                <div className="mb-6 bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <img
                    src={settings.headerImageUrl}
                    alt={`${settings.institutionName} Header`}
                    className="w-full h-auto max-h-40 sm:max-h-44 object-contain mx-auto bg-white"
                  />
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-8 space-y-5">
                  <p className="text-sm font-semibold text-blue-700 tracking-wide">
                    {settings.institutionName}
                  </p>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                    {settings.heroHeadline}
                  </h1>
                  <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                    {settings.heroSubheadline}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 pt-2">
                    <Link
                      to="/pendaftaran"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 transition-colors"
                    >
                      <span>Daftar Sekarang</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                    <Link
                      to="/kontak"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm font-semibold hover:bg-slate-50 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 text-blue-700" aria-hidden="true" />
                      <span>Hubungi Kami</span>
                    </Link>
                  </div>
                </div>
                <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <h2 className="text-base font-bold text-slate-900">
                    Makna Brand TOMOYO
                  </h2>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    "{settings.brandMeaning}"
                  </p>
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Indramayu Kota &amp; Terisi</span>
                    <Link
                      to="/login"
                      className="font-semibold text-blue-700 hover:underline"
                    >
                      Portal Orang Tua &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );

      case 'stats':
        return (
          <section key="stats" className="bg-white border-b border-slate-200">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {stats.map((st) => {
                  const Icon = st.icon;
                  return (
                    <div
                      key={st.label}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">
                          {st.label}
                        </span>
                        <Icon className="w-4 h-4 text-blue-700" aria-hidden="true" />
                      </div>
                      <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
                        {st.value}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{st.note}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        );

      case 'about':
        return (
          <section key="about" className="py-16 bg-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              <div className="lg:col-span-7 space-y-4">
                <p className="text-sm font-semibold text-blue-700">Tentang Lembaga</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {settings.aboutTitle}
                </h2>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                  {settings.aboutContent}
                </p>
                <div className="pt-2">
                  <Link
                    to="/tentang"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:underline"
                  >
                    <span>Pelajari Visi &amp; Misi Selengkapnya</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
              <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-4">
                <h3 className="text-base font-bold text-slate-900">Visi Pendidikan</h3>
                <p className="text-sm text-slate-700 leading-relaxed">{settings.vision}</p>
                <div className="pt-3 border-t border-slate-200 space-y-2 text-xs text-slate-600">
                  <p>
                    <strong className="text-slate-900">Pendiri:</strong> JALALUDIN NUROHMAN, S.I.Kom., S.Pd., Gr.
                  </p>
                  <p>
                    <strong className="text-slate-900">Tanggal Berdiri:</strong>{' '}
                    {settings.foundedDate ? settings.foundedDate : 'Dikelola melalui Dashboard Admin'}
                  </p>
                </div>
              </div>
            </div>
          </section>
        );

      case 'philosophy':
        return (
          <section key="philosophy" className="py-16 bg-slate-50 border-y border-slate-200">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="max-w-2xl mb-10">
                <p className="text-sm font-semibold text-blue-700">Filosofi Brand</p>
                <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">
                  Nilai Pendidikan TOMOYO
                </h2>
                <p className="mt-2 text-slate-600 text-sm sm:text-base">
                  {settings.brandMeaning}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {settings.philosophy.map((item, idx) => (
                  <div
                    key={`${item.letter}-${idx}`}
                    className="bg-white border border-slate-200 rounded-xl p-6"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="w-10 h-10 rounded-lg bg-amber-300 text-slate-900 font-extrabold text-lg flex items-center justify-center shrink-0">
                        {item.letter}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900">{item.word}</h3>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );

      case 'programs':
        return (
          <section key="programs" className="py-16 bg-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
                <div>
                  <p className="text-sm font-semibold text-blue-700">Kurikulum Terstruktur</p>
                  <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">
                    Program Belajar &amp; Mata Pelajaran
                  </h2>
                </div>
                <Link
                  to="/program"
                  className="text-sm font-semibold text-blue-700 hover:underline whitespace-nowrap"
                >
                  Lihat Detail Program &rarr;
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {activePrograms.map((prog) => {
                  const progSubjects = subjects.filter(
                    (s) => s.programId === prog.id && s.isActive
                  );
                  return (
                    <div
                      key={prog.id}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col justify-between"
                    >
                      <div>
                        <p className="text-xs font-semibold text-blue-700">
                          {prog.levelLabel}
                        </p>
                        <h3 className="mt-1 text-lg font-bold text-slate-900">
                          {prog.name}
                        </h3>
                        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                          {prog.description}
                        </p>
                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <p className="text-xs font-semibold text-slate-700 mb-2">
                            Mata Pelajaran:
                          </p>
                          <ul className="space-y-1.5 text-sm text-slate-700">
                            {progSubjects.map((sub) => (
                              <li key={sub.id} className="flex items-center gap-2">
                                <CheckCircle2
                                  className="w-4 h-4 text-blue-700 shrink-0"
                                  aria-hidden="true"
                                />
                                <span>{sub.name}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                        <span>
                          {prog.selectionMode === 'single'
                            ? 'Pilih 1 paket mapel'
                            : 'Pilih satu / beberapa mapel'}
                        </span>
                        <Link
                          to="/pendaftaran"
                          className="font-semibold text-blue-700 hover:underline"
                        >
                          Daftar &rarr;
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        );

      case 'advantages':
        return (
          <section key="advantages" className="py-16 bg-slate-50 border-y border-slate-200">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="max-w-2xl mb-10">
                <p className="text-sm font-semibold text-blue-700">Mengapa Memilih Kami</p>
                <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">
                  Keunggulan Lembaga
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {settings.advantages.map((adv, idx) => (
                  <div
                    key={adv.title}
                    className="bg-white border border-slate-200 rounded-xl p-6"
                  >
                    <p className="text-xs font-semibold text-blue-700 tabular-nums">
                      0{idx + 1}.
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-slate-900">{adv.title}</h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      {adv.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );

      case 'teachers':
        return (
          <section key="teachers" className="py-16 bg-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
                <div>
                  <p className="text-sm font-semibold text-blue-700">Tenaga Pendidik</p>
                  <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">
                    Daftar Pengajar TOMOYO
                  </h2>
                </div>
                <Link
                  to="/pengajar"
                  className="text-sm font-semibold text-blue-700 hover:underline whitespace-nowrap"
                >
                  Lihat Semua Pengajar &rarr;
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {activeTeachers.map((teacher) => (
                  <Link
                    key={teacher.id}
                    to={`/pengajar/${teacher.slug}`}
                    className="group bg-slate-50 border border-slate-200 rounded-xl overflow-hidden hover:border-blue-300 transition-colors"
                  >
                    <ImageWithFallback
                      src={teacher.photoUrl}
                      alt={teacher.name}
                      fallbackLabel={teacher.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                        {teacher.name}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {teacher.subjects.length > 0
                          ? teacher.subjects.join(' · ')
                          : teacher.education || 'Pengajar TOMOYO'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );

      case 'testimonials':
        return (
          <section key="testimonials" className="py-16 bg-slate-50 border-y border-slate-200">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                  <p className="text-sm font-semibold text-blue-700">Suara Orang Tua &amp; Siswa</p>
                  <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">
                    Testimoni
                  </h2>
                </div>
                <Link
                  to="/testimoni"
                  className="text-sm font-semibold text-blue-700 hover:underline whitespace-nowrap"
                >
                  Halaman Testimoni &rarr;
                </Link>
              </div>
              {visibleTestimonials.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
                  <p className="text-sm text-slate-600">
                    Belum ada testimoni yang dipublikasikan. Testimoni asli dari orang tua dan siswa dapat dikelola langsung melalui Dashboard Admin.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {visibleTestimonials.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
                    >
                      <p className="text-sm text-slate-700 leading-relaxed">
                        "{item.content}"
                      </p>
                      <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                        <ImageWithFallback
                          src={item.photoUrl}
                          alt={item.authorName}
                          className="w-10 h-10 rounded-full object-cover shrink-0"
                        />
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {item.authorName}
                          </p>
                          {item.authorRole && (
                            <p className="text-xs text-slate-500">{item.authorRole}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        );

      case 'gallery':
        return (
          <section key="gallery" className="py-16 bg-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                  <p className="text-sm font-semibold text-blue-700">Dokumentasi</p>
                  <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">
                    Galeri Kegiatan
                  </h2>
                </div>
                <Link
                  to="/galeri"
                  className="text-sm font-semibold text-blue-700 hover:underline whitespace-nowrap"
                >
                  Lihat Galeri Lengkap &rarr;
                </Link>
              </div>
              {publishedGallery.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
                  <p className="text-sm text-slate-600">
                    Belum ada dokumentasi kegiatan yang dipublikasikan. Foto kegiatan dapat diunggah melalui Dashboard Admin.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {publishedGallery.map((g) => (
                    <div
                      key={g.id}
                      className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden"
                    >
                      <ImageWithFallback
                        src={g.imageUrl}
                        alt={g.title}
                        className="w-full h-52 object-cover"
                      />
                      <div className="p-4">
                        <h3 className="text-sm font-bold text-slate-900">{g.title}</h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {[g.category, g.activityDate ? formatIndonesianDate(g.activityDate) : '']
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        );

      case 'announcements':
        return (
          <section key="announcements" className="py-16 bg-slate-50 border-y border-slate-200">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                  <p className="text-sm font-semibold text-blue-700">Berita &amp; Informasi</p>
                  <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">
                    Pengumuman Terbaru
                  </h2>
                </div>
                <Link
                  to="/pengumuman"
                  className="text-sm font-semibold text-blue-700 hover:underline whitespace-nowrap"
                >
                  Semua Pengumuman &rarr;
                </Link>
              </div>
              {publishedAnnouncements.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
                  <p className="text-sm text-slate-600">
                    Belum ada pengumuman terbaru yang dipublikasikan.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {publishedAnnouncements.map((ann) => (
                    <Link
                      key={ann.id}
                      to={`/pengumuman/${ann.slug}`}
                      className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-blue-300 transition-colors"
                    >
                      {ann.imageUrl && (
                        <ImageWithFallback
                          src={ann.imageUrl}
                          alt={ann.title}
                          className="w-full h-44 object-cover"
                        />
                      )}
                      <div className="p-5">
                        <p className="text-xs text-slate-500 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-blue-700" aria-hidden="true" />
                          <span>{formatIndonesianDate(ann.publishedAt)}</span>
                        </p>
                        <h3 className="mt-2 text-base font-bold text-slate-900">
                          {ann.title}
                        </h3>
                        <p className="mt-2 text-sm text-slate-600 line-clamp-3">
                          {ann.excerpt || ann.content}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        );

      case 'branches':
        return (
          <section key="branches" className="py-16 bg-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="max-w-2xl mb-10">
                <p className="text-sm font-semibold text-blue-700">Lokasi Kami</p>
                <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">
                  Dua Cabang di Kabupaten Indramayu
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeBranches.map((branch) => (
                  <div
                    key={branch.id}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <p className="text-xs font-semibold text-blue-700">
                        {branch.isCenter ? 'Pusat' : 'Cabang'}
                      </p>
                      <h3 className="mt-1 text-lg font-bold text-slate-900">
                        {branch.name}
                      </h3>
                      <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                        {branch.description}
                      </p>
                      <div className="mt-4 space-y-1.5 text-sm text-slate-700">
                        <p>
                          <strong className="text-slate-900">Alamat:</strong>{' '}
                          {branch.address || 'Akan dilengkapi melalui Dashboard Admin'}
                        </p>
                        <p>
                          <strong className="text-slate-900">Jam Operasional:</strong>{' '}
                          {branch.operatingHours || 'Akan dilengkapi melalui Dashboard Admin'}
                        </p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-200 flex flex-wrap gap-3">
                      <a
                        href={branch.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 transition-colors"
                      >
                        <MapPin className="w-4 h-4" aria-hidden="true" />
                        <span>Petunjuk Arah Google Maps</span>
                      </a>
                      <Link
                        to={`/cabang/${branch.slug}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
                      >
                        <span>Detail Cabang</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );

      case 'cta':
        return (
          <section key="cta" className="py-16 bg-blue-900 text-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-5">
              <h2 className="text-2xl sm:text-3xl font-extrabold">
                Siap Memulai Pendampingan Belajar Putra-Putri Anda?
              </h2>
              <p className="text-blue-100 text-sm sm:text-base max-w-2xl mx-auto">
                Buat akun orang tua, pilih program belajar yang sesuai dengan jenjang anak, dan pantau perkembangan belajar serta administrasi SPP dalam satu portal terpadu.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <Link
                  to="/pendaftaran"
                  className="px-6 py-3 rounded-lg bg-amber-400 text-slate-900 text-sm font-bold hover:bg-amber-300 transition-colors"
                >
                  Daftar Siswa Baru
                </Link>
                <a
                  href={settings.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 rounded-lg border border-blue-400 text-white text-sm font-semibold hover:bg-blue-800 transition-colors"
                >
                  Konsultasi via WhatsApp
                </a>
              </div>
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <SeoHead
        title={
          homeSeo?.title ||
          `${settings.institutionName} – Bimbingan Belajar Indramayu`
        }
        description={homeSeo?.description || settings.shortDescription}
        path="/"
        ogImage={homeSeo?.ogImageUrl}
      />
      {orderedSections.map((sec) => renderSection(sec.id))}
    </>
  );
};
