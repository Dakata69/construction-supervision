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
      console.log('Auth state updated:', { isAdmin: state.isAdmin, role: state.role, canEdit: state.canEdit }); // Debug log
    },
    logout(state) {
      state.user = null;
      state.isAdmin = false;
      state.role = 'privileged';
      state.canEdit = false;
      state.authInitialized = true;
    }
  }
});
export const { setUser, logout } = authSlice.actions;
export default authSlice.reducer;
