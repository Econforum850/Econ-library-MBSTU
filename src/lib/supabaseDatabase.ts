import { supabase } from '../supabaseClient';

// ==========================================
// CENTRAL SUPABASE DATA TYPES
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
  status: 'Active' | 'Returned' | 'Overdue';
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

// ==========================================
// PREFILLED OFFLINE FALLBACK DATA
// ==========================================

const INITIAL_BOOKS: SupabaseBook[] = [
  { id: 'b-1', title: 'গীতাঞ্জলি', author: 'রবীন্দ্রনাথ ঠাকুর', category: 'কাব্যগ্রন্থ', cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400', bookId: 'R-101', shelfNo: 'A-১', status: 'available', price: '৳১৫০', stock: 5, isEBook: false },
  { id: 'b-2', title: 'চরিত্রহীন', author: 'শরৎচন্দ্র চট্টোপাধ্যায়', category: 'উপন্যাস', cover: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400', bookId: 'S-202', shelfNo: 'A-২', status: 'available', price: '৳২০০', stock: 3, isEBook: false },
  { id: 'b-3', title: 'অগ্নিবীণা', author: 'কাজী নজরুল ইসলাম', category: 'কাব্যগ্রন্থ', cover: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=400', bookId: 'K-303', shelfNo: 'B-১', status: 'available', price: '৳১২০', stock: 4, isEBook: false },
  { id: 'b-4', title: 'সঞ্চয়িতা', author: 'রবীন্দ্রনাথ ঠাকুর', category: 'কাব্যগ্রন্থ', cover: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400', bookId: 'R-102', shelfNo: 'A-১', status: 'available', price: '৳২৫০', stock: 2, isEBook: true, ebookUrl: 'https://pdf.example.com/sanchayita' },
  { id: 'b-5', title: 'হিমু সমগ্র', author: 'হুমায়ূন আহমেদ', category: 'উপন্যাস', cover: 'https://images.unsplash.com/photo-1618666012174-83b441c0bc76?auto=format&fit=crop&q=80&w=400', bookId: 'H-401', shelfNo: 'C-১', status: 'available', price: '৳৩০০', stock: 6, isEBook: false }
];

const INITIAL_MEMBERS: SupabaseMember[] = [
  { id: 'M-101', name: 'Tanvir Ahmed', email: 'tanvir@example.com', phone: '01712000000', role: 'Premium', joinDate: '১২ মে ২০২৪', status: 'accepted', dues: 0, password: 'password123', occupation: 'ছাত্র', address: 'পানধোয়া, সাভার' },
  { id: 'M-102', name: 'Alif Khan', email: 'alif@example.com', phone: '01854000000', role: 'Basic', joinDate: '১৫ মে ২০২৪', status: 'accepted', dues: 0, password: 'password123', occupation: 'সফটওয়্যার ইঞ্জিনিয়ার', address: 'ঢাকা' },
  { id: 'M-103', name: 'Sabbir Hossain', email: 'sabbir@example.com', phone: '01923000000', role: 'Premium', joinDate: '০১ এপ্রিল ২০২৪', status: 'pending', dues: 50, password: 'password123', occupation: 'শিক্ষক', address: 'পানধোয়া' }
];

const INITIAL_DONORS: SupabaseDonor[] = [
  { id: 'd-1', name: 'প্রফেসর ড. সৈয়দ কামরুল আহসান টিটু', type: 'Individual', totalDonation: '৳১০,০০০', lastDonationDate: '১২ মে, ২০২৬', impact: '২৫টি নতুন বই উপহার', description: 'জাহাঙ্গীরনগর বিশ্ববিদ্যালয় ক্যাম্পাস' },
  { id: 'd-2', name: 'আব্দুল হাই মো: তারক', type: 'Individual', totalDonation: '৳৫,০০০', lastDonationDate: '১০ মে, ২০২৬', impact: 'বুকশেলফ নির্মাণ', description: 'পানধোয়া' },
  { id: 'd-3', name: 'আবু বকর মোসাদ্দ তাহের', type: 'Individual', totalDonation: '৳১২,০০০', lastDonationDate: '০৫ মে, ২০২৬', impact: 'আইটি ডেস্ক সেটআপ', description: 'পানধোয়া গ্রীন সিটি' },
  { id: 'd-4', name: 'পানধোয়া যুব সমিতি', type: 'Organization', totalDonation: '৳২০,০০০', lastDonationDate: '০১ মে, ২০২৬', impact: 'সাধারণ সংস্কার তহবিল', description: 'পানধোয়া সঙ্ঘ' }
];

const INITIAL_ISSUES: SupabaseIssue[] = [
  { id: 'i-1', bookTitle: 'গীতাঞ্জলি', memberName: 'Tanvir Ahmed', issueDate: '১২ মে ২০২৪', dueDate: '২৬ মে ২০২৪', status: 'Returned' },
  { id: 'i-2', bookTitle: 'চরিত্রহীন', memberName: 'Alif Khan', issueDate: '১৫ মে ২০২৪', dueDate: '২৯ মে ২০২৪', status: 'Active' },
  { id: 'i-3', bookTitle: 'হিমু সমগ্র', memberName: 'Sabbir Hossain', issueDate: '১০ মে ২০২৪', dueDate: '২৪ মে ২০২৪', status: 'Overdue' }
];

const INITIAL_TRANSACTIONS: SupabaseTransaction[] = [
  { id: 't-1', type: 'income', category: 'আউটডোর মেম্বার সাবস্ক্রিপশন', amount: 1500, date: '১২ মে, ২০২৬', status: 'Completed', note: 'নতুন ৩ সদস্য অন্তর্ভুক্তি' },
  { id: 't-2', type: 'income', category: 'অনুদান', amount: 5000, date: '১০ মে, ২০২৬', status: 'Completed', note: 'টিটু স্যারের অনুদান' },
  { id: 't-3', type: 'expense', category: 'নতুন বই ক্রয়', amount: 2400, date: '০৮ মে, ২০২৬', status: 'Completed', note: 'রকমারি বুক পার্চেজ' },
  { id: 't-4', type: 'expense', category: 'বিদ্যুৎ বিল', amount: 850, date: '০৫ মে, ২০২৬', status: 'Completed', note: 'লাইব্রেরি কক্ষ কারেন্ট বিল' }
];

// Load fallback databases helper
const getLocalData = <T>(key: string, initial: T[]): T[] => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(data);
};

const saveLocalData = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// ==========================================
// UNIFIED DATABASE SERVICES
// ==========================================

export const db = {
  // --- HEALTH CHECK ---
  async isSupabaseConnected(): Promise<boolean> {
    try {
      const { data, error } = await supabase.from('books').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  },

  // --- BOOKS SERVICES ---
  async getBooks(): Promise<SupabaseBook[]> {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      if (data && data.length > 0) {
        return data.map(b => ({
          id: String(b.id),
          title: b.title || '',
          author: b.author || '',
          category: b.category || '',
          cover: b.cover || '',
          bookId: b.bookId || '',
          shelfNo: b.shelfNo || b.shelf_no || 'N/A',
          status: b.status || 'available',
          price: b.price || '৳০',
          stock: b.stock || 1,
          isEBook: b.isEBook ?? b.is_ebook ?? false,
          ebookUrl: b.ebookUrl || b.ebook_url || ''
        }));
      }
    } catch (err) {
      console.warn('Supabase getBooks failed, loading from local:', err);
    }
    return getLocalData<SupabaseBook>('db_books', INITIAL_BOOKS);
  },

  async saveBook(book: Partial<SupabaseBook>): Promise<SupabaseBook> {
    const isEdit = !!book.id;
    const finalId = book.id || `b-${Date.now()}`;
    const finalizedBook: SupabaseBook = {
      id: finalId,
      title: book.title || 'শিরোনামহীন',
      author: book.author || 'অজ্ঞাত লেখক',
      category: book.category || 'সাধারণ',
      cover: book.cover || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400',
      bookId: book.bookId || `BK-${Math.floor(100+Math.random()*900)}`,
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

      if (isEdit) {
        // Double check numerical ID representation for auto-identity fields
        const numericId = parseInt(finalId);
        if (!isNaN(numericId)) {
          const { error } = await supabase.from('books').update(dbPayload).eq('id', numericId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('books').update(dbPayload).eq('id', finalId);
          if (error) throw error;
        }
      } else {
        const { error } = await supabase.from('books').insert([dbPayload]);
        if (error) throw error;
      }
    } catch (err) {
      console.warn('Supabase saveBook failed, applying locally:', err);
    }

    // Always keep local mirror updated
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
    try {
      const numericId = parseInt(id);
      if (!isNaN(numericId)) {
        const { error } = await supabase.from('books').delete().eq('id', numericId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('books').delete().eq('id', id);
        if (error) throw error;
      }
    } catch (err) {
      console.warn('Supabase deleteBook failed, applying locally:', err);
    }

    const local = getLocalData<SupabaseBook>('db_books', INITIAL_BOOKS);
    const filtered = local.filter(b => b.id !== id);
    saveLocalData('db_books', filtered);
    return true;
  },

  // --- MEMBERS SERVICES ---
  async getMembers(): Promise<SupabaseMember[]> {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      if (data && data.length > 0) {
        return data.map(m => ({
          id: String(m.id),
          name: m.name || '',
          email: m.email || '',
          phone: m.phone || '',
          role: m.role || 'Member',
          joinDate: m.joinDate || m.join_date || new Date().toLocaleDateString('bn-BD'),
          status: m.status || 'pending',
          dues: parseFloat(m.dues ?? '0'),
          photo: m.photo || '',
          address: m.address || '',
          occupation: m.occupation || '',
          password: m.password || ''
        }));
      }
    } catch (err) {
      console.warn('Supabase getMembers failed, loading from local:', err);
    }
    return getLocalData<SupabaseMember>('db_members', INITIAL_MEMBERS);
  },

  async saveMember(member: Partial<SupabaseMember>): Promise<SupabaseMember> {
    const isEdit = !!member.id;
    const finalId = member.id || `M-${Math.floor(100+Math.random()*900)}`;
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
      password: member.password || 'password123'
    };

    try {
      const dbPayload = {
        name: finalizedMem.name,
        email: finalizedMem.email,
        phone: finalizedMem.phone,
        role: finalizedMem.role,
        join_date: finalizedMem.joinDate,
        status: finalizedMem.status,
        dues: finalizedMem.dues,
        photo: finalizedMem.photo,
        address: finalizedMem.address,
        occupation: finalizedMem.occupation,
        password: finalizedMem.password
      };

      if (isEdit) {
        const { error } = await supabase.from('members').update(dbPayload).eq('id', finalId);
        if (error) {
          const numericId = parseInt(finalId);
          if (!isNaN(numericId)) {
            await supabase.from('members').update(dbPayload).eq('id', numericId);
          } else {
            throw error;
          }
        }
      } else {
        const { error } = await supabase.from('members').insert([{ id: finalId, ...dbPayload }]);
        if (error) throw error;
      }
    } catch (err) {
      console.warn('Supabase saveMember failed, applying locally:', err);
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
    try {
      const { error } = await supabase.from('members').delete().eq('id', id);
      if (error) {
        const numericId = parseInt(id);
        if (!isNaN(numericId)) {
          await supabase.from('members').delete().eq('id', numericId);
        } else {
          throw error;
        }
      }
    } catch (err) {
      console.warn('Supabase deleteMember failed, applying locally:', err);
    }

    const local = getLocalData<SupabaseMember>('db_members', INITIAL_MEMBERS);
    const filtered = local.filter(m => m.id !== id);
    saveLocalData('db_members', filtered);
    return true;
  },

  // --- DONORS SERVICES ---
  async getDonors(): Promise<SupabaseDonor[]> {
    try {
      const { data, error } = await supabase
        .from('donors')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      if (data && data.length > 0) {
        return data.map(d => ({
          id: String(d.id),
          name: d.name || '',
          type: d.type || 'Individual',
          totalDonation: d.totalDonation || d.total_donation || '৳০',
          lastDonationDate: d.lastDonationDate || d.last_donation_date || '',
          impact: d.impact || '',
          description: d.description || ''
        }));
      }
    } catch (err) {
      console.warn('Supabase getDonors failed, loading from local:', err);
    }
    return getLocalData<SupabaseDonor>('db_donors', INITIAL_DONORS);
  },

  async saveDonor(donor: Partial<SupabaseDonor>): Promise<SupabaseDonor> {
    const isEdit = !!donor.id;
    const finalId = donor.id || `d-${Date.now()}`;
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
        total_donation: finalizedDonor.totalDonation,
        last_donation_date: finalizedDonor.lastDonationDate,
        impact: finalizedDonor.impact,
        description: finalizedDonor.description
      };

      if (isEdit) {
        const numericId = parseInt(finalId);
        if (!isNaN(numericId)) {
          const { error } = await supabase.from('donors').update(dbPayload).eq('id', numericId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('donors').update(dbPayload).eq('id', finalId);
          if (error) throw error;
        }
      } else {
        const { error } = await supabase.from('donors').insert([dbPayload]);
        if (error) throw error;
      }
    } catch (err) {
      console.warn('Supabase saveDonor failed, applying locally:', err);
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
    try {
      const numericId = parseInt(id);
      if (!isNaN(numericId)) {
        await supabase.from('donors').delete().eq('id', numericId);
      } else {
        await supabase.from('donors').delete().eq('id', id);
      }
    } catch (err) {
      console.warn('Supabase deleteDonor failed, applying locally:', err);
    }

    const local = getLocalData<SupabaseDonor>('db_donors', INITIAL_DONORS);
    const filtered = local.filter(d => d.id !== id);
    saveLocalData('db_donors', filtered);
    return true;
  },

  // --- ISSUES / LOANS SERVICES ---
  async getIssues(): Promise<SupabaseIssue[]> {
    try {
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      if (data && data.length > 0) {
        return data.map(i => ({
          id: String(i.id),
          bookTitle: i.bookTitle || i.book_title || '',
          memberName: i.memberName || i.member_name || '',
          issueDate: i.issueDate || i.issue_date || '',
          dueDate: i.dueDate || i.due_date || '',
          status: i.status || 'Active'
        }));
      }
    } catch (err) {
      console.warn('Supabase getIssues failed, loading from local:', err);
    }
    return getLocalData<SupabaseIssue>('db_issues', INITIAL_ISSUES);
  },

  async saveIssue(issue: Partial<SupabaseIssue>): Promise<SupabaseIssue> {
    const isEdit = !!issue.id;
    const finalId = issue.id || `i-${Date.now()}`;
    const finalizedIssue: SupabaseIssue = {
      id: finalId,
      bookTitle: issue.bookTitle || '',
      memberName: issue.memberName || '',
      issueDate: issue.issueDate || new Date().toLocaleDateString('bn-BD'),
      dueDate: issue.dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('bn-BD'),
      status: issue.status || 'Active'
    };

    try {
      const dbPayload = {
        book_title: finalizedIssue.bookTitle,
        member_name: finalizedIssue.memberName,
        issue_date: finalizedIssue.issueDate,
        due_date: finalizedIssue.dueDate,
        status: finalizedIssue.status
      };

      if (isEdit) {
        const numericId = parseInt(finalId);
        if (!isNaN(numericId)) {
          await supabase.from('issues').update(dbPayload).eq('id', numericId);
        } else {
          await supabase.from('issues').update(dbPayload).eq('id', finalId);
        }
      } else {
        await supabase.from('issues').insert([dbPayload]);
      }
    } catch (err) {
      console.warn('Supabase saveIssue failed, applying locally:', err);
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
    try {
      const numericId = parseInt(id);
      if (!isNaN(numericId)) {
        await supabase.from('issues').delete().eq('id', numericId);
      } else {
        await supabase.from('issues').delete().eq('id', id);
      }
    } catch (err) {
      console.warn('Supabase deleteIssue failed, applying locally:', err);
    }

    const local = getLocalData<SupabaseIssue>('db_issues', INITIAL_ISSUES);
    const filtered = local.filter(i => i.id !== id);
    saveLocalData('db_issues', filtered);
    return true;
  },

  // --- FINANCES SERVICES ---
  async getTransactions(): Promise<SupabaseTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('finances')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      if (data && data.length > 0) {
        return data.map(t => ({
          id: String(t.id),
          type: t.type || 'income',
          category: t.category || '',
          amount: parseFloat(t.amount ?? '0'),
          date: t.date || '',
          status: t.status || 'Completed',
          note: t.note || ''
        }));
      }
    } catch (err) {
      console.warn('Supabase getTransactions failed, loading from local:', err);
    }
    return getLocalData<SupabaseTransaction>('db_finances', INITIAL_TRANSACTIONS);
  },

  async saveTransaction(tx: Partial<SupabaseTransaction>): Promise<SupabaseTransaction> {
    const isEdit = !!tx.id;
    const finalId = tx.id || `t-${Date.now()}`;
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

      if (isEdit) {
        const numericId = parseInt(finalId);
        if (!isNaN(numericId)) {
          await supabase.from('finances').update(dbPayload).eq('id', numericId);
        } else {
          await supabase.from('finances').update(dbPayload).eq('id', finalId);
        }
      } else {
        await supabase.from('finances').insert([dbPayload]);
      }
    } catch (err) {
      console.warn('Supabase saveTransaction failed, applying locally:', err);
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
    try {
      const numericId = parseInt(id);
      if (!isNaN(numericId)) {
        await supabase.from('finances').delete().eq('id', numericId);
      } else {
        await supabase.from('finances').delete().eq('id', id);
      }
    } catch (err) {
      console.warn('Supabase deleteTransaction failed, applying locally:', err);
    }

    const local = getLocalData<SupabaseTransaction>('db_finances', INITIAL_TRANSACTIONS);
    const filtered = local.filter(t => t.id !== id);
    saveLocalData('db_finances', filtered);
    return true;
  }
};
