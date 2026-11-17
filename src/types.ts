export interface PhilosophyItem {
  letter: string;
  word: string;
  description: string;
}

export interface AdvantageItem {
  title: string;
  description: string;
}

export interface HomeSectionConfig {
  id:
    | 'hero'
    | 'stats'
    | 'about'
    | 'philosophy'
    | 'programs'
    | 'advantages'
    | 'teachers'
    | 'testimonials'
    | 'gallery'
    | 'announcements'
    | 'branches'
    | 'cta';
  label: string;
  enabled: boolean;
  order: number;
}

export interface SiteSettings {
  id: string;
  institutionName: string;
  tagline: string;
  foundedDate: string;
  logoUrl: string;
  faviconUrl: string;
  headerImageUrl: string;
  canonicalDomain: string;
  shortDescription: string;
  aboutTitle: string;
  aboutContent: string;
  vision: string;
  mission: string[];
  brandMeaning: string;
  philosophy: PhilosophyItem[];
  advantages: AdvantageItem[];
  whatsappNumber: string;
  whatsappUrl: string;
  email: string;
  instagramUrl: string;
  facebookUrl: string;
  youtubeUrl: string;
  heroHeadline: string;
  heroSubheadline: string;
  homeSections: HomeSectionConfig[];
  statsOverride?: {
    useRealData: boolean;
    studentsCount?: number;
    teachersCount?: number;
    programsCount?: number;
    branchesCount?: number;
  };
  updatedAt?: string;
}

export interface SeoSetting {
  id: string;
  pageKey: string;
  title: string;
  description: string;
  ogImageUrl: string;
  noIndex?: boolean;
  updatedAt?: string;
}

export interface SitePage {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  body: string;
  status: 'draft' | 'published';
  updatedAt?: string;
}

export interface FounderProfile {
  id: string;
  name: string;
  birthDate: string;
  role: string;
  photoUrl: string;
  bio: string;
  education: string[];
  experience: string[];
  vision: string;
  message: string;
  updatedAt?: string;
}

export interface Teacher {
  id: string;
  name: string;
  slug: string;
  previousSlugs: string[];
  photoUrl: string;
  bio: string;
  education: string;
  experience: string;
  subjects: string[];
  isActive: boolean;
  status: 'draft' | 'published';
  order: number;
  seoTitle: string;
  seoDescription: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Branch {
  id: string;
  name: string;
  slug: string;
  isCenter: boolean;
  photoUrl: string;
  description: string;
  address: string;
  whatsapp: string;
  operatingHours: string;
  mapsUrl: string;
  isActive: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Program {
  id: string;
  name: string;
  slug: string;
  levelLabel: string;
  description: string;
  selectionMode: 'single' | 'multiple';
  status: 'draft' | 'published';
  isActive: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Subject {
  id: string;
  programId: string;
  name: string;
  levelLabel: string;
  description: string;
  isActive: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  activityDate: string;
  category: string;
  order: number;
  status: 'draft' | 'published';
  createdAt?: string;
  updatedAt?: string;
}

export interface Testimonial {
  id: string;
  authorName: string;
  authorRole: string;
  photoUrl: string;
  content: string;
  isVisible: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Announcement {
  id: string;
  title: string;
  slug: string;
  previousSlugs: string[];
  excerpt: string;
  content: string;
  imageUrl: string;
  publishedAt: string;
  status: 'draft' | 'published';
  seoTitle: string;
  seoDescription: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Schedule {
  id: string;
  programId: string;
  programName: string;
  className: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  branchId: string;
  branchName: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ParentProfile {
  id: string;
  uid: string;
  name: string;
  email: string;
  whatsapp: string;
  address: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Student {
  id: string;
  parentUid: string;
  parentName: string;
  fullName: string;
  photoUrl: string;
  photoConsent: boolean;
  birthDate: string;
  gender: 'Laki-laki' | 'Perempuan';
  gradeLevel: string;
  programId: string;
  programNameSnapshot: string;
  subjectIds: string[];
  subjectNamesSnapshot: string[];
  branchId: string;
  branchNameSnapshot: string;
  address: string;
  notes: string;
  registrationStatus: 'pending' | 'approved' | 'rejected';
  isActive: boolean;
  monthlyFee: number;
  billingAnchorDay: number;
  startDate: string;
  adminNotes: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Registration {
  id: string;
  parentUid: string;
  studentId: string;
  parentNameSnapshot: string;
  parentEmailSnapshot: string;
  parentWhatsappSnapshot: string;
  studentNameSnapshot: string;
  gradeLevel: string;
  programId: string;
  programNameSnapshot: string;
  subjectNamesSnapshot: string[];
  branchId: string;
  branchNameSnapshot: string;
  notes: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes: string;
  reviewedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Invoice {
  id: string;
  studentId: string;
  parentUid: string;
  studentNameSnapshot: string;
  parentNameSnapshot: string;
  programNameSnapshot: string;
  branchId: string;
  branchNameSnapshot: string;
  periodYear: number;
  periodMonth: number;
  periodLabel: string;
  amount: number;
  anchorDay: number;
  dueDate: string;
  status: 'unpaid' | 'paid';
  paidAt: string;
  paymentMethod: 'Tunai' | 'Transfer' | '';
  paymentId: string;
  notes: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  studentId: string;
  parentUid: string;
  receiptNumber: string;
  studentNameSnapshot: string;
  parentNameSnapshot: string;
  programNameSnapshot: string;
  branchId: string;
  branchNameSnapshot: string;
  periodLabel: string;
  amountSnapshot: number;
  paymentDate: string;
  paymentMethod: 'Tunai' | 'Transfer';
  notes: string;
  recordedByUid: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  whatsapp: string;
  email: string;
  branchName: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  createdAt?: string;
}
