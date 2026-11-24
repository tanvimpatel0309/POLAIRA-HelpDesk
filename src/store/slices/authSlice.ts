import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User, UserRole } from '@/types';
import { seedUsers } from '@/data/seed';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

const byRole = (role: UserRole) => seedUsers.find((u) => u.role === role)!;

const initialState: AuthState = {
  user: byRole('admin'),
  isAuthenticated: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setRole(state, action: PayloadAction<UserRole>) {
      state.user = byRole(action.payload);
      state.isAuthenticated = true;
    },
    login(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setRole, login, logout } = authSlice.actions;
export default authSlice.reducer;
