import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { SystemSettings } from '@/types';
import { seedSettings } from '@/data/seed';

const settingsSlice = createSlice({
  name: 'settings',
  initialState: seedSettings as SystemSettings,
  reducers: {
    updateSettings(state, action: PayloadAction<Partial<SystemSettings>>) {
      Object.assign(state, action.payload);
    },
  },
});

export const { updateSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
