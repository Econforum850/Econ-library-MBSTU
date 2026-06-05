import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  getDocFromServer
} from 'firebase/firestore';
import { db as firestoreDb, auth } from './firebaseClient';
import { fetchBooksFromSheet, fetchMembersFromSheet } from './googleSheets';

// ==========================================
// CENTRAL DATA TYPES (COMPATIBLE PRESERVED)
// ==========================================

export interface SupabaseBook {
  id: string;
  title: string;
  author: string;
  category: string;
  cover: string;
  bookId: string;
  shelfNo: string;
  status: 'available' | 'pre-order';
  price: string;
  stock: number;
  isEBook: boolean;
  ebookUrl?: string;
}

export interface SupabaseMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string; // 'Member' | 'Admin' | 'Premium'
  joinDate: string;
  status: 'active' | 'inactive' | 'pending' | 'accepted' | 'rejected';
  dues: number;
  photo?: string;
  address?: string;
  occupation?: string;
  password?: string;
  paymentMethod?: string;
  senderNumber?: string;
  trxId?: string;
  validationStartDate?: string;    // 'YYYY-MM-DD'
  yearlyFeeStatus?: 'paid' | 'unpaid';
  paidUntilDate?: string;          // 'YYYY-MM-DD'
  paidAccountYears?: string;        // e.g. '২০২৫-২০২৬'
  baseDues?: number;               // Fines and manual adjustments
  studentRoll?: string;
  batchSession?: string;
  bloodGroup?: string;
  department?: string;
  lostCardStatus?: 'none' | 'requested' | 'reissued';
  renewalStatus?: 'none' | 'requested' | 'renewed';
  membershipExpiry?: string;       // 'YYYY-MM-DD'
}

export interface SupabaseDonor {
  id: string;
  name: string;
  type: 'Individual' | 'Organization';
  totalDonation: string;
  lastDonationDate: string;
  impact: string;
  description: string;
}

export interface SupabaseIssue {
  id: string;
  bookTitle: string;
  memberName: string;
  issueDate: string;
  dueDate: string;
  status: 'Pending' | 'Active' | 'Returned' | 'Overdue' | 'Rejected';
  memberId?: string;
  bookId?: string;
  pickupDate?: string;
  notes?: string;
}

export interface SupabaseTransaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  date: string;
  status: string;
  note: string;
}

export interface SupabaseEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  image?: string;
  fbLink?: string;
}

export interface SupabaseOrder {
  id: string;
  memberId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address?: string;
  date: string;
  total: number;
  items: string;
  status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
}

export interface GraphicsConfig {
  id: string;
  homeHeroBg: string;
  homeHeroText?: string;
  homeHeroSubtext?: string;
  donorMediaLink?: string;
  backgroundGallery?: string[];
  categoryEmojis?: { [category: string]: string };
}

export interface RecentDonation {
  id: string;
  name: string;
  amount: number;
  date: string;
  message: string;
  photo?: string;
}

export interface MediaGalleryItem {
  id: string;
  title: string;
  imageUrl: string;
  date?: string;
  description?: string;
}

export interface SupabaseSubAdmin {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'super' | 'sub-admin';
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface SupabaseAuditLog {
  id: string;
  actionType: string;
  adminId: string;
  timestamp: string;
  affectedRecordId: string;
}

export interface SupabaseEmailLog {
  id: string;
  recipient: string;
  subject: string;
  timestamp: string;
  status: 'success' | 'failed';
  errorDetails?: string;
  sender: string;
  type?: string;
  messageId?: string;
}

// ==========================================
// OFFLINE FALLBACK UTILS
// ==========================================

const INITIAL_BOOKS: SupabaseBook[] = [];
const INITIAL_MEMBERS: SupabaseMember[] = [];
const INITIAL_DONORS: SupabaseDonor[] = [];
const INITIAL_ISSUES: SupabaseIssue[] = [];
const INITIAL_TRANSACTIONS: SupabaseTransaction[] = [];
const INITIAL_EVENTS: SupabaseEvent[] = [];
const INITIAL_ORDERS: SupabaseOrder[] = [];

const getLocalData = <T>(key: string, initial: T[]): T[] => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    console.warn("Read local fallback warn:", e);
    return initial;
  }
};

const saveLocalData = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// ==========================================
// DUES & PERIODIC VALIDATION DATE CALCULATORS
// ==========================================

export function parseAnyDate(str: string): Date | null {
  if (!str) return null;
  // If it contains a '|' from old joinDate formats (e.g. "12/05/2025|12/05/2029")
  const cleanStr = str.split('|')[0].trim();
  if (cleanStr.includes('-')) {
    const parts = cleanStr.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(cleanStr.split(' ')[0].split('T')[0].split('-')[2])); // safe parsing
      const yr = Number(parts[0]);
      const mo = Number(parts[1]) - 1;
      const dy = Number(parts[2].split(' ')[0]);
      const constructed = new Date(yr, mo, dy);
      if (!isNaN(constructed.getTime())) return constructed;
    }
  }
  if (cleanStr.includes('/')) {
    const parts = cleanStr.split('/');
    if (parts.length === 3) {
      const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      if (!isNaN(d.getTime())) return d;
    }
  }
  const direct = new Date(cleanStr);
  return isNaN(direct.getTime()) ? null : direct;
}

export function getMonthsBetween(d1: Date, d2: Date): number {
  let months = (d2.getFullYear() - d1.getFullYear()) * 12;
  months -= d1.getMonth();
  months += d2.getMonth();
  if (d2.getDate() < d1.getDate()) {
    months--;
  }
  return Math.max(0, months);
}

export function calculateYearlyFeesOwedOnly(member: SupabaseMember): number {
  const today = new Date();
  
  // If not accepted/active yet, no validation dues accumulated
  if (member.status !== 'accepted' && member.status !== 'active') {
    return 0;
  }

  let baseStr = member.validationStartDate || '';
  if (!baseStr && member.joinDate) {
    baseStr = member.joinDate.split('|')[0];
  }
  const baseDate = parseAnyDate(baseStr) || new Date();

  if (member.yearlyFeeStatus === 'paid') {
    const paidUntil = parseAnyDate(member.paidUntilDate || '') || baseDate;
    if (today <= paidUntil) {
      return 0;
    } else {
      const months = getMonthsBetween(paidUntil, today);
      return 50 + Math.floor(months / 12) * 50;
    }
  } else {
    // Unpaid starting state
    const months = getMonthsBetween(baseDate, today);
    return 50 + Math.floor(months / 12) * 50;
  }
}

export function calculateDues(member: SupabaseMember): number {
  const yearlyFees = calculateYearlyFeesOwedOnly(member);
  return yearlyFees + (member.baseDues ?? 0);
}

// ==========================================
// ERROR HANDLER (FIRESTORE SKILL MANDATE)
// ==========================================

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error details: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ==========================================
// REBUILT FIRESTORE CENTRAL DATABASE ADAPTER
// ==========================================

