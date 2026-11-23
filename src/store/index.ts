import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import ticketsReducer from './slices/ticketsSlice';
import usersReducer from './slices/usersSlice';
import categoriesReducer from './slices/categoriesSlice';
import prioritiesReducer from './slices/prioritiesSlice';
import statusesReducer from './slices/statusesSlice';
import settingsReducer from './slices/settingsSlice';
import auditReducer from './slices/auditSlice';
import notificationsReducer from './slices/notificationsSlice';
import slaReducer from './slices/slaSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tickets: ticketsReducer,
    users: usersReducer,
    categories: categoriesReducer,
    priorities: prioritiesReducer,
    statuses: statusesReducer,
    settings: settingsReducer,
    audit: auditReducer,
    notifications: notificationsReducer,
    sla: slaReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
