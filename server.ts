import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const firebaseConfigPath = path.resolve(__dirname, 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf-8')) as {
  projectId: string;
  firestoreDatabaseId: string;
};

const FIREBASE_PROJECT_ID = firebaseConfig.projectId || 'tomoyoeducation-com';
const FIRESTORE_DB_ID = firebaseConfig.firestoreDatabaseId || '(default)';
const ADMIN_UID = 'Ra5KzowVQWPGlX8BH2fiAIwASQn1';
const ADMIN_EMAIL = 'tomoyoeducation.com@gmail.com';
const CANONICAL_DOMAIN = 'https://tomoyoeducation.com';

// --- Google Public Keys Cache for Firebase ID Token Verification ---
let cachedCerts: Record<string, string> = {};
let certsExpiresAt = 0;

async function getFirebasePublicCerts(): Promise<Record<string, string>> {
  const now = Date.now();
  if (now < certsExpiresAt && Object.keys(cachedCerts).length > 0) {
    return cachedCerts;
  }
  const resp = await fetch(
    'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
  );
  if (!resp.ok) {
    throw new Error('Gagal mengambil sertifikat publik Firebase');
  }
  const cacheControl = resp.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  const maxAgeSec = maxAgeMatch ? Number(maxAgeMatch[1]) : 3600;
  cachedCerts = (await resp.json()) as Record<string, string>;
  certsExpiresAt = now + maxAgeSec * 1000;
  return cachedCerts;
}

interface VerifiedFirebaseToken {
  uid: string;
  email: string;
  email_verified: boolean;
  aud: string;
  iss: string;
  exp: number;
  iat: number;
}