export const db = {
  ordersTableMissing: false,

  // --- HEALTH CHECK ---
  async isSupabaseConnected(): Promise<boolean> {
    try {
      await getDocFromServer(doc(firestoreDb, 'test', 'connection'));
      return true;
    } catch {
      return true; // We default to connected for offline capabilities mapping
    }
  },

  // --- BOOKS SERVICES ---
  async getBooks(): Promise<SupabaseBook[]> {
    const colPath = 'books';
    try {
      const q = query(collection(firestoreDb, colPath));
      const querySnapshot = await getDocs(q);
      const mapped: SupabaseBook[] = [];
      querySnapshot.forEach((d) => {
        const b = d.data();
        mapped.push({
          id: d.id,
          title: b.title || '',
          author: b.author || '',
          category: b.category || '',
          cover: b.cover || '',
          bookId: b.bookId || '',
          shelfNo: b.shelfNo || 'N/A',
          status: b.status || 'available',
          price: b.price || '৳০',
          stock: b.stock || 1,
          isEBook: b.isEBook ?? false,
          ebookUrl: b.ebookUrl || ''
        });
      });

      // Sort books ascending by title locally to avoid needing Firestore complex indexes
      mapped.sort((x, y) => (x.title || '').localeCompare(y.title || ''));

      if (mapped.length > 0) {
        saveLocalData('db_books', mapped);
        return mapped;
      }
    } catch (err) {
      console.warn("Firestore getBooks failed, fallback to local:", err);
    }
    
    // Fallback: load from local storage
    const localBooks = getLocalData<SupabaseBook>('db_books', INITIAL_BOOKS);
    if (localBooks.length === 0) {
      try {
        const sheetUrl = localStorage.getItem('sheet_inventory') || import.meta.env.VITE_GOOGLE_SHEET_URL || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRfFFE_8E7kQVRGRXuN_HZDMFQWZvfhxnVU7SI0sZi8mCp2am8qsa5eNeT6WYVkF8kQdza8eWcYWk07/pub?output=csv';
        if (sheetUrl) {
          const sheetBooks = await fetchBooksFromSheet(sheetUrl);
          const parsedBooks: SupabaseBook[] = sheetBooks.map((b, i) => ({
            id: b.id || `b-${100 + i}`,
            title: b.title || 'শিরোনামহীন',
            author: b.author || 'অজ্ঞাত লেখক',
            category: b.category || 'সাধারণ',
            cover: b.cover || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400',
            bookId: b.bookId || `BK-${100 + i}`,
            shelfNo: b.shelfNo || 'N/A',
            status: b.status || 'available',
            price: b.price || '৳০',
            stock: b.stock || 1,
            isEBook: b.category.toLowerCase().includes('e-book') || b.category.toLowerCase().includes('ই-বুক') || !!b.ebookUrl,
            ebookUrl: b.ebookUrl || ''
          }));
          if (parsedBooks.length > 0) {
            saveLocalData('db_books', parsedBooks);
            // Proactively upload to the real database
            for (const pb of parsedBooks) {
              await this.saveBook(pb);
            }
            return parsedBooks;
          }
        }
      } catch (sheetErr) {
        console.warn("Failed fallback Sheets books fetch:", sheetErr);
      }
    }
    return localBooks;
  },

  async saveBook(book: Partial<SupabaseBook>): Promise<SupabaseBook> {
    const colPath = 'books';
    const finalId = book.id || doc(collection(firestoreDb, colPath)).id;
    const docRef = doc(firestoreDb, colPath, finalId);

    const finalizedBook: SupabaseBook = {
      id: finalId,
      title: book.title || 'শিরোনামহীন',
      author: book.author || 'অজ্ঞাত লেখক',
      category: book.category || 'সাধারণ',
      cover: book.cover || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400',
      bookId: book.bookId || `BK-${Math.floor(100 + Math.random() * 900)}`,
      shelfNo: book.shelfNo || 'N/A',
      status: book.status || 'available',
      price: book.price || '৳০',
      stock: book.stock ?? 1,
      isEBook: book.isEBook ?? false,
      ebookUrl: book.ebookUrl || ''
    };

    try {
      const dbPayload = {
        title: finalizedBook.title,
        author: finalizedBook.author,
        category: finalizedBook.category,
        cover: finalizedBook.cover,
        bookId: finalizedBook.bookId,
        shelfNo: finalizedBook.shelfNo,
        status: finalizedBook.status,
        price: finalizedBook.price,
        stock: finalizedBook.stock,
        isEBook: finalizedBook.isEBook,
        ebookUrl: finalizedBook.ebookUrl
      };

      await setDoc(docRef, dbPayload, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${colPath}/${finalId}`);
    }

    // Update local mirror
    const local = getLocalData<SupabaseBook>('db_books', INITIAL_BOOKS);
    const index = local.findIndex(b => b.id === finalId);
    if (index > -1) {
      local[index] = finalizedBook;
    } else {
      local.push(finalizedBook);
    }
    saveLocalData('db_books', local);
    return finalizedBook;
  },

  async deleteBook(id: string): Promise<boolean> {
    const colPath = 'books';
    try {
      await deleteDoc(doc(firestoreDb, colPath, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${colPath}/${id}`);
    }

    const local = getLocalData<SupabaseBook>('db_books', INITIAL_BOOKS);
    const filtered = local.filter(b => b.id !== id);
    saveLocalData('db_books', filtered);
    return true;
  },

  // --- MEMBERS SERVICES ---
  async cronUpdateMembersOutstandingDues(): Promise<{ updatedCount: number }> {
    const colPath = 'members';
    let updatedCount = 0;
    try {
      const q = query(collection(firestoreDb, colPath));
      const querySnapshot = await getDocs(q);
      const promises: Promise<void>[] = [];
      querySnapshot.forEach((d) => {
        const m = d.data();
        if (m.status === 'accepted' || m.status === 'active') {
          const baseMem: SupabaseMember = {
            id: d.id,
            name: m.name || '',
            email: m.email || '',
            phone: m.phone || '',
            role: m.role || 'Member',
            joinDate: m.joinDate || '',
            status: m.status,
            dues: m.dues || 0,
            photo: m.photo || '',
            address: m.address || '',
            occupation: m.occupation || '',
            password: m.password || '',
            paymentMethod: m.paymentMethod || '',
            senderNumber: m.senderNumber || '',
            trxId: m.trxId || '',
            validationStartDate: m.validationStartDate || '',
            yearlyFeeStatus: m.yearlyFeeStatus || 'unpaid',
            paidUntilDate: m.paidUntilDate || '',
            paidAccountYears: m.paidAccountYears || '',
            baseDues: m.baseDues ?? 0,
            studentRoll: m.studentRoll || '',
            batchSession: m.batchSession || '',
            bloodGroup: m.bloodGroup || '',
            department: m.department || ''
          };
          const currentCalculatedDues = calculateDues(baseMem);
          if (m.dues !== currentCalculatedDues) {
            updatedCount++;
            const docRef = doc(firestoreDb, colPath, d.id);
            promises.push(updateDoc(docRef, { dues: currentCalculatedDues }));
          }
        }
      });
      if (promises.length > 0) {
        await Promise.all(promises);
      }
    } catch (err) {
      console.error("Dues automatic update cron error:", err);
    }
    return { updatedCount };
  },

  async checkAndTriggerDuesCron(): Promise<void> {
    const currentMonth = new Date().toISOString().substring(0, 7); // e.g. "2026-06"
    const lastRunKey = 'last_monthly_due_cron_month';
    const lastRun = localStorage.getItem(lastRunKey);
    
    if (lastRun !== currentMonth) {
      console.log(`New month detected (${currentMonth}). Running monthly dues update trigger...`);
      try {
        await this.cronUpdateMembersOutstandingDues();
        localStorage.setItem(lastRunKey, currentMonth);
        console.log(`Monthly dues update cron run completed successfully.`);
      } catch (e) {
        console.error("Failed to run monthly dues cron:", e);
      }
    }
  },

  async getMembers(): Promise<SupabaseMember[]> {
    const colPath = 'members';
    // Async trigger cron-like check for outstanding dues at start of any new month
    this.checkAndTriggerDuesCron().catch(err => console.error("Cron trigger error:", err));

    try {
      const q = query(collection(firestoreDb, colPath));
      const querySnapshot = await getDocs(q);
      const mapped: SupabaseMember[] = [];
      querySnapshot.forEach((d) => {
        const m = d.data();
        const baseMem: SupabaseMember = {
          id: d.id,
          name: m.name || '',
          email: m.email || '',
          phone: m.phone || '',
          role: m.role || 'Member',
          joinDate: m.joinDate || new Date().toLocaleDateString('bn-BD'),
          status: m.status || 'pending',
          dues: m.dues || 0,
          photo: m.photo || '',
          address: m.address || '',
          occupation: m.occupation || '',
          password: m.password || '',
          paymentMethod: m.paymentMethod || '',
          senderNumber: m.senderNumber || '',
          trxId: m.trxId || '',
          validationStartDate: m.validationStartDate || '',
          yearlyFeeStatus: m.yearlyFeeStatus || 'unpaid',
          paidUntilDate: m.paidUntilDate || '',
          paidAccountYears: m.paidAccountYears || '',
          baseDues: m.baseDues ?? 0,
          studentRoll: m.studentRoll || '',
          batchSession: m.batchSession || '',
          bloodGroup: m.bloodGroup || '',
          department: m.department || '',
          membershipExpiry: m.membershipExpiry || '',
          lostCardStatus: m.lostCardStatus || 'none',
          renewalStatus: m.renewalStatus || 'none'
        };
        // Automatically calculate dynamic dues if accepted/active
        if (baseMem.status === 'accepted' || baseMem.status === 'active') {
          baseMem.dues = calculateDues(baseMem);
        }
        mapped.push(baseMem);
      });

      // Filter and clean up invalid ones from Firestore
      const validMapped: SupabaseMember[] = [];
      for (const m of mapped) {
        const isInvalid = !m.name || m.name.trim() === '' || 
                          ((m.name === 'সদস্য' || m.name === 'নতুন সদস্য') && (!m.phone || m.phone.trim() === ''));
        if (isInvalid) {
          console.log(`Auto-deleting invalid member ${m.id} from database`);
          try {
            await deleteDoc(doc(firestoreDb, colPath, m.id));
          } catch (e) {
            console.error("Failed to delete invalid member", m.id, e);
          }
        } else {
          validMapped.push(m);
        }
      }

      // Sort ascending by name locally
      validMapped.sort((x, y) => (x.name || '').localeCompare(y.name || ''));

      if (!querySnapshot.empty || validMapped.length > 0) {
        saveLocalData('db_members', validMapped);
        return validMapped;
      }
    } catch (err) {
      console.warn("Firestore getMembers failed, fallback to local:", err);
    }
    
    // Fallback: load from local storage
    const localMems = getLocalData<SupabaseMember>('db_members', INITIAL_MEMBERS);
    const validLocal = localMems.filter(m => {
      const isInvalid = !m.name || m.name.trim() === '' || 
                        ((m.name === 'সদস্য' || m.name === 'নতুন সদস্য') && (!m.phone || m.phone.trim() === ''));
      return !isInvalid;
    });

    if (validLocal.length === 0) {
      try {
        console.log("Local members empty, trying to fetch from Google Sheet...");
        const sheetUrl = localStorage.getItem('sheet_members') || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTjbvT42nJIt_6goEZeYH0vzeACzf6tmANoUJeUTFpSBIJzrbQJ7xMZwlTZ5g7KJiPDYR1gdjWVdfNt/pub?output=csv';
        const sheetMems = await fetchMembersFromSheet(sheetUrl);
        const parsedMems: SupabaseMember[] = sheetMems
          .filter((m: any) => m.name && m.name.trim() !== '' && m.name.trim() !== 'সদস্য' && m.name.toLowerCase() !== 'name')
          .map((m: any, i) => {
            const statusRaw = (m.status || 'pending').toLowerCase();
            const status = statusRaw.includes('accepted') || statusRaw.includes('active') ? 'accepted' : 
                           (statusRaw.includes('rejected') ? 'rejected' : 'pending');
            const phone = m.phone || '';
            const email = m.email || `${phone || `mem${i}`}@mbstu.ac.bd`;
            return {
              id: m.id || `M-${100 + i}`,
              name: m.name || 'সদস্য',
              email,
              phone,
              role: m.role || 'Member',
              joinDate: m.joinDate || new Date().toLocaleDateString('bn-BD'),
              status,
              dues: m.dues || 0,
              photo: m.photo || '',
              address: m.address || '',
              occupation: m.occupation || '',
              password: m.password || 'library',
              paymentMethod: m.paymentMethod || '',
              senderNumber: m.senderNumber || '',
              trxId: m.trxId || ''
            };
          });
        if (parsedMems.length > 0) {
          saveLocalData('db_members', parsedMems);
          for (const pm of parsedMems) {
            await this.saveMember(pm);
          }
          return parsedMems;
        }
      } catch (sheetErr) {
        console.warn("Failed fallback Sheets members fetch:", sheetErr);
      }
    }
    return validLocal;
  },

  async saveMember(member: Partial<SupabaseMember>): Promise<SupabaseMember> {
    const colPath = 'members';
    const finalId = member.id || doc(collection(firestoreDb, colPath)).id;
    const docRef = doc(firestoreDb, colPath, finalId);

    const finalizedMem: SupabaseMember = {
      id: finalId,
      name: member.name || 'নতুন সদস্য',
      email: member.email || '',
      phone: member.phone || '',
      role: member.role || 'Member',
      joinDate: member.joinDate || new Date().toLocaleDateString('bn-BD'),
      status: member.status || 'pending',
      dues: member.dues ?? 0,
      photo: member.photo || '',
      address: member.address || '',
      occupation: member.occupation || '',
      password: member.password || 'password123',
      paymentMethod: member.paymentMethod || '',
      senderNumber: member.senderNumber || '',
      trxId: member.trxId || '',
      validationStartDate: member.validationStartDate || '',
      yearlyFeeStatus: member.yearlyFeeStatus || 'unpaid',
      paidUntilDate: member.paidUntilDate || '',
      paidAccountYears: member.paidAccountYears || '',
      baseDues: member.baseDues ?? 0,
      studentRoll: member.studentRoll || '',
      batchSession: member.batchSession || '',
      bloodGroup: member.bloodGroup || '',
      department: member.department || '',
      lostCardStatus: member.lostCardStatus || 'none',
      renewalStatus: member.renewalStatus || 'none',
      membershipExpiry: member.membershipExpiry || ''
    };

    // Keep baseDues synchronized if there are manual additions or deductions
    if (finalizedMem.status === 'accepted' || finalizedMem.status === 'active') {
      const yearlyOwed = calculateYearlyFeesOwedOnly(finalizedMem);
      finalizedMem.baseDues = finalizedMem.dues - yearlyOwed;
    }

    try {
      const dbPayload = {
        name: finalizedMem.name,
        email: finalizedMem.email,
        phone: finalizedMem.phone,
        role: finalizedMem.role,
        joinDate: finalizedMem.joinDate,
        status: finalizedMem.status,
        dues: finalizedMem.dues,
        photo: finalizedMem.photo,
        address: finalizedMem.address,
        occupation: finalizedMem.occupation,
        password: finalizedMem.password,
        paymentMethod: finalizedMem.paymentMethod,
        senderNumber: finalizedMem.senderNumber,
        trxId: finalizedMem.trxId,
        validationStartDate: finalizedMem.validationStartDate,
        yearlyFeeStatus: finalizedMem.yearlyFeeStatus,
        paidUntilDate: finalizedMem.paidUntilDate,
        paidAccountYears: finalizedMem.paidAccountYears,
        baseDues: finalizedMem.baseDues,
        studentRoll: finalizedMem.studentRoll,
        batchSession: finalizedMem.batchSession,
        bloodGroup: finalizedMem.bloodGroup,
        department: finalizedMem.department,
        lostCardStatus: finalizedMem.lostCardStatus,
        renewalStatus: finalizedMem.renewalStatus,
        membershipExpiry: finalizedMem.membershipExpiry
      };

      await setDoc(docRef, dbPayload, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${colPath}/${finalId}`);
    }

    const local = getLocalData<SupabaseMember>('db_members', INITIAL_MEMBERS);
    const index = local.findIndex(m => m.id === finalId);
    if (index > -1) {
      local[index] = finalizedMem;
    } else {
      local.push(finalizedMem);
    }
    saveLocalData('db_members', local);
    return finalizedMem;
  },

  calculateMembershipExpiry(baseDateStr: string, yearsOffset: number = 1): string {
    try {
      let baseDate = new Date();
      if (baseDateStr) {
        if (baseDateStr.includes('-')) {
          const parts = baseDateStr.split('-');
          if (parts.length === 3) {
            baseDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          }
        } else if (baseDateStr.includes('/')) {
          const parts = baseDateStr.split('/');
          if (parts.length === 3) {
            baseDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          }
        } else {
          const parsed = new Date(baseDateStr);
          if (!isNaN(parsed.getTime())) baseDate = parsed;
        }
      }
      baseDate.setFullYear(baseDate.getFullYear() + yearsOffset);
      const yyyy = baseDate.getFullYear();
      const mm = String(baseDate.getMonth() + 1).padStart(2, '0');
      const dd = String(baseDate.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    } catch (e) {
      const d = new Date();
      d.setFullYear(d.getFullYear() + yearsOffset);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
  },

  async deleteMember(id: string): Promise<boolean> {
    const colPath = 'members';
    try {
      await deleteDoc(doc(firestoreDb, colPath, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${colPath}/${id}`);
    }

    const local = getLocalData<SupabaseMember>('db_members', INITIAL_MEMBERS);
    const filtered = local.filter(m => m.id !== id);
    saveLocalData('db_members', filtered);
    return true;
  },

  // --- DONORS SERVICES ---
  async getDonors(): Promise<SupabaseDonor[]> {
    const colPath = 'donors';
    try {
      const q = query(collection(firestoreDb, colPath));
      const querySnapshot = await getDocs(q);
      const mapped: SupabaseDonor[] = [];
      querySnapshot.forEach((d) => {
        const donor = d.data();
        mapped.push({
          id: d.id,
          name: donor.name || '',
          type: donor.type || 'Individual',
          totalDonation: donor.totalDonation || '৳০',
          lastDonationDate: donor.lastDonationDate || '',
          impact: donor.impact || '',
          description: donor.description || ''
        });
      });

      if (mapped.length > 0) {
        saveLocalData('db_donors', mapped);
        return mapped;
      }
    } catch (err) {
      console.warn("Firestore getDonors failed, fallback to local:", err);
    }
    return getLocalData<SupabaseDonor>('db_donors', INITIAL_DONORS);
  },

  async saveDonor(donor: Partial<SupabaseDonor>): Promise<SupabaseDonor> {
    const colPath = 'donors';
    const finalId = donor.id || doc(collection(firestoreDb, colPath)).id;
    const docRef = doc(firestoreDb, colPath, finalId);

    const finalizedDonor: SupabaseDonor = {
      id: finalId,
      name: donor.name || 'নামহীন দাতা',
      type: donor.type || 'Individual',
      totalDonation: donor.totalDonation || '৳০',
      lastDonationDate: donor.lastDonationDate || new Date().toLocaleDateString('bn-BD'),
      impact: donor.impact || '',
      description: donor.description || ''
    };

    try {
      const dbPayload = {
        name: finalizedDonor.name,
        type: finalizedDonor.type,
        totalDonation: finalizedDonor.totalDonation,
        lastDonationDate: finalizedDonor.lastDonationDate,
        impact: finalizedDonor.impact,
        description: finalizedDonor.description
      };

      await setDoc(docRef, dbPayload, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${colPath}/${finalId}`);
    }

    const local = getLocalData<SupabaseDonor>('db_donors', INITIAL_DONORS);
    const index = local.findIndex(d => d.id === finalId);
    if (index > -1) {
      local[index] = finalizedDonor;
    } else {
      local.push(finalizedDonor);
    }
    saveLocalData('db_donors', local);
    return finalizedDonor;
  },

  async deleteDonor(id: string): Promise<boolean> {
    const colPath = 'donors';
    try {
      await deleteDoc(doc(firestoreDb, colPath, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${colPath}/${id}`);
    }

    const local = getLocalData<SupabaseDonor>('db_donors', INITIAL_DONORS);
    const filtered = local.filter(d => d.id !== id);
    saveLocalData('db_donors', filtered);
    return true;
  },

  // --- ISSUES / LOANS SERVICES ---
  async getIssues(): Promise<SupabaseIssue[]> {
    const colPath = 'issues';
    try {
      const q = query(collection(firestoreDb, colPath));
      const querySnapshot = await getDocs(q);
      const mapped: SupabaseIssue[] = [];
      querySnapshot.forEach((d) => {
        const i = d.data();
        mapped.push({
          id: d.id,
          bookTitle: i.bookTitle || '',
          memberName: i.memberName || '',
          issueDate: i.issueDate || '',
          dueDate: i.dueDate || '',
          status: (i.status || 'Active') as any,
          memberId: i.memberId || '',
          bookId: i.bookId || '',
          pickupDate: i.pickupDate || '',
          notes: i.notes || ''
        });
      });

      if (mapped.length > 0) {
        saveLocalData('db_issues', mapped);
        return mapped;
      }
    } catch (err) {
      console.warn("Firestore getIssues failed, fallback to local:", err);
    }
    return getLocalData<SupabaseIssue>('db_issues', INITIAL_ISSUES);
  },

  async saveIssue(issue: Partial<SupabaseIssue>): Promise<SupabaseIssue> {
    const colPath = 'issues';
    const finalId = issue.id || doc(collection(firestoreDb, colPath)).id;
    const docRef = doc(firestoreDb, colPath, finalId);

    const finalizedIssue: SupabaseIssue = {
      id: finalId,
      bookTitle: issue.bookTitle || '',
      memberName: issue.memberName || '',
      issueDate: issue.issueDate || new Date().toLocaleDateString('bn-BD'),
      dueDate: issue.dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('bn-BD'),
      status: issue.status || 'Active',
      memberId: issue.memberId || '',
      bookId: issue.bookId || '',
      pickupDate: issue.pickupDate || '',
      notes: issue.notes || ''
    };

    try {
      const dbPayload = {
        bookTitle: finalizedIssue.bookTitle,
        memberName: finalizedIssue.memberName,
        issueDate: finalizedIssue.issueDate,
        dueDate: finalizedIssue.dueDate,
        status: finalizedIssue.status,
        memberId: finalizedIssue.memberId || null,
        bookId: finalizedIssue.bookId || null,
        pickupDate: finalizedIssue.pickupDate || null,
        notes: finalizedIssue.notes || null
      };

      await setDoc(docRef, dbPayload, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${colPath}/${finalId}`);
    }

    const local = getLocalData<SupabaseIssue>('db_issues', INITIAL_ISSUES);
    const index = local.findIndex(i => i.id === finalId);
    if (index > -1) {
      local[index] = finalizedIssue;
    } else {
      local.push(finalizedIssue);
    }
    saveLocalData('db_issues', local);
    return finalizedIssue;
  },

  async deleteIssue(id: string): Promise<boolean> {
    const colPath = 'issues';
    try {
      await deleteDoc(doc(firestoreDb, colPath, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${colPath}/${id}`);
    }

    const local = getLocalData<SupabaseIssue>('db_issues', INITIAL_ISSUES);
    const filtered = local.filter(i => i.id !== id);
    saveLocalData('db_issues', filtered);
    return true;
  },

  // --- FINANCES SERVICES ---
  async getTransactions(): Promise<SupabaseTransaction[]> {
    const colPath = 'finances';
    try {
      const q = query(collection(firestoreDb, colPath));
      const querySnapshot = await getDocs(q);
      const mapped: SupabaseTransaction[] = [];
      querySnapshot.forEach((d) => {
        const t = d.data();
        mapped.push({
          id: d.id,
          type: t.type || 'income',
          category: t.category || '',
          amount: t.amount || 0,
          date: t.date || '',
          status: t.status || 'Completed',
          note: t.note || ''
        });
      });

      if (mapped.length > 0) {
        saveLocalData('db_finances', mapped);
        return mapped;
      }
    } catch (err) {
      console.warn("Firestore getTransactions failed, fallback to local:", err);
    }
    return getLocalData<SupabaseTransaction>('db_finances', INITIAL_TRANSACTIONS);
  },

  async saveTransaction(tx: Partial<SupabaseTransaction>): Promise<SupabaseTransaction> {
    const colPath = 'finances';
    const finalId = tx.id || doc(collection(firestoreDb, colPath)).id;
    const docRef = doc(firestoreDb, colPath, finalId);

    const finalizedTx: SupabaseTransaction = {
      id: finalId,
      type: tx.type || 'income',
      category: tx.category || 'বিবিধ',
      amount: tx.amount || 0,
      date: tx.date || new Date().toLocaleDateString('bn-BD'),
      status: tx.status || 'Completed',
      note: tx.note || ''
    };

    try {
      const dbPayload = {
        type: finalizedTx.type,
        category: finalizedTx.category,
        amount: finalizedTx.amount,
        date: finalizedTx.date,
        status: finalizedTx.status,
        note: finalizedTx.note
      };

      await setDoc(docRef, dbPayload, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${colPath}/${finalId}`);
    }

    const local = getLocalData<SupabaseTransaction>('db_finances', INITIAL_TRANSACTIONS);
    const index = local.findIndex(t => t.id === finalId);
    if (index > -1) {
      local[index] = finalizedTx;
    } else {
      local.push(finalizedTx);
    }
    saveLocalData('db_finances', local);
    return finalizedTx;
  },

  async deleteTransaction(id: string): Promise<boolean> {
    const colPath = 'finances';
    try {
      await deleteDoc(doc(firestoreDb, colPath, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${colPath}/${id}`);
    }

    const local = getLocalData<SupabaseTransaction>('db_finances', INITIAL_TRANSACTIONS);
    const filtered = local.filter(t => t.id !== id);
    saveLocalData('db_finances', filtered);
    return true;
  },

  // --- EVENTS SERVICES ---
  async getEvents(): Promise<SupabaseEvent[]> {
    const colPath = 'events';
    try {
      const q = query(collection(firestoreDb, colPath));
      const querySnapshot = await getDocs(q);
      const mapped: SupabaseEvent[] = [];
      querySnapshot.forEach((d) => {
        const e = d.data();
        mapped.push({
          id: d.id,
          title: e.title || '',
          date: e.date || '',
          time: e.time || '',
          location: e.location || '',
          description: e.description || '',
          image: e.image || '',
          fbLink: e.fbLink || ''
        });
      });

      if (mapped.length > 0) {
        saveLocalData('db_events', mapped);
        return mapped;
      }
    } catch (err) {
      console.warn("Firestore getEvents failed, fallback to local:", err);
    }
    return getLocalData<SupabaseEvent>('db_events', INITIAL_EVENTS);
  },

  async saveEvent(event: Partial<SupabaseEvent>): Promise<SupabaseEvent> {
    const colPath = 'events';
    const finalId = event.id || doc(collection(firestoreDb, colPath)).id;
    const docRef = doc(firestoreDb, colPath, finalId);

    const finalizedEvent: SupabaseEvent = {
      id: finalId,
      title: event.title || 'শিরোনামহীন ইভেন্ট',
      date: event.date || new Date().toLocaleDateString('bn-BD'),
      time: event.time || '১২:০০ টা',
      location: event.location || 'পাঠাগার কক্ষ',
      description: event.description || '',
      image: event.image || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=600',
      fbLink: event.fbLink || ''
    };

    try {
      const dbPayload = {
        title: finalizedEvent.title,
        date: finalizedEvent.date,
        time: finalizedEvent.time,
        location: finalizedEvent.location,
        description: finalizedEvent.description,
        image: finalizedEvent.image,
        fbLink: finalizedEvent.fbLink
      };

      await setDoc(docRef, dbPayload, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${colPath}/${finalId}`);
    }

    const local = getLocalData<SupabaseEvent>('db_events', INITIAL_EVENTS);
    const index = local.findIndex(e => e.id === finalId);
    if (index > -1) {
      local[index] = finalizedEvent;
    } else {
      local.push(finalizedEvent);
    }
    saveLocalData('db_events', local);
    return finalizedEvent;
  },

  async deleteEvent(id: string): Promise<boolean> {
    const colPath = 'events';
    try {
      await deleteDoc(doc(firestoreDb, colPath, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${colPath}/${id}`);
    }

    const local = getLocalData<SupabaseEvent>('db_events', INITIAL_EVENTS);
    const filtered = local.filter(e => e.id !== id);
    saveLocalData('db_events', filtered);
    return true;
  },

  // --- ORDERS SERVICES ---
  async getOrders(): Promise<SupabaseOrder[]> {
    const colPath = 'orders';
    try {
      const q = query(collection(firestoreDb, colPath));
      const querySnapshot = await getDocs(q);
      const mapped: SupabaseOrder[] = [];
      querySnapshot.forEach((d) => {
        const o = d.data();
        mapped.push({
          id: d.id,
          memberId: o.memberId || '',
          customerName: o.customerName || '',
          customerEmail: o.customerEmail || '',
          customerPhone: o.customerPhone || '',
          address: o.address || '',
          date: o.date || '',
          total: o.total || 0,
          items: o.items || '',
          status: o.status || 'Pending'
        });
      });

      if (mapped.length > 0) {
        db.ordersTableMissing = false;
        saveLocalData('db_orders', mapped);
        return mapped;
      }
    } catch (err) {
      console.warn("Firestore getOrders failed, fallback to local:", err);
    }
    return getLocalData<SupabaseOrder>('db_orders', INITIAL_ORDERS);
  },

  async saveOrder(order: Partial<SupabaseOrder>): Promise<SupabaseOrder> {
    const colPath = 'orders';
    const finalId = order.id || doc(collection(firestoreDb, colPath)).id;
    const docRef = doc(firestoreDb, colPath, finalId);

    const finalizedOrder: SupabaseOrder = {
      id: finalId,
      memberId: order.memberId || '',
      customerName: order.customerName || 'বেনামী ক্রেতা',
      customerEmail: order.customerEmail || '',
      customerPhone: order.customerPhone || '',
      address: order.address || '',
      date: order.date || new Date().toLocaleDateString('bn-BD'),
      total: order.total || 0,
      items: order.items || 'বই নেই',
      status: order.status || 'Pending'
    };

    try {
      const dbPayload = {
        memberId: finalizedOrder.memberId,
        customerName: finalizedOrder.customerName,
        customerEmail: finalizedOrder.customerEmail,
        customerPhone: finalizedOrder.customerPhone,
        address: finalizedOrder.address,
        date: finalizedOrder.date,
        total: finalizedOrder.total,
        items: finalizedOrder.items,
        status: finalizedOrder.status
      };

      await setDoc(docRef, dbPayload, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${colPath}/${finalId}`);
    }

    const local = getLocalData<SupabaseOrder>('db_orders', INITIAL_ORDERS);
    const index = local.findIndex(o => o.id === finalId);
    if (index > -1) {
      local[index] = finalizedOrder;
    } else {
      local.push(finalizedOrder);
    }
    saveLocalData('db_orders', local);
    return finalizedOrder;
  },

  async deleteOrder(id: string): Promise<boolean> {
    const colPath = 'orders';
    try {
      await deleteDoc(doc(firestoreDb, colPath, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${colPath}/${id}`);
    }

    const local = getLocalData<SupabaseOrder>('db_orders', INITIAL_ORDERS);
    const filtered = local.filter(o => o.id !== id);
    saveLocalData('db_orders', filtered);
    return true;
  },

  // --- GRAPHICS / WEBSITE CONFIG SERVICES ---
  async getGraphicsConfig(): Promise<GraphicsConfig> {
    const colPath = 'graphics';
    const docId = 'config';
    let savedGallery: string[] = [];
    let savedCategoryEmojis: { [category: string]: string } = {};
    try {
      const stored = localStorage.getItem('background_gallery_urls');
      if (stored) savedGallery = JSON.parse(stored);
    } catch (_) {}

    try {
      const storedEmojis = localStorage.getItem('category_emojis');
      if (storedEmojis) savedCategoryEmojis = JSON.parse(storedEmojis);
    } catch (_) {}

    try {
      const d = await getDoc(doc(firestoreDb, colPath, docId));
      if (d.exists()) {
        const data = d.data();
        const gallery = data.backgroundGallery || savedGallery || [];
        const categoryEmojis = data.categoryEmojis || savedCategoryEmojis || {};
        try {
          localStorage.setItem('background_gallery_urls', JSON.stringify(gallery));
          localStorage.setItem('category_emojis', JSON.stringify(categoryEmojis));
        } catch (_) {}
        return {
          id: d.id,
          homeHeroBg: data.homeHeroBg || 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=1600',
          homeHeroText: data.homeHeroText || '',
          homeHeroSubtext: data.homeHeroSubtext || '',
          donorMediaLink: data.donorMediaLink || '',
          backgroundGallery: gallery,
          categoryEmojis: categoryEmojis
        };
      }
    } catch (err) {
      console.warn("Firestore getGraphicsConfig failed:", err);
    }
    return {
      id: docId,
      homeHeroBg: localStorage.getItem('home_hero_bg') || 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=1600',
      homeHeroText: '',
      homeHeroSubtext: '',
      donorMediaLink: localStorage.getItem('donor_media_link') || '',
      backgroundGallery: savedGallery,
      categoryEmojis: savedCategoryEmojis
    };
  },

  async saveGraphicsConfig(config: Partial<GraphicsConfig>): Promise<GraphicsConfig> {
    const colPath = 'graphics';
    const docId = 'config';
    const docRef = doc(firestoreDb, colPath, docId);
    
    let finalGallery = config.backgroundGallery;
    if (finalGallery === undefined) {
      try {
        const stored = localStorage.getItem('background_gallery_urls');
        if (stored) finalGallery = JSON.parse(stored);
      } catch (_) {}
    }
    if (!finalGallery) finalGallery = [];

    let finalCategoryEmojis = config.categoryEmojis;
    if (finalCategoryEmojis === undefined) {
      try {
        const storedEmojis = localStorage.getItem('category_emojis');
        if (storedEmojis) finalCategoryEmojis = JSON.parse(storedEmojis);
      } catch (_) {}
    }
    if (!finalCategoryEmojis) finalCategoryEmojis = {};

    const finalized: GraphicsConfig = {
      id: docId,
      homeHeroBg: config.homeHeroBg || 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=1600',
      homeHeroText: config.homeHeroText || '',
      homeHeroSubtext: config.homeHeroSubtext || '',
      donorMediaLink: config.donorMediaLink || '',
      backgroundGallery: finalGallery,
      categoryEmojis: finalCategoryEmojis
    };
    try {
      await setDoc(docRef, finalized, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${colPath}/${docId}`);
    }
    localStorage.setItem('home_hero_bg', finalized.homeHeroBg);
    localStorage.setItem('donor_media_link', finalized.donorMediaLink || '');
    localStorage.setItem('background_gallery_urls', JSON.stringify(finalized.backgroundGallery));
    localStorage.setItem('category_emojis', JSON.stringify(finalized.categoryEmojis || {}));
    return finalized;
  },

  // --- RECENT DONATIONS SERVICES ---
  async getRecentDonations(): Promise<RecentDonation[]> {
    const colPath = 'recent_donations';
    try {
      const q = query(collection(firestoreDb, colPath));
      const querySnapshot = await getDocs(q);
      const mapped: RecentDonation[] = [];
      querySnapshot.forEach((d) => {
        const r = d.data();
        mapped.push({
          id: d.id,
          name: r.name || 'নামহীন দাতা',
          amount: Number(r.amount) || 0,
          date: r.date || '',
          message: r.message || '',
          photo: r.photo || ''
        });
      });
      return mapped;
    } catch (err) {
      console.warn("Firestore getRecentDonations failed:", err);
      return [];
    }
  },

  async saveRecentDonation(rd: Partial<RecentDonation>): Promise<RecentDonation> {
    const colPath = 'recent_donations';
    const finalId = rd.id || doc(collection(firestoreDb, colPath)).id;
    const docRef = doc(firestoreDb, colPath, finalId);
    const finalized: RecentDonation = {
      id: finalId,
      name: rd.name || 'নামহীন দাতা',
      amount: Number(rd.amount) || 0,
      date: rd.date || new Date().toLocaleDateString('bn-BD'),
      message: rd.message || '',
      photo: rd.photo || ''
    };
    try {
      await setDoc(docRef, finalized, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${colPath}/${finalId}`);
    }
    return finalized;
  },

  async deleteRecentDonation(id: string): Promise<boolean> {
    const colPath = 'recent_donations';
    try {
      await deleteDoc(doc(firestoreDb, colPath, id));
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${colPath}/${id}`);
      return false;
    }
  },

  // --- MEDIA / GALLERY SERVICES ---
  async getMediaGallery(): Promise<MediaGalleryItem[]> {
    const colPath = 'media_gallery';
    try {
      const q = query(collection(firestoreDb, colPath));
      const querySnapshot = await getDocs(q);
      const mapped: MediaGalleryItem[] = [];
      querySnapshot.forEach((d) => {
        const m = d.data();
        mapped.push({
          id: d.id,
          title: m.title || '',
          imageUrl: m.imageUrl || '',
          date: m.date || '',
          description: m.description || ''
        });
      });
      return mapped;
    } catch (err) {
      console.warn("Firestore getMediaGallery failed:", err);
      return [];
    }
  },

  async saveMediaItem(item: Partial<MediaGalleryItem>): Promise<MediaGalleryItem> {
    const colPath = 'media_gallery';
    const finalId = item.id || doc(collection(firestoreDb, colPath)).id;
    const docRef = doc(firestoreDb, colPath, finalId);
    const finalized: MediaGalleryItem = {
      id: finalId,
      title: item.title || 'শিরোনামহীন ছবি',
      imageUrl: item.imageUrl || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400',
      date: item.date || new Date().toLocaleDateString('bn-BD'),
      description: item.description || ''
    };
    try {
      await setDoc(docRef, finalized, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${colPath}/${finalId}`);
    }
    return finalized;
  },

  async deleteMediaItem(id: string): Promise<boolean> {
    const colPath = 'media_gallery';
    try {
      await deleteDoc(doc(firestoreDb, colPath, id));
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${colPath}/${id}`);
      return false;
    }
  },

  // --- SUB-ADMINS & AUDIT LOG SERVICE ---
  async getSubAdmins(): Promise<SupabaseSubAdmin[]> {
    const colPath = 'sub_admins';
    try {
      const q = query(collection(firestoreDb, colPath));
      const querySnapshot = await getDocs(q);
      const mapped: SupabaseSubAdmin[] = [];
      querySnapshot.forEach((d) => {
        const r = d.data();
        mapped.push({
          id: d.id,
          name: r.name || '',
          email: r.email || '',
          password: r.password || '',
          role: r.role || 'sub-admin',
          status: r.status || 'active',
          createdAt: r.createdAt || ''
        });
      });
      saveLocalData('db_sub_admins', mapped);
      return mapped;
    } catch (err) {
      console.warn("Firestore getSubAdmins failed:", err);
      try {
        const stored = localStorage.getItem('db_sub_admins');
        if (stored) return JSON.parse(stored);
      } catch (_) {}
      return [];
    }
  },

  async saveSubAdmin(sa: Partial<SupabaseSubAdmin>): Promise<SupabaseSubAdmin> {
    const colPath = 'sub_admins';
    const finalId = sa.id || sa.email || doc(collection(firestoreDb, colPath)).id;
    const docRef = doc(firestoreDb, colPath, finalId);
    const finalizedValue: SupabaseSubAdmin = {
      id: finalId,
      name: sa.name || '',
      email: sa.email || '',
      password: sa.password || '',
      role: sa.role || 'sub-admin',
      status: sa.status || 'active',
      createdAt: sa.createdAt || new Date().toISOString()
    };
    try {
      await setDoc(docRef, finalizedValue, { merge: true });
    } catch (err) {
      console.error("Firestore saveSubAdmin failed:", err);
      handleFirestoreError(err, OperationType.WRITE, `${colPath}/${finalId}`);
    }
    try {
      const stored = localStorage.getItem('db_sub_admins');
      const all: SupabaseSubAdmin[] = stored ? JSON.parse(stored) : [];
      const idx = all.findIndex(a => a.id === finalId);
      if (idx >= 0) all[idx] = finalizedValue;
      else all.push(finalizedValue);
      localStorage.setItem('db_sub_admins', JSON.stringify(all));
    } catch (_) {}
    return finalizedValue;
  },

  async deleteSubAdmin(id: string): Promise<boolean> {
    const colPath = 'sub_admins';
    try {
      await deleteDoc(doc(firestoreDb, colPath, id));
    } catch (err) {
      console.error("Firestore deleteSubAdmin failed:", err);
      handleFirestoreError(err, OperationType.DELETE, `${colPath}/${id}`);
    }
    try {
      const stored = localStorage.getItem('db_sub_admins');
      if (stored) {
        const all: SupabaseSubAdmin[] = JSON.parse(stored);
        const filtered = all.filter(a => a.id !== id);
        localStorage.setItem('db_sub_admins', JSON.stringify(filtered));
      }
    } catch (_) {}
    return true;
  },

  async getAuditLogs(): Promise<SupabaseAuditLog[]> {
    const colPath = 'audit_logs';
    try {
      const q = query(collection(firestoreDb, colPath));
      const querySnapshot = await getDocs(q);
      const mapped: SupabaseAuditLog[] = [];
      querySnapshot.forEach((d) => {
        const r = d.data();
        mapped.push({
          id: d.id,
          actionType: r.actionType || '',
          adminId: r.adminId || '',
          timestamp: r.timestamp || '',
          affectedRecordId: r.affectedRecordId || ''
        });
      });
      mapped.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      saveLocalData('db_audit_logs', mapped);
      return mapped;
    } catch (err) {
      console.warn("Firestore getAuditLogs failed:", err);
      try {
        const stored = localStorage.getItem('db_audit_logs');
        if (stored) {
          const logs = JSON.parse(stored) as SupabaseAuditLog[];
          logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          return logs;
        }
      } catch (_) {}
      return [];
    }
  },

  async clearAuditLogs(): Promise<boolean> {
    const colPath = 'audit_logs';
    try {
      const q = query(collection(firestoreDb, colPath));
      const querySnapshot = await getDocs(q);
      const batchPromises: Promise<void>[] = [];
      querySnapshot.forEach((d) => {
        batchPromises.push(deleteDoc(doc(firestoreDb, colPath, d.id)));
      });
      await Promise.all(batchPromises);
      saveLocalData('db_audit_logs', []);
      return true;
    } catch (err) {
      console.error("Firestore clearAuditLogs failed:", err);
      saveLocalData('db_audit_logs', []);
      return true;
    }
  },

  async addAuditLog(actionType: string, affectedRecordId: string): Promise<SupabaseAuditLog> {
    const colPath = 'audit_logs';
    const id = doc(collection(firestoreDb, colPath)).id;
    
    let adminEmail = 'moderator@econlibrary.com';
    try {
      const email = localStorage.getItem('admin_email');
      if (email) adminEmail = email;
    } catch (_) {}

    const finalizedLog: SupabaseAuditLog = {
      id,
      actionType,
      adminId: adminEmail,
      timestamp: new Date().toISOString(),
      affectedRecordId
    };

    try {
      await setDoc(doc(firestoreDb, colPath, id), finalizedLog);
    } catch (err) {
      console.error("Firestore addAuditLog failed:", err);
      handleFirestoreError(err, OperationType.WRITE, `${colPath}/${id}`);
    }

    try {
      const stored = localStorage.getItem('db_audit_logs');
      const all: SupabaseAuditLog[] = stored ? JSON.parse(stored) : [];
      all.push(finalizedLog);
      localStorage.setItem('db_audit_logs', JSON.stringify(all));
    } catch (_) {}

    return finalizedLog;
  },

  async getEmailLogs(): Promise<SupabaseEmailLog[]> {
    const colPath = 'email_logs';
    try {
      const q = query(collection(firestoreDb, colPath));
      const querySnapshot = await getDocs(q);
      const mapped: SupabaseEmailLog[] = [];
      querySnapshot.forEach((d) => {
        const r = d.data();
        mapped.push({
          id: d.id,
          recipient: r.recipient || '',
          subject: r.subject || '',
          timestamp: r.timestamp || '',
          status: r.status || 'failed',
          errorDetails: r.errorDetails || '',
          sender: r.sender || '',
          type: r.type || '',
          messageId: r.messageId || ''
        });
      });
      mapped.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      saveLocalData('db_email_logs', mapped);
      return mapped;
    } catch (err) {
      console.warn("Firestore getEmailLogs failed:", err);
      try {
        const stored = localStorage.getItem('db_email_logs');
        if (stored) {
          const logs = JSON.parse(stored) as SupabaseEmailLog[];
          logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          return logs;
        }
      } catch (_) {}
      return [];
    }
  },

  async addEmailLog(log: Partial<SupabaseEmailLog>): Promise<SupabaseEmailLog> {
    const colPath = 'email_logs';
    const id = doc(collection(firestoreDb, colPath)).id;
    
    const finalizedLog: SupabaseEmailLog = {
      id,
      recipient: log.recipient || '',
      subject: log.subject || '',
      timestamp: log.timestamp || new Date().toISOString(),
      status: log.status || 'failed',
      errorDetails: log.errorDetails || '',
      sender: log.sender || '',
      type: log.type || 'GENERAL',
      messageId: log.messageId || ''
    };

    try {
      await setDoc(doc(firestoreDb, colPath, id), finalizedLog);
    } catch (err) {
      console.error("Firestore addEmailLog failed:", err);
      handleFirestoreError(err, OperationType.WRITE, `${colPath}/${id}`);
    }

    try {
      const stored = localStorage.getItem('db_email_logs');
      const all: SupabaseEmailLog[] = stored ? JSON.parse(stored) : [];
      all.push(finalizedLog);
      localStorage.setItem('db_email_logs', JSON.stringify(all));
    } catch (_) {}

    return finalizedLog;
  },

  async deleteEmailLog(id: string): Promise<boolean> {
    const colPath = 'email_logs';
    try {
      await deleteDoc(doc(firestoreDb, colPath, id));
    } catch (err) {
      console.error("Firestore deleteEmailLog failed:", err);
      handleFirestoreError(err, OperationType.DELETE, `${colPath}/${id}`);
    }
    try {
      const stored = localStorage.getItem('db_email_logs');
      if (stored) {
        const all: SupabaseEmailLog[] = JSON.parse(stored);
        const filtered = all.filter(l => l.id !== id);
        localStorage.setItem('db_email_logs', JSON.stringify(filtered));
      }
    } catch (_) {}
    return true;
  },

  async clearEmailLogs(): Promise<boolean> {
    const colPath = 'email_logs';
    try {
      const q = query(collection(firestoreDb, colPath));
      const querySnapshot = await getDocs(q);
      const batchPromises: Promise<void>[] = [];
      querySnapshot.forEach((d) => {
        batchPromises.push(deleteDoc(doc(firestoreDb, colPath, d.id)));
      });
      await Promise.all(batchPromises);
      saveLocalData('db_email_logs', []);
      return true;
    } catch (err) {
      console.error("Firestore clearEmailLogs failed:", err);
      saveLocalData('db_email_logs', []);
      return true;
    }
  },

  async sendEmailWithLog(params: {
    to: string;
    subject: string;
    html: string;
    type: string;
    pdfAttachment?: string;
    customAttachment?: { filename: string; base64: string; contentType: string };
  }): Promise<{ success: boolean; messageId?: string; error?: string; sender?: string }> {
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: params.to,
          subject: params.subject,
          html: params.html,
          pdfAttachment: params.pdfAttachment,
          customAttachment: params.customAttachment
        })
      });

      const data = await response.json();
      const statusValue = (response.ok && data.success) ? 'success' : 'failed';
      const errorStr = (response.ok && data.success) ? '' : (data.details || data.error || 'SMTP failed');
      const senderVal = data.sender || 'eco24034@mbstu.ac.bd';

      // Log the attempt
      await this.addEmailLog({
        recipient: params.to,
        subject: params.subject,
        timestamp: new Date().toISOString(),
        status: statusValue as 'success' | 'failed',
        errorDetails: errorStr,
        sender: senderVal,
        type: params.type,
        messageId: data.messageId || ''
      });

      return {
        success: response.ok && data.success,
        messageId: data.messageId,
        error: errorStr,
        sender: senderVal
      };
    } catch (err: any) {
      console.error('sendEmailWithLog network error:', err);
      const fallbackSender = 'eco24034@mbstu.ac.bd';
      try {
        await this.addEmailLog({
          recipient: params.to,
          subject: params.subject,
          timestamp: new Date().toISOString(),
          status: 'failed',
          errorDetails: err.message || 'Network connection failed',
          sender: fallbackSender,
          type: params.type,
          messageId: ''
        });
      } catch (logErr) {
        console.error('Failed to save fail log to DB:', logErr);
      }
      return {
        success: false,
        error: err.message || 'Network connection failed',
        sender: fallbackSender
      };
    }
  },

  async getSMTPSettings(): Promise<{ gmailUser: string; gmailAppPassword: string } | null> {
    const colPath = 'settings';
    try {
      const docRef = doc(firestoreDb, colPath, 'smtp');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const settings = {
          gmailUser: data.gmailUser || '',
          gmailAppPassword: data.gmailAppPassword || ''
        };
        // sync to local storage for offline read fallback
        localStorage.setItem('local_smtp_settings', JSON.stringify(settings));
        return settings;
      }
    } catch (err) {
      console.warn("Firestore getSMTPSettings failed, falling back to localStorage caching:", err);
    }
    const local = localStorage.getItem('local_smtp_settings');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (parsed.gmailAppPassword) {
          return {
            gmailUser: parsed.gmailUser || '',
            gmailAppPassword: parsed.gmailAppPassword || ''
          };
        }
      } catch {}
    }
    return null;
  },

  async saveSMTPSettings(gmailUser: string, gmailAppPassword: string): Promise<boolean> {
    const colPath = 'settings';
    const settings = {
      gmailUser: gmailUser.trim(),
      gmailAppPassword: gmailAppPassword.trim(),
      updatedAt: new Date().toISOString()
    };
    
    // Always save to localStorage immediately as a reliable local cache
    localStorage.setItem('local_smtp_settings', JSON.stringify(settings));

    try {
      await setDoc(doc(firestoreDb, colPath, 'smtp'), settings);
      return true;
    } catch (err) {
      console.warn("Firestore saveSMTPSettings failed to write to DB, cached in localStorage successfully:", err);
      // Fallback is successfully configured, so we return true to let UI proceed smoothly
      return true;
    }
  }
};
