import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { PriorityConfig, TicketPriority } from '@/types';
import { seedPriorities } from '@/data/seed';

interface PrioritiesState {
  priorities: PriorityConfig[];
}

const initialState: PrioritiesState = { priorities: seedPriorities };

const prioritiesSlice = createSlice({
  name: 'priorities',
  initialState,
  reducers: {
    addPriority(
      state,
      action: PayloadAction<{ name: string; level: TicketPriority; description: string; color: string }>
    ) {
      state.priorities.push({
        id: `pri-${Date.now()}`,
        ...action.payload,
        createdAt: new Date().toISOString(),
      });
    },
    updatePriority(
      state,
      action: PayloadAction<{ id: string; name: string; description: string; color: string }>
    ) {
      const p = state.priorities.find((x) => x.id === action.payload.id);
      if (!p) return;
      p.name = action.payload.name;
      p.description = action.payload.description;
      p.color = action.payload.color;
    },
    deletePriority(state, action: PayloadAction<string>) {
      state.priorities = state.priorities.filter((p) => p.id !== action.payload);
    },
  },
});

export const { addPriority, updatePriority, deletePriority } = prioritiesSlice.actions;
export default prioritiesSlice.reducer;
