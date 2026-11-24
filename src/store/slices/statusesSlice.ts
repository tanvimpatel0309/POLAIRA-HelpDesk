import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { StatusConfig, TicketStatus } from '@/types';
import { seedStatuses } from '@/data/seed';

interface StatusesState {
  statuses: StatusConfig[];
}

const initialState: StatusesState = { statuses: seedStatuses };

const statusesSlice = createSlice({
  name: 'statuses',
  initialState,
  reducers: {
    updateStatusTransitions(
      state,
      action: PayloadAction<{ id: string; allowedTransitions: TicketStatus[] }>
    ) {
      const s = state.statuses.find((x) => x.id === action.payload.id);
      if (!s) return;
      s.allowedTransitions = action.payload.allowedTransitions;
    },
    updateStatusDescription(
      state,
      action: PayloadAction<{ id: string; description: string }>
    ) {
      const s = state.statuses.find((x) => x.id === action.payload.id);
      if (!s) return;
      s.description = action.payload.description;
    },
  },
});

export const { updateStatusTransitions, updateStatusDescription } = statusesSlice.actions;
export default statusesSlice.reducer;
