import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User, UserRole, NotificationPreferences } from '@/types';
import { seedUsers } from '@/data/seed';

interface UsersState {
  users: User[];
}

const initialState: UsersState = { users: seedUsers };

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    addUser(
      state,
      action: PayloadAction<{ name: string; email: string; role: UserRole; password: string }>
    ) {
      const ts = new Date().toISOString();
      state.users.push({
        id: `usr-${Date.now()}`,
        ...action.payload,
        isActive: true,
        createdAt: ts,
        updatedAt: ts,
      });
    },
    updateUser(
      state,
      action: PayloadAction<Partial<User> & { id: string }>
    ) {
      const u = state.users.find((x) => x.id === action.payload.id);
      if (!u) return;
      Object.assign(u, action.payload, { updatedAt: new Date().toISOString() });
    },
    deleteUser(state, action: PayloadAction<string>) {
      state.users = state.users.filter((u) => u.id !== action.payload);
    },
    changePassword(
      state,
      action: PayloadAction<{ userId: string; newPassword: string }>
    ) {
      const u = state.users.find((x) => x.id === action.payload.userId);
      if (!u) return;
      u.password = action.payload.newPassword;
      u.updatedAt = new Date().toISOString();
    },
    updateNotificationPreferences(
      state,
      action: PayloadAction<{ userId: string; preferences: NotificationPreferences }>
    ) {
      const u = state.users.find((x) => x.id === action.payload.userId);
      if (!u) return;
      u.notificationPreferences = action.payload.preferences;
      u.updatedAt = new Date().toISOString();
    },
  },
});

export const { addUser, updateUser, deleteUser, changePassword, updateNotificationPreferences } = usersSlice.actions;
export default usersSlice.reducer;
