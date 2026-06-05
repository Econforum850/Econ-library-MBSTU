import Papa from 'papaparse';

export interface SheetBook {
  id: string;
  title: string;
  author: string;
  category: string;
  cover: string;
  bookId: string;
  shelfNo: string;
  status: 'available' | 'pre-order';
  price?: string;
  stock?: number;
  ebookUrl?: string;
  isbn?: string;
}

export interface SheetMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  joinDate: string;
  status: 'active' | 'inactive' | 'pending' | 'accepted' | 'rejected' | string;
  dues: number;
  photo?: string;
  address?: string;
  occupation?: string;
  password?: string;
}

export interface SheetDonor {
  id: string;
  name: string;
  type: 'Individual' | 'Organization';
  totalDonation: string;
  lastDonationDate: string;
  impact: string;
  description: string;
}

export interface SheetIssue {
  id: string;
  bookTitle: string;
  memberName: string;
  issueDate: string;
  dueDate: string;
  status: 'Active' | 'Returned' | 'Overdue';
}

/**
 * Converts a Google Drive sharing link to a direct download link
 */
export function getDirectDriveLink(url: string): string {
  if (!url) return '';
  
  // Format: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  const match = url.match(/[\/\=]([a-zA-Z0-9_-]{25,})[\/\&]?/);
  if (match && match[1]) {
    const fileId = match[1];
    // This is a common reliable format for Google Drive direct images
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }
  
  return url;
}

/**
 * Converts a Google Sheet sharing link or edit link to a CSV export link
 */
