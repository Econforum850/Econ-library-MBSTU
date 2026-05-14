
// In-memory fallback for environments with restricted storage
let _runtimeAuth = false;

export const setAdminAuthenticated = (value: boolean) => {
  _runtimeAuth = value;
  try {
    if (value) {
      localStorage.setItem('admin_auth', 'true');
      sessionStorage.setItem('admin_auth', 'true');
    } else {
      localStorage.removeItem('admin_auth');
      sessionStorage.removeItem('admin_auth');
    }
  } catch (e) {
    console.error('Storage access denied', e);
  }
};

export const isAdminAuthenticated = (): boolean => {
  if (_runtimeAuth) return true;
  
  try {
    return localStorage.getItem('admin_auth') === 'true' || sessionStorage.getItem('admin_auth') === 'true';
  } catch (e) {
    return _runtimeAuth;
  }
};
