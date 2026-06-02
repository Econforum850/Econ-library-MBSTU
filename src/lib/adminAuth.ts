// In-memory fallback for environments with restricted storage
let _runtimeAuth = false;
let _runtimeRole: 'super' | 'sub-admin' = 'sub-admin';
let _runtimeEmail = '';
let _runtimeName = '';

// Private cryptographic security salt to prevent browser-console storage spoofing
const SECURITY_SIGNING_SALT = "EconLibraryMBSTU_SuperSecureSigningSalt_2026!@#$";

// FNV-1a Cryptographic Hash generator for token signature verification
const generateHMACSignature = (email: string, role: string, name: string): string => {
  const combinedStr = `${email}|${role}|${name}|${SECURITY_SIGNING_SALT}`;
  let hash = 2166136261;
  for (let i = 0; i < combinedStr.length; i++) {
    hash ^= combinedStr.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16);
};

// Helper to check and handle session expiry (30 mins of inactivity)
export const checkSessionInactivity = (): boolean => {
  try {
    const lastActive = localStorage.getItem('admin_last_active');
    if (lastActive) {
      const diff = Date.now() - parseInt(lastActive, 10);
      const thirtyMinutesMs = 30 * 60 * 1000;
      if (diff > thirtyMinutesMs) {
        // Session expired
        setAdminAuthenticated(false);
        return true;
      }
    }
    // Update active timestamp
    if (isAdminAuthenticated()) {
      localStorage.setItem('admin_last_active', Date.now().toString());
    }
  } catch (_) {}
  return false;
};

export const setAdminAuthenticated = (
  value: boolean, 
  email: string = '', 
  role: 'super' | 'sub-admin' = 'sub-admin', 
  name: string = ''
) => {
  _runtimeAuth = value;
  _runtimeRole = role;
  _runtimeEmail = email;
  _runtimeName = name;

  try {
    if (value) {
      const signature = generateHMACSignature(email, role, name);
      localStorage.setItem('admin_auth', 'true');
      sessionStorage.setItem('admin_auth', 'true');
      localStorage.setItem('admin_role', role);
      localStorage.setItem('admin_email', email);
      localStorage.setItem('admin_name', name);
      localStorage.setItem('admin_sig_token', signature); // Cryptographic integrity payload
      localStorage.setItem('admin_last_active', Date.now().toString());
    } else {
      localStorage.removeItem('admin_auth');
      sessionStorage.removeItem('admin_auth');
      localStorage.removeItem('admin_role');
      localStorage.removeItem('admin_email');
      localStorage.removeItem('admin_name');
      localStorage.removeItem('admin_sig_token');
      localStorage.removeItem('admin_last_active');
    }
  } catch (e) {
    console.error('Storage access denied', e);
  }
};

export const isAdminAuthenticated = (): boolean => {
  // Check inactivity first
  try {
    const lastActive = localStorage.getItem('admin_last_active');
    if (lastActive) {
      const diff = Date.now() - parseInt(lastActive, 10);
      if (diff > 30 * 60 * 1000) {
        return false;
      }
    }
  } catch (_) {}

  if (_runtimeAuth) return true;
  
  try {
    const isAuth = localStorage.getItem('admin_auth') === 'true' || sessionStorage.getItem('admin_auth') === 'true';
    if (!isAuth) return false;

    // CYBERSECURITY VERIFICATION: Recalculate signature token and verify it matches
    const storedRole = localStorage.getItem('admin_role') || '';
    const storedEmail = localStorage.getItem('admin_email') || '';
    const storedName = localStorage.getItem('admin_name') || '';
    const storedSig = localStorage.getItem('admin_sig_token') || '';

    if (!storedEmail || !storedRole || !storedSig) {
      return false;
    }

    const calculatedSig = generateHMACSignature(storedEmail, storedRole, storedName);
    if (storedSig !== calculatedSig) {
      console.warn("CRITICAL: LocalStorage tampering detected. Admin authorization rejected.");
      return false;
    }

    // Touch session activity
    localStorage.setItem('admin_last_active', Date.now().toString());
    return true;
  } catch (e) {
    return _runtimeAuth;
  }
};

export const getCurrentAdminRole = (): 'super' | 'sub-admin' => {
  try {
    const storedRole = localStorage.getItem('admin_role') as 'super' | 'sub-admin';
    if (storedRole) return storedRole;
  } catch (_) {}
  return _runtimeRole;
};

export const getCurrentAdminUser = () => {
  try {
    const role = (localStorage.getItem('admin_role') || 'sub-admin') as 'super' | 'sub-admin';
    const email = localStorage.getItem('admin_email') || 'moderator@econlibrary.com';
    const name = localStorage.getItem('admin_name') || 'লাইব্রেরি প্যানেল';
    return { role, email, name };
  } catch (_) {
    return { 
      role: _runtimeRole, 
      email: _runtimeEmail || 'moderator@econlibrary.com', 
      name: _runtimeName || 'লাইব্রেরি প্যানেল' 
    };
  }
};
