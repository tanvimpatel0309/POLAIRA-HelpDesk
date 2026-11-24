import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { SlaConfig, TicketPriority } from '@/types';
import { seedSlaConfigs } from '@/data/seed';

interface SlaState {
  configs: SlaConfig[];
}

const initialState: SlaState = { configs: seedSlaConfigs };

const slaSlice = createSlice({
  name: 'sla',
  initialState,
  reducers: {
    updateSlaConfig(
      state,
      action: PayloadAction<{ priority: TicketPriority; resolutionHours: number }>
    ) {
      const cfg = state.configs.find((c) => c.priority === action.payload.priority);
      if (cfg) {
        cfg.resolutionHours = action.payload.resolutionHours;
        cfg.updatedAt = new Date().toISOString();
      }
    },
  },
});

export const { updateSlaConfig } = slaSlice.actions;
export default slaSlice.reducer;
