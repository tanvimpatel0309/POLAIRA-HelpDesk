import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { TicketsPage } from '@/pages/TicketsPage';
import { MyTicketsPage } from '@/pages/MyTicketsPage';
import { CreateTicketPage } from '@/pages/CreateTicketPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { UsersPage } from '@/pages/admin/UsersPage';
import { CategoriesPage } from '@/pages/admin/CategoriesPage';
import { PrioritiesPage } from '@/pages/admin/PrioritiesPage';
import { StatusesPage } from '@/pages/admin/StatusesPage';
import { SettingsPage } from '@/pages/admin/SettingsPage';
import { AuditLogsPage } from '@/pages/admin/AuditLogsPage';
import { SlaPage } from '@/pages/admin/SlaPage';
import { SlaReportPage } from '@/pages/admin/SlaReportPage';
import { TicketDetailPage } from '@/pages/TicketDetailPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { UnauthorizedPage } from '@/pages/UnauthorizedPage';

const basename = new URL(document.baseURI).pathname.replace(/\/[^/]*$/, '') || '/';

export const router = createBrowserRouter(
  [
    {
      path: '/login',
      element: <LoginPage />,
    },
    {
      path: '/register',
      element: <RegisterPage />,
    },
    {
      path: '/',
      element: (
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <Navigate to="/dashboard" replace /> },
        {
          path: 'dashboard',
          element: <DashboardPage />,
        },
        {
          path: 'profile',
          element: <ProfilePage />,
        },
        {
          path: 'tickets',
          element: (
            <ProtectedRoute allowedRoles={['admin', 'agent']}>
              <TicketsPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'my-tickets',
          element: (
            <ProtectedRoute allowedRoles={['requester']}>
              <MyTicketsPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'tickets/new',
          element: <CreateTicketPage />,
        },
        {
          path: 'tickets/:id',
          element: <TicketDetailPage />,
        },
        {
          path: 'admin',
          element: (
            <ProtectedRoute allowedRoles={['admin']}>
              <Navigate to="/admin/users" replace />
            </ProtectedRoute>
          ),
        },
        {
          path: 'admin/users',
          element: (
            <ProtectedRoute allowedRoles={['admin']}>
              <UsersPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'admin/categories',
          element: (
            <ProtectedRoute allowedRoles={['admin']}>
              <CategoriesPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'admin/priorities',
          element: (
            <ProtectedRoute allowedRoles={['admin']}>
              <PrioritiesPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'admin/statuses',
          element: (
            <ProtectedRoute allowedRoles={['admin']}>
              <StatusesPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'admin/settings',
          element: (
            <ProtectedRoute allowedRoles={['admin']}>
              <SettingsPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'admin/audit-logs',
          element: (
            <ProtectedRoute allowedRoles={['admin']}>
              <AuditLogsPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'admin/sla',
          element: (
            <ProtectedRoute allowedRoles={['admin']}>
              <SlaPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'admin/sla-report',
          element: (
            <ProtectedRoute allowedRoles={['admin']}>
              <SlaReportPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'unauthorized',
          element: <UnauthorizedPage />,
        },
        {
          path: '*',
          element: <NotFoundPage />,
        },
      ],
    },
  ],
  { basename }
);