async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedFirebaseToken> {
  const parts = idToken.split('.');
  if (parts.length !== 3) {
    throw new Error('Format token tidak valid');
  }
  const [headerB64, payloadB64, sigB64] = parts;
  const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf-8')) as {
    alg?: string;
    kid?: string;
  };
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8')) as {
    aud?: string;
    iss?: string;
    sub?: string;
    user_id?: string;
    email?: string;
    email_verified?: boolean;
    exp?: number;
    iat?: number;
  };

  if (header.alg !== 'RS256' || !header.kid) {
    throw new Error('Algoritma token tidak valid');
  }

  const certs = await getFirebasePublicCerts();
  const cert = certs[header.kid];
  if (!cert) {
    throw new Error('Key ID token tidak ditemukan');
  }

  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(`${headerB64}.${payloadB64}`);
  verifier.end();
  const isValidSig = verifier.verify(cert, Buffer.from(sigB64, 'base64url'));
  if (!isValidSig) {
    throw new Error('Tanda tangan token tidak sah');
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (payload.aud !== FIREBASE_PROJECT_ID) {
    throw new Error('Audience token tidak sesuai');
  }
  if (payload.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`) {
    throw new Error('Issuer token tidak sesuai');
  }
  if (!payload.exp || payload.exp <= nowSec) {
    throw new Error('Token sudah kedaluwarsa');
  }
  if (!payload.sub || typeof payload.sub !== 'string') {
    throw new Error('Subject UID token kosong');
  }

  return {
    uid: payload.sub,
    email: payload.email || '',
    email_verified: payload.email_verified === true,
    aud: payload.aud,
    iss: payload.iss,
    exp: payload.exp,
    iat: payload.iat || 0,
  };
}

interface AuthedRequest extends Request {
  firebaseUser?: VerifiedFirebaseToken;
}

async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token otorisasi tidak ditemukan.' });
    return;
  }
  const token = authHeader.slice(7).trim();
  try {
    req.firebaseUser = await verifyFirebaseIdToken(token);
    next();
  } catch (err) {
    res.status(401).json({
      error: err instanceof Error ? err.message : 'Token otorisasi tidak sah.',
    });
  }
}

function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction): void {
  const user = req.firebaseUser;
  if (
    !user ||
    user.uid !== ADMIN_UID ||
    user.email !== ADMIN_EMAIL ||
    !user.email_verified
  ) {
    res.status(403).json({ error: 'Akses ditolak. Hanya Admin utama yang berwenang.' });
    return;
  }
  next();
}

// --- Firestore Public REST Reader (for Sitemap & SSR SEO Metadata) ---
interface FirestoreRestValue {
  stringValue?: string;
  booleanValue?: boolean;
  integerValue?: string;
  doubleValue?: number;
  arrayValue?: { values?: FirestoreRestValue[] };
  mapValue?: { fields?: Record<string, FirestoreRestValue> };
}

function decodeFirestoreValue(val: FirestoreRestValue | undefined): unknown {
  if (!val) return undefined;
  if (val.stringValue !== undefined) return val.stringValue;
  if (val.booleanValue !== undefined) return val.booleanValue;
  if (val.integerValue !== undefined) return Number(val.integerValue);
  if (val.doubleValue !== undefined) return val.doubleValue;
  if (val.arrayValue) {
    return (val.arrayValue.values || []).map(decodeFirestoreValue);
  }
  if (val.mapValue) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val.mapValue.fields || {})) {
      out[k] = decodeFirestoreValue(v);
    }
    return out;
  }
  return undefined;
}

function decodeFirestoreDoc(docObj: {
  name?: string;
  fields?: Record<string, FirestoreRestValue>;
  updateTime?: string;
}): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (docObj.name) {
    out.id = docObj.name.split('/').pop() || '';
  }
  for (const [k, v] of Object.entries(docObj.fields || {})) {
    out[k] = decodeFirestoreValue(v);
  }
  if (!out.updatedAt && docObj.updateTime) {
    out.updatedAt = docObj.updateTime;
  }
  return out;
}

async function queryPublicCollection(
  collectionId: string,
  filterField?: string,
  filterVal?: string | boolean
): Promise<Record<string, unknown>[]> {
  try {
    const baseUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${FIRESTORE_DB_ID}/documents`;
    if (filterField !== undefined) {
      const structuredQuery: Record<string, unknown> = {
        from: [{ collectionId }],
        where: {
          fieldFilter: {
            field: { fieldPath: filterField },
            op: 'EQUAL',
            value:
              typeof filterVal === 'boolean'
                ? { booleanValue: filterVal }
                : { stringValue: String(filterVal) },
          },
        },
        limit: 200,
      };
      const resp = await fetch(`${baseUrl}:runQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ structuredQuery }),
      });
      if (!resp.ok) return [];
      const rows = (await resp.json()) as Array<{
        document?: { name?: string; fields?: Record<string, FirestoreRestValue>; updateTime?: string };
      }>;
      return rows
        .filter((r) => r.document)
        .map((r) => decodeFirestoreDoc(r.document!));
    }

    const resp = await fetch(`${baseUrl}/${collectionId}?pageSize=100`);
    if (!resp.ok) return [];
    const data = (await resp.json()) as {
      documents?: Array<{
        name?: string;
        fields?: Record<string, FirestoreRestValue>;
        updateTime?: string;
      }>;
    };
    return (data.documents || []).map(decodeFirestoreDoc);
  } catch {
    return [];
  }
}

interface PublicSeoBundle {
  fetchedAt: number;
  settings: Record<string, unknown>;
  seoSettings: Record<string, Record<string, unknown>>;
  teachers: Record<string, unknown>[];
  announcements: Record<string, unknown>[];
  branches: Record<string, unknown>[];
  programs: Record<string, unknown>[];
  founder: Record<string, unknown>;
}

const DEFAULT_TEACHER_SLUGS = [
  { slug: 'alfiyani', name: 'ALFIYANI, S.Pd', education: 'S.Pd' },
  { slug: 'yacob-batipi', name: 'YACOB BATIPI S.Pd., Gr', education: 'S.Pd., Gr' },
  { slug: 'fahmi-huawidi', name: 'FAHMI HUAWIDI S.Pd., Gr', education: 'S.Pd., Gr' },
  { slug: 'arti-iin-parlina', name: 'ARTI IIN PARLINA, S.Pd., Gr', education: 'S.Pd., Gr' },
  { slug: 'haya', name: 'HAYA S.Pd', education: 'S.Pd' },
  { slug: 'restu', name: 'RESTU SE., S.Pd., Gr', education: 'SE., S.Pd., Gr' },
  { slug: 'cipto-maraton', name: 'CIPTO MARATON S.Pi., Gr', education: 'S.Pi., Gr' },
  { slug: 'sofyan-andi', name: 'SOFYAN ANDI S.Si., Gr', education: 'S.Si., Gr' },
];

let seoCache: PublicSeoBundle | null = null;

async function getPublicSeoBundle(): Promise<PublicSeoBundle> {
  const now = Date.now();
  if (seoCache && now - seoCache.fetchedAt < 30000) {
    return seoCache;
  }

  const [settingsList, seoList, teachers, announcements, branches, programs, founderList] =
    await Promise.all([
      queryPublicCollection('settings'),
      queryPublicCollection('seoSettings'),
      queryPublicCollection('teachers', 'status', 'published'),
      queryPublicCollection('announcements', 'status', 'published'),
      queryPublicCollection('branches', 'isActive', true),
      queryPublicCollection('programs', 'status', 'published'),
      queryPublicCollection('founder'),
    ]);

  const settings = settingsList.find((s) => s.id === 'main') || settingsList[0] || {};
  const founder = founderList.find((f) => f.id === 'main') || founderList[0] || {};
  const seoSettings: Record<string, Record<string, unknown>> = {};
  for (const item of seoList) {
    const key = String(item.pageKey || item.id || '');
    if (key) seoSettings[key] = item;
  }

  seoCache = {
    fetchedAt: now,
    settings,
    seoSettings,
    teachers: teachers.length > 0 ? teachers : DEFAULT_TEACHER_SLUGS,
    announcements,
    branches,
    programs,
    founder,
  };
  return seoCache;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildRouteMetaAndJsonLd(
  pathname: string,
  bundle: PublicSeoBundle
): { metaHtml: string; jsonLdHtml: string } {
  const instName =
    String(bundle.settings.institutionName || 'TOMOYO PRIVAT & BIMBEL EDUCATION');
  const domain = String(bundle.settings.canonicalDomain || CANONICAL_DOMAIN).replace(/\/$/, '');
  const defaultOgImg = String(
    bundle.seoSettings.default?.ogImageUrl ||
      bundle.settings.headerImageUrl ||
      `${domain}/assets/aistudio/header_bb02064d.jpg`
  );
  const fullOgImage = defaultOgImg.startsWith('http') ? defaultOgImg : `${domain}${defaultOgImg}`;

  const privatePrefixes = ['/admin', '/akun', '/login', '/register'];
  const isPrivate = privatePrefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  let title = `${instName} – Bimbingan Belajar Indramayu`;
  let description =
    'Tempat tumbuhnya generasi cerdas, mandiri, berprestasi, dan siap meraih masa depan di Indramayu.';
  let canonicalPath = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
  let ogType = 'website';
  let ogImage = fullOgImage;
  const jsonLdObjects: Record<string, unknown>[] = [];

  // Base EducationalOrganization Schema
  jsonLdObjects.push({
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: instName,
    url: domain,
    logo: `${domain}/assets/aistudio/favicon_67ba3fe5.png`,
    description,
    founder: {
      '@type': 'Person',
      name: String(bundle.founder.name || 'JALALUDIN NUROHMAN, S.I.Kom., S.Pd., Gr.'),
    },
  });

  if (canonicalPath === '/tentang') {
    const seo = bundle.seoSettings.tentang;
    title = String(seo?.title || `Tentang Kami – ${instName}`);
    description = String(
      seo?.description ||
        `Mengenal visi, misi, dan filosofi TOMOYO dari ${instName}.`
    );
  } else if (canonicalPath === '/program') {
    const seo = bundle.seoSettings.program;
    title = String(seo?.title || `Program Belajar – ${instName}`);
    description = String(
      seo?.description ||
        'Program belajar CALISTUNG (TK–Kelas 1), Kelas 2–5, dan Persiapan TKA Kelas 6.'
    );
    const activePrograms =
      bundle.programs.length > 0
        ? bundle.programs
        : [
            { name: 'CALISTUNG (TK – Kelas 1)', description: 'Program dasar membaca, menulis, berhitung.' },
            { name: 'Bimbingan Belajar Kelas 2 – Kelas 5', description: 'Bahasa Indonesia, Bahasa Inggris, Matematika, IPAS.' },
            { name: 'Persiapan TKA (Kelas 6)', description: 'Matematika, Bahasa Indonesia, IPAS.' },
          ];
    for (const prog of activePrograms) {
      jsonLdObjects.push({
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: String(prog.name || ''),
        description: String(prog.description || ''),
        provider: {
          '@type': 'EducationalOrganization',
          name: instName,
          sameAs: domain,
        },
      });
    }
  } else if (canonicalPath === '/pengajar') {
    const seo = bundle.seoSettings.pengajar;
    title = String(seo?.title || `Daftar Pengajar – ${instName}`);
    description = String(
      seo?.description || `Daftar tenaga pengajar profesional di ${instName}.`
    );
  } else if (canonicalPath.startsWith('/pengajar/')) {
    const slug = canonicalPath.replace('/pengajar/', '');
    const teacher = bundle.teachers.find((t) => t.slug === slug);
    if (teacher) {
      title = String(teacher.seoTitle || `${teacher.name} – Pengajar ${instName}`);
      description = String(
        teacher.seoDescription ||
          `Profil pengajar ${teacher.name} di ${instName}.`
      );
      ogType = 'profile';
      if (teacher.photoUrl) {
        ogImage = String(teacher.photoUrl);
      }
      jsonLdObjects.push({
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: String(teacher.name || ''),
        jobTitle: 'Pengajar',
        worksFor: {
          '@type': 'EducationalOrganization',
          name: instName,
        },
        url: `${domain}/pengajar/${slug}`,
      });
    }
  } else if (canonicalPath === '/founder') {
    const seo = bundle.seoSettings.founder;
    const founderName = String(
      bundle.founder.name || 'JALALUDIN NUROHMAN, S.I.Kom., S.Pd., Gr.'
    );
    title = String(seo?.title || `Profil Founder – ${founderName}`);
    description = String(
      seo?.description ||
        `Profil ${founderName}, Founder & CEO ${instName}.`
    );
    ogType = 'profile';
    jsonLdObjects.push({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: founderName,
      birthDate: '1992-03-05',
      jobTitle: 'Founder & CEO',
      worksFor: {
        '@type': 'EducationalOrganization',
        name: instName,
      },
      url: `${domain}/founder`,
    });
  } else if (canonicalPath === '/cabang' || canonicalPath.startsWith('/cabang/')) {
    const seo = bundle.seoSettings.cabang;
    if (canonicalPath === '/cabang/indramayu') {
      title = `TOMOYO Indramayu Kota (Pusat) – ${instName}`;
      description = `Informasi lokasi dan peta Google Maps TOMOYO Indramayu Kota (Pusat).`;
    } else if (canonicalPath === '/cabang/terisi') {
      title = `Cabang TOMOYO Kecamatan Terisi Indramayu – ${instName}`;
      description = `Informasi lokasi dan peta Google Maps Cabang TOMOYO Kecamatan Terisi Indramayu.`;
    } else {
      title = String(seo?.title || `Lokasi Cabang – ${instName}`);
      description = String(
        seo?.description ||
          'Lokasi TOMOYO Indramayu Kota (Pusat) dan Cabang Kecamatan Terisi Indramayu.'
      );
    }
  } else if (canonicalPath === '/testimoni') {
    title = `Testimoni Orang Tua & Siswa – ${instName}`;
    description = `Testimoni dan pengalaman belajar bersama ${instName}.`;
  } else if (canonicalPath === '/galeri') {
    title = `Galeri Kegiatan – ${instName}`;
    description = `Dokumentasi kegiatan belajar dan aktivitas siswa di ${instName}.`;
  } else if (canonicalPath === '/pengumuman') {
    title = `Pengumuman Resmi – ${instName}`;
    description = `Informasi dan pengumuman terbaru dari ${instName}.`;
  } else if (canonicalPath.startsWith('/pengumuman/')) {
    const slug = canonicalPath.replace('/pengumuman/', '');
    const ann = bundle.announcements.find((a) => a.slug === slug);
    if (ann) {
      title = String(ann.seoTitle || `${ann.title} – ${instName}`);
      description = String(ann.seoDescription || ann.excerpt || description);
      ogType = 'article';
      if (ann.imageUrl) ogImage = String(ann.imageUrl);
    }
  } else if (canonicalPath === '/jadwal') {
    title = `Jadwal Belajar – ${instName}`;
    description = `Jadwal bimbingan belajar di Indramayu Kota dan Kecamatan Terisi.`;
  } else if (canonicalPath === '/pendaftaran') {
    title = `Pendaftaran Siswa Baru – ${instName}`;
    description = `Formulir pendaftaran siswa baru secara online di ${instName}.`;
  } else if (canonicalPath === '/kontak') {
    title = `Kontak & WhatsApp Resmi – ${instName}`;
    description = `Hubungi admin resmi ${instName} melalui WhatsApp +62 821-1977-0700.`;
  } else if (canonicalPath === '/peta-situs') {
    title = `Peta Situs – ${instName}`;
    description = `Daftar halaman publik yang tersedia di website resmi ${instName}.`;
  } else if (isPrivate) {
    title = `Area Pengguna – ${instName}`;
    description = `Portal akun dan administrasi ${instName}.`;
  }

  // BreadcrumbList JSON-LD for public subpages
  if (!isPrivate && canonicalPath !== '/') {
    const segments = canonicalPath.split('/').filter(Boolean);
    const itemListElement = [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Beranda',
        item: `${domain}/`,
      },
    ];
    let acc = '';
    segments.forEach((seg, idx) => {
      acc += `/${seg}`;
      itemListElement.push({
        '@type': 'ListItem',
        position: idx + 2,
        name: seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        item: `${domain}${acc}`,
      });
    });
    jsonLdObjects.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement,
    });
  }

  const canonicalUrl = `${domain}${canonicalPath}`;
  const robotsTag = isPrivate
    ? '<meta name="robots" content="noindex, nofollow" />'
    : '<meta name="robots" content="index, follow" />';

  const metaHtml = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    robotsTag,
    !isPrivate ? `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />` : '',
    `<meta property="og:type" content="${escapeHtml(ogType)}" />`,
    `<meta property="og:site_name" content="${escapeHtml(instName)}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`,
    `<meta property="og:image" content="${escapeHtml(ogImage)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(ogImage)}" />`,
  ]
    .filter(Boolean)
    .join('\n    ');

  const jsonLdHtml = isPrivate
    ? ''
    : jsonLdObjects
        .map(
          (obj) =>
            `<script type="application/ld+json">${JSON.stringify(obj)}</script>`
        )
        .join('\n    ');

  return { metaHtml, jsonLdHtml };
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  const isProd = process.env.NODE_ENV === 'production';

  // --- Health & Server-Side Auth Verification Endpoints ---
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'tomoyo-education' });
  });

  app.get(
    '/api/admin/verify',
    requireAuth,
    requireAdmin,
    (req: AuthedRequest, res: Response) => {
      res.json({
        authorized: true,
        uid: req.firebaseUser?.uid,
        email: req.firebaseUser?.email,
      });
    }
  );

  // --- Dynamic robots.txt ---
  app.get('/robots.txt', (_req: Request, res: Response) => {
    const content = [
      'User-agent: *',
      'Allow: /',
      'Disallow: /admin',
      'Disallow: /akun',
      'Disallow: /login',
      'Disallow: /register',
      '',
      `Sitemap: ${CANONICAL_DOMAIN}/sitemap.xml`,
    ].join('\n');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(content);
  });

  // --- Dynamic XML Sitemap ---
  app.get('/sitemap.xml', async (_req: Request, res: Response) => {
    const bundle = await getPublicSeoBundle();
    const domain = String(bundle.settings.canonicalDomain || CANONICAL_DOMAIN).replace(
      /\/$/,
      ''
    );

    const staticPublicRoutes = [
      { path: '/', priority: '1.0', changefreq: 'weekly' },
      { path: '/tentang', priority: '0.8', changefreq: 'monthly' },
      { path: '/program', priority: '0.9', changefreq: 'weekly' },
      { path: '/pengajar', priority: '0.8', changefreq: 'weekly' },
      { path: '/founder', priority: '0.8', changefreq: 'monthly' },
      { path: '/cabang', priority: '0.8', changefreq: 'monthly' },
      { path: '/cabang/indramayu', priority: '0.8', changefreq: 'monthly' },
      { path: '/cabang/terisi', priority: '0.8', changefreq: 'monthly' },
      { path: '/jadwal', priority: '0.7', changefreq: 'weekly' },
      { path: '/galeri', priority: '0.7', changefreq: 'weekly' },
      { path: '/testimoni', priority: '0.7', changefreq: 'monthly' },
      { path: '/pengumuman', priority: '0.8', changefreq: 'daily' },
      { path: '/pendaftaran', priority: '0.9', changefreq: 'monthly' },
      { path: '/kontak', priority: '0.8', changefreq: 'monthly' },
      { path: '/peta-situs', priority: '0.5', changefreq: 'weekly' },
    ];

    const urlEntries: Array<{
      loc: string;
      lastmod?: string;
      changefreq: string;
      priority: string;
    }> = [];

    const seen = new Set<string>();
    const addEntry = (
      locPath: string,
      priority: string,
      changefreq: string,
      lastmodRaw?: unknown
    ) => {
      const fullLoc = `${domain}${locPath}`;
      if (seen.has(fullLoc)) return;
      seen.add(fullLoc);
      let lastmod: string | undefined;
      if (typeof lastmodRaw === 'string' && /^\d{4}-\d{2}-\d{2}/.test(lastmodRaw)) {
        lastmod = lastmodRaw.slice(0, 10);
      }
      urlEntries.push({ loc: fullLoc, lastmod, changefreq, priority });
    };

    for (const r of staticPublicRoutes) {
      addEntry(r.path, r.priority, r.changefreq);
    }

    for (const b of bundle.branches) {
      if (b.slug && b.isActive !== false) {
        addEntry(`/cabang/${String(b.slug)}`, '0.8', 'monthly', b.updatedAt);
      }
    }

    for (const t of bundle.teachers) {
      if (t.slug) {
        addEntry(`/pengajar/${String(t.slug)}`, '0.7', 'monthly', t.updatedAt);
      }
    }

    for (const a of bundle.announcements) {
      if (a.slug && a.status === 'published') {
        addEntry(
          `/pengumuman/${String(a.slug)}`,
          '0.7',
          'weekly',
          a.updatedAt || a.publishedAt
        );
      }
    }

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...urlEntries.map((entry) => {
        const lines = [
          '  <url>',
          `    <loc>${escapeXml(entry.loc)}</loc>`,
          ...(entry.lastmod ? [`    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`] : []),
          `    <changefreq>${entry.changefreq}</changefreq>`,
          `    <priority>${entry.priority}</priority>`,
          '  </url>',
        ];
        return lines.join('\n');
      }),
      '</urlset>',
    ].join('\n');

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  });

  // --- Vite / Static Assets Middleware ---
  let vite: Awaited<ReturnType<typeof createViteServer>> | null = null;
  if (!isProd) {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath, { index: false }));
    app.use('/assets', express.static(path.resolve(__dirname, 'public/assets')));
  }

  // --- Dynamic HTML Route Handler (No Hash Routing, Direct Refresh Always 200 OK) ---
  app.use('*', async (req: Request, res: Response, next: NextFunction) => {
    const url = req.originalUrl;
    if (url.startsWith('/api/')) {
      next();
      return;
    }

    try {
      const templatePath = isProd
        ? path.resolve(__dirname, 'dist/index.html')
        : path.resolve(__dirname, 'index.html');
      let html = fs.readFileSync(templatePath, 'utf-8');

      if (!isProd && vite) {
        html = await vite.transformIndexHtml(url, html);
      }

      const bundle = await getPublicSeoBundle();
      const rawPath = (req.originalUrl || '/').split('?')[0] || '/';
      const pathname = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
      const { metaHtml, jsonLdHtml } = buildRouteMetaAndJsonLd(pathname, bundle);

      html = html.replace(
        /<!--SEO_META-->[\s\S]*?<!--\/SEO_META-->/,
        `<!--SEO_META-->\n    ${metaHtml}\n    <!--/SEO_META-->`
      );
      html = html.replace(
        /<!--SEO_JSONLD-->[\s\S]*?<!--\/SEO_JSONLD-->/,
        `<!--SEO_JSONLD-->\n    ${jsonLdHtml}\n    <!--/SEO_JSONLD-->`
      );

      res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8').end(html);
    } catch (err) {
      if (vite && err instanceof Error) {
        vite.ssrFixStacktrace(err);
      }
      next(err);
    }
  });

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`TOMOYO Education Server berjalan di http://localhost:${port}`);
  });
}

void startServer();
