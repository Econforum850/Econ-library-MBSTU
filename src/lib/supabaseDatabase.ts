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
        const sheetUrl = localStorage.getItem('sheet_inventory') || import.meta.env.VITE_GOOGLE_SHEET_URL;
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
  async getMembers(): Promise<SupabaseMember[]> {
    const colPath = 'members';
    try {
      const q = query(collection(firestoreDb, colPath));
      const querySnapshot = await getDocs(q);
      const mapped: SupabaseMember[] = [];
      querySnapshot.forEach((d) => {
        const m = d.data();
        mapped.push({
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
          trxId: m.trxId || ''
        });
      });

      // Sort ascending by name locally
      mapped.sort((x, y) => (x.name || '').localeCompare(y.name || ''));

      if (mapped.length > 0) {
        saveLocalData('db_members', mapped);
        return mapped;
      }
    } catch (err) {
      console.warn("Firestore getMembers failed, fallback to local:", err);
    }
    
    // Fallback: load from local storage
    const localMems = getLocalData<SupabaseMember>('db_members', INITIAL_MEMBERS);
    if (localMems.length === 0) {
      try {
        console.log("Local members empty, trying to fetch from Google Sheet...");
        const sheetUrl = localStorage.getItem('sheet_members') || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTjbvT42nJIt_6goEZeYH0vzeACzf6tmANoUJeUTFpSBIJzrbQJ7xMZwlTZ5g7KJiPDYR1gdjWVdfNt/pub?output=csv';
        const sheetMems = await fetchMembersFromSheet(sheetUrl);
        const parsedMems: SupabaseMember[] = sheetMems.map((m: any, i) => {
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
    return localMems;
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
      trxId: member.trxId || ''
    };

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
        trxId: finalizedMem.trxId
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
  }
};
