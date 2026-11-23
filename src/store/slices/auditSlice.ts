import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AuditLog } from '@/types';
import { seedAuditLogs } from '@/data/seed';

interface AuditState {
  logs: AuditLog[];
}

const initialState: AuditState = { logs: seedAuditLogs };

const auditSlice = createSlice({
  name: 'audit',
  initialState,
  reducers: {
    addLog(
      state,
      action: PayloadAction<Omit<AuditLog, 'id' | 'createdAt'>>
    ) {
      state.logs.unshift({
        id: `aud-${Date.now()}`,
        ...action.payload,
        createdAt: new Date().toISOString(),
      });
    },
  },
});

export const { addLog } = auditSlice.actions;
export default auditSlice.reducer;
