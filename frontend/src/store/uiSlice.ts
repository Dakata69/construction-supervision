// frontend/src/store/uiSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  sidebarOpen: boolean;
  backgroundEnabled: boolean;
  dayNightCycleEnabled: boolean;
  textDimOpacity: number; // 0.6 - 1 range
}

const initialState: UiState = {
  sidebarOpen: true,
  backgroundEnabled: (() => {
    try {
      const stored = localStorage.getItem('background_enabled');
      return stored ? stored === 'true' : true;
    } catch {
      return true;
    }
  })(),
  dayNightCycleEnabled: (() => {
    try {
      const stored = localStorage.getItem('daynight_enabled');
      return stored ? stored === 'true' : true;
    } catch {
      return true;
    }
  })(),
  textDimOpacity: (() => {
    try {
      const stored = localStorage.getItem('text_dim_opacity');
      if (stored) {
        const v = parseFloat(stored);
        if (!isNaN(v) && v >= 0.6 && v <= 1) return v;
      }
    } catch {}
    return 0.88;
  })()
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    toggleBackground(state) {
      state.backgroundEnabled = !state.backgroundEnabled;
      try { localStorage.setItem('background_enabled', String(state.backgroundEnabled)); } catch {}
    },
    toggleDayNightCycle(state) {
      state.dayNightCycleEnabled = !state.dayNightCycleEnabled;
      try { localStorage.setItem('daynight_enabled', String(state.dayNightCycleEnabled)); } catch {}
    },
    setBackground(state, action: PayloadAction<boolean>) {
      state.backgroundEnabled = action.payload;
      try { localStorage.setItem('background_enabled', String(state.backgroundEnabled)); } catch {}
    },
    setTextDimOpacity(state, action: PayloadAction<number>) {
      const val = Math.min(1, Math.max(0.6, action.payload));
      state.textDimOpacity = val;
      try { localStorage.setItem('text_dim_opacity', String(val)); } catch {}
    }
  }
});
export const { toggleSidebar, toggleBackground, toggleDayNightCycle, setBackground, setTextDimOpacity } = uiSlice.actions;
export default uiSlice.reducer;
