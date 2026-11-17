import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { handleFirestoreError, OperationType, sanitizeFirestorePayload } from '../lib/firestoreErrors';
import {
  ADMIN_EMAIL,
  ADMIN_UID,
  DEFAULT_FOUNDER,
  DEFAULT_SEO_SETTINGS,
  DEFAULT_SITE_SETTINGS,
  INITIAL_BRANCHES,
  INITIAL_PROGRAMS,
  INITIAL_SUBJECTS,
  INITIAL_TEACHERS,
} from '../data/initialData';
import type {
  Announcement,
  Branch,
  ContactMessage,
  FounderProfile,
  GalleryItem,
  Invoice,
  ParentProfile,
  Payment,
  Program,
  Registration,
  Schedule,
  SeoSetting,
  SitePage,
  SiteSettings,
  Student,
  Subject,
  Teacher,
  Testimonial,
} from '../types';

interface AppContextValue {
  user: User | null;
  authReady: boolean;
  isAdmin: boolean;
  serverVerifiedAdmin: boolean;
  adminVerifyLoading: boolean;
  isVerifiedUser: boolean;
  // Public / CMS data
  settings: SiteSettings;
  seoSettings: SeoSetting[];
  sitePages: SitePage[];
  founder: FounderProfile;
  teachers: Teacher[];
  branches: Branch[];
  programs: Program[];
  subjects: Subject[];
  galleries: GalleryItem[];
  testimonials: Testimonial[];
  announcements: Announcement[];
  schedules: Schedule[];
  // Parent data
  parentProfile: ParentProfile | null;
  myStudents: Student[];
  myRegistrations: Registration[];
  myInvoices: Invoice[];
  myPayments: Payment[];
  // Admin data
  allParents: ParentProfile[];
  allStudents: Student[];
  allRegistrations: Registration[];
  allInvoices: Invoice[];
  allPayments: Payment[];
  contactMessages: ContactMessage[];
  firestoreSeeded: boolean;
  seedingInProgress: boolean;
  seedInitialDataToFirestore: () => Promise<void>;
  // Auth methods
  loginWithEmail: (email: string, password: string) => Promise<User>;
  registerWithEmail: (email: string, password: string) => Promise<User>;
  loginWithGoogle: () => Promise<User | null>;
  resendVerification: () => Promise<void>;
  refreshAuthUser: () => Promise<User | null>;
  sendResetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp harus digunakan di dalam AppProvider');
  }
  return ctx;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [serverVerifiedAdmin, setServerVerifiedAdmin] = useState(false);
  const [adminVerifyLoading, setAdminVerifyLoading] = useState(false);

  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [seoSettings, setSeoSettings] = useState<SeoSetting[]>(DEFAULT_SEO_SETTINGS);
  const [sitePages, setSitePages] = useState<SitePage[]>([]);
  const [founder, setFounder] = useState<FounderProfile>(DEFAULT_FOUNDER);
  const [teachers, setTeachers] = useState<Teacher[]>(INITIAL_TEACHERS);
  const [branches, setBranches] = useState<Branch[]>(INITIAL_BRANCHES);
  const [programs, setPrograms] = useState<Program[]>(INITIAL_PROGRAMS);
  const [subjects, setSubjects] = useState<Subject[]>(INITIAL_SUBJECTS);
  const [galleries, setGalleries] = useState<GalleryItem[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const [parentProfile, setParentProfile] = useState<ParentProfile | null>(null);
  const [myStudents, setMyStudents] = useState<Student[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<Registration[]>([]);
  const [myInvoices, setMyInvoices] = useState<Invoice[]>([]);
  const [myPayments, setMyPayments] = useState<Payment[]>([]);

  const [allParents, setAllParents] = useState<ParentProfile[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [allRegistrations, setAllRegistrations] = useState<Registration[]>([]);
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);

  const [firestoreSeeded, setFirestoreSeeded] = useState(true);
  const [seedingInProgress, setSeedingInProgress] = useState(false);

  const isAdmin = Boolean(
    user &&
      user.uid === ADMIN_UID &&
      user.email === ADMIN_EMAIL &&
      user.emailVerified === true
  );

  const isVerifiedUser = Boolean(user && user.emailVerified === true);

  // Handle Google redirect result on initial mount (Android fallback)
  useEffect(() => {
    void getRedirectResult(auth).catch((err) => {
      console.error('Redirect login error:', err);
    });
  }, []);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Server-side admin token verification
  useEffect(() => {
    let cancelled = false;
    async function verifyAdminOnServer() {
      if (!isAdmin || !user) {
        setServerVerifiedAdmin(false);
        return;
      }
      setAdminVerifyLoading(true);
      try {
        const token = await user.getIdToken();
        const resp = await fetch('/api/admin/verify', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!cancelled) {
          setServerVerifiedAdmin(resp.ok);
        }
      } catch {
        if (!cancelled) {
          setServerVerifiedAdmin(false);
        }
      } finally {
        if (!cancelled) {
          setAdminVerifyLoading(false);
        }
      }
    }
    void verifyAdminOnServer();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, user]);

  // Seed initial canonical data to Firestore (Admin only)
  const seedInitialDataToFirestore = useCallback(async () => {
    if (!isAdmin) return;
    setSeedingInProgress(true);
    try {
      const nowIso = new Date().toISOString();
      const batch = writeBatch(db);

      const settingsSnap = await getDoc(doc(db, 'settings', 'main'));
      if (!settingsSnap.exists()) {
        const { id: _id, ...settingsData } = DEFAULT_SITE_SETTINGS;
        batch.set(
          doc(db, 'settings', 'main'),
          sanitizeFirestorePayload({ ...settingsData, updatedAt: nowIso })
        );
      }

      const founderSnap = await getDoc(doc(db, 'founder', 'main'));
      if (!founderSnap.exists()) {
        const { id: _fid, ...founderData } = DEFAULT_FOUNDER;
        batch.set(
          doc(db, 'founder', 'main'),
          sanitizeFirestorePayload({ ...founderData, updatedAt: nowIso })
        );
      }

      for (const seo of DEFAULT_SEO_SETTINGS) {
        const ref = doc(db, 'seoSettings', seo.id);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          const { id: _sid, ...seoData } = seo;
          batch.set(ref, sanitizeFirestorePayload({ ...seoData, updatedAt: nowIso }));
        }
      }

      for (const branch of INITIAL_BRANCHES) {
        const ref = doc(db, 'branches', branch.id);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          const { id: _bid, ...bData } = branch;
          batch.set(
            ref,
            sanitizeFirestorePayload({ ...bData, createdAt: nowIso, updatedAt: nowIso })
          );
        }
      }

      for (const program of INITIAL_PROGRAMS) {
        const ref = doc(db, 'programs', program.id);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          const { id: _pid, ...pData } = program;
          batch.set(
            ref,
            sanitizeFirestorePayload({ ...pData, createdAt: nowIso, updatedAt: nowIso })
          );
        }
      }

      for (const subject of INITIAL_SUBJECTS) {
        const ref = doc(db, 'subjects', subject.id);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          const { id: _subId, ...sData } = subject;
          batch.set(
            ref,
            sanitizeFirestorePayload({ ...sData, createdAt: nowIso, updatedAt: nowIso })
          );
        }
      }

      for (const teacher of INITIAL_TEACHERS) {
        const ref = doc(db, 'teachers', teacher.id);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          const { id: _tid, ...tData } = teacher;
          batch.set(
            ref,
            sanitizeFirestorePayload({ ...tData, createdAt: nowIso, updatedAt: nowIso })
          );
        }
      }

      await batch.commit();
      setFirestoreSeeded(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'seed-initial');
    } finally {
      setSeedingInProgress(false);
    }
  }, [isAdmin]);

  // Public & CMS real-time listeners
  useEffect(() => {
    if (!authReady) return;
    const unsubs: Array<() => void> = [];

    unsubs.push(
      onSnapshot(
        doc(db, 'settings', 'main'),
        (snap) => {
          if (snap.exists()) {
            setSettings({
              ...DEFAULT_SITE_SETTINGS,
              ...(snap.data() as Omit<SiteSettings, 'id'>),
              id: snap.id,
            });
            setFirestoreSeeded(true);
          } else {
            setFirestoreSeeded(false);
          }
        },
        (err) => {
          console.warn('Settings snapshot fallback:', err.message);
        }
      )
    );

    unsubs.push(
      onSnapshot(
        doc(db, 'founder', 'main'),
        (snap) => {
          if (snap.exists()) {
            setFounder({
              ...DEFAULT_FOUNDER,
              ...(snap.data() as Omit<FounderProfile, 'id'>),
              id: snap.id,
            });
          }
        },
        (err) => console.warn('Founder snapshot:', err.message)
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'seoSettings'),
        (snap) => {
          if (!snap.empty) {
            setSeoSettings(
              snap.docs.map((d) => ({ ...(d.data() as Omit<SeoSetting, 'id'>), id: d.id }))
            );
          }
        },
        (err) => console.warn('SEO settings snapshot:', err.message)
      )
    );

    const pagesRef = isAdmin
      ? collection(db, 'sitePages')
      : query(collection(db, 'sitePages'), where('status', '==', 'published'));
    unsubs.push(
      onSnapshot(
        pagesRef,
        (snap) => {
          setSitePages(
            snap.docs.map((d) => ({ ...(d.data() as Omit<SitePage, 'id'>), id: d.id }))
          );
        },
        (err) => console.warn('SitePages snapshot:', err.message)
      )
    );

    const teachersRef = isAdmin
      ? collection(db, 'teachers')
      : query(collection(db, 'teachers'), where('status', '==', 'published'));
    unsubs.push(
      onSnapshot(
        teachersRef,
        (snap) => {
          if (!snap.empty) {
            const list = snap.docs
              .map((d) => ({ ...(d.data() as Omit<Teacher, 'id'>), id: d.id }))
              .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
            setTeachers(list);
          } else if (isAdmin) {
            setTeachers([]);
          }
        },
        (err) => console.warn('Teachers snapshot:', err.message)
      )
    );

    const branchesRef = isAdmin
      ? collection(db, 'branches')
      : query(collection(db, 'branches'), where('isActive', '==', true));
    unsubs.push(
      onSnapshot(
        branchesRef,
        (snap) => {
          if (!snap.empty) {
            const list = snap.docs
              .map((d) => ({ ...(d.data() as Omit<Branch, 'id'>), id: d.id }))
              .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
            setBranches(list);
          } else if (isAdmin) {
            setBranches([]);
          }
        },
        (err) => console.warn('Branches snapshot:', err.message)
      )
    );

    const programsRef = isAdmin
      ? collection(db, 'programs')
      : query(collection(db, 'programs'), where('status', '==', 'published'));
    unsubs.push(
      onSnapshot(
        programsRef,
        (snap) => {
          if (!snap.empty) {
            const list = snap.docs
              .map((d) => ({ ...(d.data() as Omit<Program, 'id'>), id: d.id }))
              .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
            setPrograms(list);
          } else if (isAdmin) {
            setPrograms([]);
          }
        },
        (err) => console.warn('Programs snapshot:', err.message)
      )
    );

    const subjectsRef = isAdmin
      ? collection(db, 'subjects')
      : query(collection(db, 'subjects'), where('isActive', '==', true));
    unsubs.push(
      onSnapshot(
        subjectsRef,
        (snap) => {
          if (!snap.empty) {
            const list = snap.docs
              .map((d) => ({ ...(d.data() as Omit<Subject, 'id'>), id: d.id }))
              .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
            setSubjects(list);
          } else if (isAdmin) {
            setSubjects([]);
          }
        },
        (err) => console.warn('Subjects snapshot:', err.message)
      )
    );

    const galleryRef = isAdmin
      ? collection(db, 'galleries')
      : query(collection(db, 'galleries'), where('status', '==', 'published'));
    unsubs.push(
      onSnapshot(
        galleryRef,
        (snap) => {
          setGalleries(
            snap.docs
              .map((d) => ({ ...(d.data() as Omit<GalleryItem, 'id'>), id: d.id }))
              .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
          );
        },
        (err) => console.warn('Galleries snapshot:', err.message)
      )
    );

    const testimonialRef = isAdmin
      ? collection(db, 'testimonials')
      : query(collection(db, 'testimonials'), where('isVisible', '==', true));
    unsubs.push(
      onSnapshot(
        testimonialRef,
        (snap) => {
          setTestimonials(
            snap.docs
              .map((d) => ({ ...(d.data() as Omit<Testimonial, 'id'>), id: d.id }))
              .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
          );
        },
        (err) => console.warn('Testimonials snapshot:', err.message)
      )
    );

    const annRef = isAdmin
      ? collection(db, 'announcements')
      : query(collection(db, 'announcements'), where('status', '==', 'published'));
    unsubs.push(
      onSnapshot(
        annRef,
        (snap) => {
          setAnnouncements(
            snap.docs
              .map((d) => ({ ...(d.data() as Omit<Announcement, 'id'>), id: d.id }))
              .sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''))
          );
        },
        (err) => console.warn('Announcements snapshot:', err.message)
      )
    );

    const scheduleRef = isAdmin
      ? collection(db, 'schedules')
      : query(collection(db, 'schedules'), where('isActive', '==', true));
    unsubs.push(
      onSnapshot(
        scheduleRef,
        (snap) => {
          setSchedules(
            snap.docs.map((d) => ({ ...(d.data() as Omit<Schedule, 'id'>), id: d.id }))
          );
        },
        (err) => console.warn('Schedules snapshot:', err.message)
      )
    );

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [authReady, isAdmin]);

  // Parent-scoped private listeners (strictly filtered by parentUid == user.uid)
  useEffect(() => {
    if (!authReady || !user) {
      setParentProfile(null);
      setMyStudents([]);
      setMyRegistrations([]);
      setMyInvoices([]);
      setMyPayments([]);
      return;
    }

    const unsubs: Array<() => void> = [];

    unsubs.push(
      onSnapshot(
        doc(db, 'parents', user.uid),
        (snap) => {
          if (snap.exists()) {
            setParentProfile({ ...(snap.data() as Omit<ParentProfile, 'id'>), id: snap.id });
          } else {
            setParentProfile(null);
          }
        },
        (err) => handleFirestoreError(err, OperationType.GET, `parents/${user.uid}`)
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'students'), where('parentUid', '==', user.uid)),
        (snap) => {
          setMyStudents(
            snap.docs.map((d) => ({ ...(d.data() as Omit<Student, 'id'>), id: d.id }))
          );
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'students')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'registrations'), where('parentUid', '==', user.uid)),
        (snap) => {
          setMyRegistrations(
            snap.docs
              .map((d) => ({ ...(d.data() as Omit<Registration, 'id'>), id: d.id }))
              .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
          );
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'registrations')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'invoices'), where('parentUid', '==', user.uid)),
        (snap) => {
          setMyInvoices(
            snap.docs
              .map((d) => ({ ...(d.data() as Omit<Invoice, 'id'>), id: d.id }))
              .sort((a, b) => b.dueDate.localeCompare(a.dueDate))
          );
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'invoices')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'payments'), where('parentUid', '==', user.uid)),
        (snap) => {
          setMyPayments(
            snap.docs
              .map((d) => ({ ...(d.data() as Omit<Payment, 'id'>), id: d.id }))
              .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))
          );
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'payments')
      )
    );

    return () => unsubs.forEach((u) => u());
  }, [authReady, user]);

  // Admin-scoped full listeners (strictly attached when isAdmin && serverVerifiedAdmin)
  useEffect(() => {
    if (!authReady || !isAdmin || !serverVerifiedAdmin) {
      setAllParents([]);
      setAllStudents([]);
      setAllRegistrations([]);
      setAllInvoices([]);
      setAllPayments([]);
      setContactMessages([]);
      return;
    }

    const unsubs: Array<() => void> = [];

    unsubs.push(
      onSnapshot(
        collection(db, 'parents'),
        (snap) => {
          setAllParents(
            snap.docs.map((d) => ({ ...(d.data() as Omit<ParentProfile, 'id'>), id: d.id }))
          );
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'parents')
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'students'),
        (snap) => {
          setAllStudents(
            snap.docs.map((d) => ({ ...(d.data() as Omit<Student, 'id'>), id: d.id }))
          );
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'students')
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'registrations'),
        (snap) => {
          setAllRegistrations(
            snap.docs
              .map((d) => ({ ...(d.data() as Omit<Registration, 'id'>), id: d.id }))
              .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
          );
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'registrations')
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'invoices'),
        (snap) => {
          setAllInvoices(
            snap.docs
              .map((d) => ({ ...(d.data() as Omit<Invoice, 'id'>), id: d.id }))
              .sort((a, b) => b.dueDate.localeCompare(a.dueDate))
          );
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'invoices')
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'payments'),
        (snap) => {
          setAllPayments(
            snap.docs
              .map((d) => ({ ...(d.data() as Omit<Payment, 'id'>), id: d.id }))
              .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))
          );
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'payments')
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'contactMessages'),
        (snap) => {
          setContactMessages(
            snap.docs
              .map((d) => ({ ...(d.data() as Omit<ContactMessage, 'id'>), id: d.id }))
              .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
          );
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'contactMessages')
      )
    );

    return () => unsubs.forEach((u) => u());
  }, [authReady, isAdmin, serverVerifiedAdmin]);

  // Auth actions
  const loginWithEmail = async (email: string, password: string): Promise<User> => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    return cred.user;
  };

  const registerWithEmail = async (email: string, password: string): Promise<User> => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await sendEmailVerification(cred.user);
    return cred.user;
  };

  const loginWithGoogle = async (): Promise<User | null> => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      return cred.user;
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (
        code === 'auth/popup-blocked' ||
        code === 'auth/operation-not-supported-in-this-environment'
      ) {
        await signInWithRedirect(auth, googleProvider);
        return null;
      }
      throw err;
    }
  };

  const resendVerification = async (): Promise<void> => {
    if (!auth.currentUser) throw new Error('Pengguna belum login.');
    await sendEmailVerification(auth.currentUser);
  };

  const refreshAuthUser = async (): Promise<User | null> => {
    if (!auth.currentUser) return null;
    await reload(auth.currentUser);
    // Force new token claims refresh so Firestore sees updated email_verified
    await auth.currentUser.getIdToken(true);
    setUser({ ...auth.currentUser });
    return auth.currentUser;
  };

  const sendResetPassword = async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const logout = async (): Promise<void> => {
    setServerVerifiedAdmin(false);
    await signOut(auth);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        authReady,
        isAdmin,
        serverVerifiedAdmin,
        adminVerifyLoading,
        isVerifiedUser,
        settings,
        seoSettings,
        sitePages,
        founder,
        teachers,
        branches,
        programs,
        subjects,
        galleries,
        testimonials,
        announcements,
        schedules,
        parentProfile,
        myStudents,
        myRegistrations,
        myInvoices,
        myPayments,
        allParents,
        allStudents,
        allRegistrations,
        allInvoices,
        allPayments,
        contactMessages,
        firestoreSeeded,
        seedingInProgress,
        seedInitialDataToFirestore,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        resendVerification,
        refreshAuthUser,
        sendResetPassword,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
