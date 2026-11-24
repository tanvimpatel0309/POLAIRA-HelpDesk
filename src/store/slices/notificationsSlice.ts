import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AppNotification } from '@/types';
import { seedNotifications } from '@/data/seed';

interface NotificationsState {
  notifications: AppNotification[];
}

const initialState: NotificationsState = { notifications: seedNotifications };

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification(
      state,
      action: PayloadAction<Omit<AppNotification, 'id' | 'read' | 'createdAt'>>
    ) {
      state.notifications.unshift({
        id: `notif-${Date.now()}`,
        ...action.payload,
        read: false,
        createdAt: new Date().toISOString(),
      });
    },
    markRead(state, action: PayloadAction<string>) {
      const n = state.notifications.find((x) => x.id === action.payload);
      if (n) n.read = true;
    },
    markAllRead(state, action: PayloadAction<string>) {
      state.notifications
        .filter((n) => n.userId === action.payload)
        .forEach((n) => { n.read = true; });
    },
  },
});

export const { addNotification, markRead, markAllRead } = notificationsSlice.actions;
export default notificationsSlice.reducer;
