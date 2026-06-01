
// In-memory fallback for environments with restricted storage
let _runtimeAuth = false;
let _runtimeRole: 'super' | 'sub-admin' = 'sub-admin';
let _runtimeEmail = '';
let _runtimeName = '';

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
      localStorage.setItem('admin_auth', 'true');
      sessionStorage.setItem('admin_auth', 'true');
      localStorage.setItem('admin_role', role);
      localStorage.setItem('admin_email', email);
      localStorage.setItem('admin_name', name);
      localStorage.setItem('admin_last_active', Date.now().toString());
    } else {
      localStorage.removeItem('admin_auth');
      sessionStorage.removeItem('admin_auth');
      localStorage.removeItem('admin_role');
      localStorage.removeItem('admin_email');
      localStorage.removeItem('admin_name');
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
    if (isAuth) {
      // Touch session activity
      localStorage.setItem('admin_last_active', Date.now().toString());
    }
    return isAuth;
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