export function getCsvExportLink(url: string): string {
  if (!url) return '';
  
  // If it's already a pub?output=csv link, keep it
  if (url.includes('/pub?output=csv')) return url;
  
  // Match the spreadsheet ID
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    const sheetId = match[1];
    // Check if there's a gid (specific sheet tab)
    const gidMatch = url.match(/[#&]gid=([0-9]+)/);
    const gidPart = gidMatch ? `&gid=${gidMatch[1]}` : '';
    
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gidPart}`;
  }
  
  return url;
}

/**
 * Generic fetcher for any Google Sheet published as CSV
 */
export async function fetchSheetData<T>(sheetUrl: string, mapper: (row: any, index: number) => T): Promise<T[]> {
  try {
    const csvUrl = getCsvExportLink(sheetUrl);
    // Add cache-buster timestamp
    const separator = csvUrl.includes('?') ? '&' : '?';
    const cacheBusterUrl = `${csvUrl}${separator}t=${new Date().getTime()}`;
    
    const response = await fetch(cacheBusterUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }
    
    const csvContent = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        transformHeader: (header) => header.trim(),
        complete: (results) => {
          const data = results.data.map((row: any, index: number) => {
            // Robust key lookup: find keys like "name" even if they are "name," or "Name"
            const getVal = (possibleKeys: string[], defaultVal: any = '') => {
              const keys = Object.keys(row);
              for (const pk of possibleKeys) {
                // Exact match
                if (row[pk] !== undefined) return row[pk];
                // Case-insensitive, trimmed, and punctuation-agnostic match
                const pkNormalized = pk.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]/g, '');
                const foundKey = keys.find(k => k.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]/g, '') === pkNormalized);
                if (foundKey) return row[foundKey];
              }
              return defaultVal;
            };
            return mapper({...row, getVal}, index);
          });
          resolve(data);
        },
        error: (error: any) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    throw error;
  }
}

/**
 * Fetches and parses a Google Sheet published as CSV (Specific for Books)
 */
export async function fetchBooksFromSheet(sheetUrl: string): Promise<SheetBook[]> {
  return fetchSheetData<SheetBook>(sheetUrl, (row: any, index: number) => {
    const v = row.getVal;
    return {
      id: String(v(['id', 'bookId'], `book-${index}`)),
      title: String(v(['title', 'বইয়ের নাম', 'বই', 'Name'], '')),
      author: String(v(['author', 'লেখকের নাম', 'Author'], '')),
      category: String(v(['category', 'ক্যাটাগরি', 'Category'], 'সাধারণ')),
      cover: getDirectDriveLink(String(v(['cover', 'কভার ইমেজ', 'Cover', 'image'], ''))),
      bookId: String(v(['bookId', 'id', 'আইডি'], '')),
      shelfNo: String(v(['shelfNo', 'সেল্ফ নং', 'Shelf'], 'N/A')),
      status: String(v(['status', 'অবস্থা'], '')).toLowerCase().includes('available') || String(v(['status', 'অবস্থা'], '')).toLowerCase().includes('এভেইলবল') ? 'available' : 'pre-order',
      price: String(v(['price', 'মূল্য', 'Price'], '৳০')),
      stock: parseInt(v(['stock', 'ষ্টক', 'Stock'], '0'), 10),
      ebookUrl: String(v(['ebookUrl', 'e-book লিংক', 'link', 'Download'], '')),
    };
  });
}

/**
 * Fetches and parses a Google Sheet for Members
 */
export async function fetchMembersFromSheet(sheetUrl: string): Promise<SheetMember[]> {
  return fetchSheetData<SheetMember>(sheetUrl, (row: any, index: number) => {
    const v = row.getVal;
    return {
      id: String(v(['id', 'userId', 'আইডি', 'phone', 'ফোন'], `member-${index}`)).trim(),
      name: String(v(['name', 'নাম', 'Name'], '')).trim(),
      email: String(v(['email', 'ইমেইল', 'Email'], '')).trim(),
      phone: String(v(['phone', 'ফোন', 'Phone', 'মোবাইল', 'Mobile'], '')).trim(),
      role: String(v(['role', 'রোল', 'Role'], 'Member')).trim(),
      joinDate: String(v(['joinDate', 'যোগদানের তারিখ', 'JoinDate'], '')).trim(),
      status: String(v(['status', 'অবস্থা', 'Status'], 'pending')).trim().toLowerCase(),
      dues: parseFloat(v(['dues', 'বকেয়া', 'Dues'], '0')),
      photo: v(['photo', 'image', 'ছবি', 'Photo'], '') ? getDirectDriveLink(String(v(['photo', 'image', 'ছবি', 'Photo'], ''))) : undefined,
      address: String(v(['address', 'ঠিকানা', 'Address'], '')).trim(),
      occupation: String(v(['occupation', 'পেশা', 'Occupation'], '')).trim(),
      password: String(v(['password', 'পাসওয়ার্ড', 'Password'], '')).trim(),
    };
  });
}

/**
 * Fetches and parses a Google Sheet for Donors
 */
export async function fetchDonorsFromSheet(sheetUrl: string): Promise<SheetDonor[]> {
  return fetchSheetData<SheetDonor>(sheetUrl, (row: any, index: number) => {
    const v = row.getVal;
    return {
      id: String(v(['id', 'donorId'], `donor-${index}`)),
      name: String(v(['name', 'নাম', 'Name', 'দাতার নাম', 'Donor'], '')),
      type: String(v(['type', 'ধরন', 'Type'], '')).includes('Org') ? 'Organization' : 'Individual',
      totalDonation: String(v(['totalDonation', 'মোট দান', 'Total', 'Amount', 'পরিমাণ'], '৳০')),
      lastDonationDate: String(v(['lastDonationDate', 'শেষ দান', 'Date', 'তারিখ'], '')),
      impact: String(v(['impact', 'প্রভাব', 'Impact'], '')),
      description: String(v(['description', 'বিবরণ', 'Description'], '')),
    };
  });
}

export interface SheetIssue {
  id: string;
  bookTitle: string;
  memberName: string;
  issueDate: string;
  dueDate: string;
  status: 'Active' | 'Returned' | 'Overdue';
}

/**
 * Fetches and parses a Google Sheet for Issues/Loans
 */
export async function fetchIssuesFromSheet(sheetUrl: string): Promise<SheetIssue[]> {
  return fetchSheetData<SheetIssue>(sheetUrl, (row: any, index: number) => ({
    id: String(row.id || row.issueId || `issue-${index}`),
    bookTitle: String(row.bookTitle || row['বই'] || row['Book'] || ''),
    memberName: String(row.memberName || row['সদস্য'] || row['Member'] || ''),
    issueDate: String(row.issueDate || row['ইস্যু তারিখ'] || row['IssueDate'] || ''),
    dueDate: String(row.dueDate || row['ফেরত তারিখ'] || row['DueDate'] || ''),
    status: String(row.status || '').includes('Returned') ? 'Returned' : (String(row.status || '').includes('Overdue') ? 'Overdue' : 'Active'),
  }));
}

export interface SheetTransaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  date: string;
  status: string;
  note: string;
}

/**
 * Fetches and parses a Google Sheet for Finances
 */
export async function fetchFinancesFromSheet(sheetUrl: string): Promise<SheetTransaction[]> {
  return fetchSheetData<SheetTransaction>(sheetUrl, (row: any, index: number) => ({
    id: String(row.id || row.txId || `tx-${index}`),
    type: String(row.type || row['ধরন'] || row['Type'] || '').toLowerCase().includes('income') ? 'income' : 'expense',
    category: String(row.category || row['খাত'] || row['Category'] || ''),
    amount: parseFloat(row.amount || row['পরিমাণ'] || row['Amount'] || '0'),
    date: String(row.date || row['তারিখ'] || row['Date'] || ''),
    status: String(row.status || row['অবস্থা'] || row['Status'] || 'Completed'),
    note: String(row.note || row['টীকা'] || row['Note'] || ''),
  }));
}

/**
 * Login helper for members
 */
export async function loginMember(sheetUrl: string, identifier: string, password: string): Promise<SheetMember | null> {
  const members = await fetchMembersFromSheet(sheetUrl);
  if (!members || members.length === 0) return null;

  const id = identifier.trim();
  const pass = password.trim();
  const idNormalized = id.replace(/\D/g, '');

  const user = members.find(m => {
    const mId = String(m.id || '').trim();
    const mName = String(m.name || '').trim().toLowerCase();
    const mEmail = String(m.email || '').trim().toLowerCase();
    const mPhone = String(m.phone || '').trim();
    const mPass = String(m.password || '').trim();
    const mStatus = String(m.status || '').toLowerCase();
    
    const idLower = id.toLowerCase();
    const mPhoneNormalized = mPhone.replace(/\D/g, '');

    // Check for exact match or phone number variations
    const phoneMatch = mPhoneNormalized !== '' && idNormalized !== '' && (
      mPhoneNormalized === idNormalized || 
      mPhoneNormalized.endsWith(idNormalized) || 
      idNormalized.endsWith(mPhoneNormalized)
    );

    const isMatch = (mId === id || mEmail === idLower || mName === idLower || phoneMatch) && mPass === pass && mStatus === 'accepted';
    
    if ((mId === id || mEmail === idLower || mName === idLower || phoneMatch) && mPass === pass) {
       console.log('User found with matching password, status:', mStatus);
    }

    return isMatch;
  });
  
  return user || null;
}

/**
 * Fetches issues for a specific member
 */
export async function fetchIssuesForMember(sheetUrl: string, memberNameOrId: string): Promise<SheetIssue[]> {
  const allIssues = await fetchIssuesFromSheet(sheetUrl);
  return allIssues.filter(i => 
    i.memberName === memberNameOrId || 
    i.id.includes(memberNameOrId) // Some users might store ID in member field
  );
}

/**
 * Submits data to a Google Apps Script Web App
 */
export async function submitToGoogleScript(scriptUrl: string, data: any): Promise<{ success: boolean; message: string }> {
  try {
    console.log('Submitting to Google Script:', scriptUrl, data);
    
    // We use a simpler fetch that might succeed with CORS if the user has it enabled,
    // otherwise it falls back to a mode that at least sends the data.
    const formData = new URLSearchParams();
    Object.keys(data).forEach(key => {
      formData.append(key, typeof data[key] === 'object' ? JSON.stringify(data[key]) : String(data[key]));
    });

    // Try a regular fetch first, if it fails due to CORS, the 'error' will be caught
    // but the request might have actually reached the server.
    await fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors', // Essential for Google Apps Script to bypass CORS preflight
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });
    
    return { success: true, message: 'বইটি যুক্ত করার অনুরোধ পাঠানো হয়েছে।' };
  } catch (error) {
    console.error('Submission error:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}
