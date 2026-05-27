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
// PREFILLED OFFLINE FALLBACK DATA
// ==========================================

const INITIAL_BOOKS: SupabaseBook[] = [];
const INITIAL_MEMBERS: SupabaseMember[] = [];
const INITIAL_DONORS: SupabaseDonor[] = [];
const INITIAL_ISSUES: SupabaseIssue[] = [];
const INITIAL_TRANSACTIONS: SupabaseTransaction[] = [];
const INITIAL_EVENTS: SupabaseEvent[] = [];
const INITIAL_ORDERS: SupabaseOrder[] = [];

// Load fallback databases helper
const getLocalData = <T>(key: string, initial: T[]): T[] => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }
  try {
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      const hasMock = parsed.some((item: any) => 
        (item && (
          item.id === 'M-101' || item.id === 'M-102' || item.id === 'M-103' ||
          item.id === 'b-1' || item.id === 'b-2' ||
          item.id === 'd-1' || item.id === 'd-2' ||
          item.id === 'i-1' ||
          item.id === 't-1' ||
          item.id === 'e-1' ||
          item.id === 'ORD-1234'
        ))
      );
      if (hasMock) {
        localStorage.setItem(key, JSON.stringify([]));
        return [];
      }
    }
  } catch (e) {
    console.warn("Clean legacy local data error:", e);
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
  ordersTableMissing: false,

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
      if (data) {
        const mapped = data.map(b => ({
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
        saveLocalData('db_books', mapped);
        return mapped;
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
      if (data) {
        const mapped = data.map(m => ({
          id: String(m.id),
          name: m.name || '',
          email: m.email || '',
          phone: m.phone || '',
          role: m.role || 'Member',
          joinDate: m.joinDate || m.join_date || m.joinDate || new Date().toLocaleDateString('bn-BD'),
          status: m.status || 'pending',
          dues: parseFloat(m.dues ?? '0'),
          photo: m.photo || '',
          address: m.address || '',
          occupation: m.occupation || '',
          password: m.password || ''
        }));
        saveLocalData('db_members', mapped);
        return mapped;
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

      let exists = false;
      if (isEdit) {
        try {
          const { data: existing } = await supabase.from('members').select('id').eq('id', finalId).maybeSingle();
          if (existing) exists = true;
        } catch (singleErr) {
          console.warn('Checking single member failed:', singleErr);
        }
      }

      if (isEdit && exists) {
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
      if (data) {
        const mapped = data.map(d => ({
          id: String(d.id),
          name: d.name || '',
          type: d.type || 'Individual',
          totalDonation: d.totalDonation || d.total_donation || '৳০',
          lastDonationDate: d.lastDonationDate || d.last_donation_date || '',
          impact: d.impact || '',
          description: d.description || ''
        }));
        saveLocalData('db_donors', mapped);
        return mapped;
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
      if (data) {
        const mapped = data.map(i => ({
          id: String(i.id),
          bookTitle: i.bookTitle || i.book_title || '',
          memberName: i.memberName || i.member_name || '',
          issueDate: i.issueDate || i.issue_date || '',
          dueDate: i.dueDate || i.due_date || '',
          status: i.status || 'Active'
        }));
        saveLocalData('db_issues', mapped);
        return mapped;
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
      if (data) {
        const mapped = data.map(t => ({
          id: String(t.id),
          type: t.type || 'income',
          category: t.category || '',
          amount: parseFloat(t.amount ?? '0'),
          date: t.date || '',
          status: t.status || 'Completed',
          note: t.note || ''
        }));
        saveLocalData('db_finances', mapped);
        return mapped;
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
  },

  // --- EVENTS SERVICES ---
  async getEvents(): Promise<SupabaseEvent[]> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      if (data) {
        const mapped = data.map(e => ({
          id: String(e.id),
          title: e.title || '',
          date: e.date || '',
          time: e.time || '',
          location: e.location || '',
          description: e.description || '',
          image: e.image || '',
          fbLink: e.fb_link || e.fbLink || ''
        }));
        saveLocalData('db_events', mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('Supabase getEvents failed, loading from local:', err);
    }
    return getLocalData<SupabaseEvent>('db_events', INITIAL_EVENTS);
  },

  async saveEvent(event: Partial<SupabaseEvent>): Promise<SupabaseEvent> {
    const isEdit = !!event.id;
    const finalId = event.id || `e-${Date.now()}`;
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
        fb_link: finalizedEvent.fbLink
      };

      if (isEdit) {
        const numericId = parseInt(finalId);
        if (!isNaN(numericId)) {
          await supabase.from('events').update(dbPayload).eq('id', numericId);
        } else {
          await supabase.from('events').update(dbPayload).eq('id', finalId);
        }
      } else {
        await supabase.from('events').insert([dbPayload]);
      }
    } catch (err) {
      console.warn('Supabase saveEvent failed, applying locally:', err);
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
    try {
      const numericId = parseInt(id);
      if (!isNaN(numericId)) {
        await supabase.from('events').delete().eq('id', numericId);
      } else {
        await supabase.from('events').delete().eq('id', id);
      }
    } catch (err) {
      console.warn('Supabase deleteEvent failed, applying locally:', err);
    }

    const local = getLocalData<SupabaseEvent>('db_events', INITIAL_EVENTS);
    const filtered = local.filter(e => e.id !== id);
    saveLocalData('db_events', filtered);
    return true;
  },

  // --- ORDERS SERVICES ---
  async getOrders(): Promise<SupabaseOrder[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;
      if (data) {
        db.ordersTableMissing = false;
        const mapped = data.map(o => ({
          id: String(o.id),
          memberId: o.member_id || o.memberId || '',
          customerName: o.customer_name || o.customerName || '',
          customerEmail: o.customer_email || o.customerEmail || '',
          customerPhone: o.customer_phone || o.customerPhone || '',
          address: o.address || '',
          date: o.date || '',
          total: parseFloat(o.total ?? '0'),
          items: o.items || '',
          status: o.status || 'Pending'
        }));
        saveLocalData('db_orders', mapped);
        return mapped;
      }
    } catch (err: any) {
      console.warn('Supabase getOrders failed, loading from local:', err);
      if (err && (String(err.message || '').includes('does not exist') || String(err.code) === '42P01')) {
        db.ordersTableMissing = true;
      }
    }
    return getLocalData<SupabaseOrder>('db_orders', INITIAL_ORDERS);
  },

  async saveOrder(order: Partial<SupabaseOrder>): Promise<SupabaseOrder> {
    const isEdit = !!order.id;
    const finalId = order.id || `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
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

    let supabaseId = finalId;

    try {
      let verifiedMemberId: string | null = null;
      if (finalizedOrder.memberId && finalizedOrder.memberId !== 'M-GUEST') {
        try {
          const { data: memberExists } = await supabase.from('members').select('id').eq('id', finalizedOrder.memberId).maybeSingle();
          if (memberExists) {
            verifiedMemberId = finalizedOrder.memberId;
          } else {
            const numericId = parseInt(finalizedOrder.memberId);
            if (!isNaN(numericId)) {
              const { data: numExists } = await supabase.from('members').select('id').eq('id', numericId).maybeSingle();
              if (numExists) verifiedMemberId = String(numericId);
            }
          }
        } catch (e) {
          console.warn('Checking member existence failed:', e);
        }
      }

      const dbPayload = {
        member_id: verifiedMemberId,
        customer_name: finalizedOrder.customerName,
        customer_email: finalizedOrder.customerEmail,
        customer_phone: finalizedOrder.customerPhone,
        address: finalizedOrder.address,
        date: finalizedOrder.date,
        total: finalizedOrder.total,
        items: finalizedOrder.items,
        status: finalizedOrder.status
      };

      if (isEdit) {
        const numericId = parseInt(finalId);
        let error;
        if (!isNaN(numericId)) {
          const res = await supabase.from('orders').update(dbPayload).eq('id', numericId);
          error = res.error;
        } else {
          const res = await supabase.from('orders').update(dbPayload).eq('id', finalId);
          error = res.error;
        }
        if (error) throw error;
      } else {
        // Try inserting WITHOUT ID first in case the database column is auto-increment bigint
        const { data, error } = await supabase.from('orders').insert([dbPayload]).select();
        if (error) {
          console.warn('Insert without id failed, falling back to inserting with string id:', error);
          const { error: fallbackError } = await supabase.from('orders').insert([{ id: finalId, ...dbPayload }]);
          if (fallbackError) throw fallbackError;
        } else if (data && data.length > 0) {
          supabaseId = String(data[0].id);
        }
      }
      finalizedOrder.id = supabaseId;
    } catch (err) {
      console.warn('Supabase saveOrder failed, applying locally:', err);
    }

    const local = getLocalData<SupabaseOrder>('db_orders', INITIAL_ORDERS);
    const index = local.findIndex(o => o.id === finalizedOrder.id || o.id === finalId);
    if (index > -1) {
      local[index] = finalizedOrder;
    } else {
      local.push(finalizedOrder);
    }
    saveLocalData('db_orders', local);
    return finalizedOrder;
  },

  async deleteOrder(id: string): Promise<boolean> {
    try {
      const numericId = parseInt(id);
      if (!isNaN(numericId)) {
        await supabase.from('orders').delete().eq('id', numericId);
      } else {
        await supabase.from('orders').delete().eq('id', id);
      }
    } catch (err) {
      console.warn('Supabase deleteOrder failed, applying locally:', err);
    }

    const local = getLocalData<SupabaseOrder>('db_orders', INITIAL_ORDERS);
    const filtered = local.filter(o => o.id !== id);
    saveLocalData('db_orders', filtered);
    return true;
  }
};
