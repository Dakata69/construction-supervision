// frontend/src/store/authSlice.ts
import { createSlice } from '@reduxjs/toolkit';

interface AuthState {
  user: any;
  isAdmin: boolean;
  role: string;
  canEdit: boolean;
  authInitialized: boolean;
}

const initialState: AuthState = {
  user: null,
  isAdmin: false,
  role: 'privileged',
  canEdit: false,
  authInitialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action) {
      console.log('setUser payload:', action.payload); // Debug log
      state.user = action.payload;
      state.isAdmin = !!action.payload?.is_staff;
      state.role = action.payload?.role || 'privileged';
      // Can edit only if admin role or is_staff
      state.canEdit = state.isAdmin || state.role === 'admin';
      state.authInitialized = true;
      
      // Persist user data to localStorage for recovery
      try {
        localStorage.setItem('cached_user', JSON.stringify(action.payload));
      } catch (e) {
        console.error('Failed to cache user data:', e);
      }
      
      console.log('Auth state updated:', { isAdmin: state.isAdmin, role: state.role, canEdit: state.canEdit }); // Debug log
    },
    logout(state) {
      state.user = null;
      state.isAdmin = false;
      state.role = 'privileged';
      state.canEdit = false;
      state.authInitialized = true;
      
      // Clear cached user data
      try {
        localStorage.removeItem('cached_user');
      } catch (e) {
        console.error('Failed to clear cached user:', e);
      }
    },
    initializeAuth(state) {
      // Mark auth as initialized without changing user state
      state.authInitialized = true;
      
      // If no user is set, try to restore from cache
      if (!state.user) {
        try {
          const cached = localStorage.getItem('cached_user');
          if (cached) {
            const userData = JSON.parse(cached);
            state.user = userData;
            state.isAdmin = !!userData?.is_staff;
            state.role = userData?.role || 'privileged';
            state.canEdit = state.isAdmin || state.role === 'admin';
            console.log('Restored user from cache:', userData);
          }
        } catch (e) {
          console.error('Failed to restore user from cache:', e);
        }
      }
    }
  }
});
export const { setUser, logout, initializeAuth } = authSlice.actions;
export default authSlice.reducer;
