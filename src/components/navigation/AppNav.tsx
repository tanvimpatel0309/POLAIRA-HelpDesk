import {
  Stack,
  NavLink,
  Text,
  Group,
  Divider,
  Box,
  ScrollArea,
} from '@mantine/core';
import {
  IconLayoutDashboard,
  IconTicket,
  IconPlus,
  IconUsers,
  IconTag,
  IconFlag,
  IconListCheck,
  IconSettings,
  IconClipboardList,
  IconHeadphones,
  IconClock,
  IconChartBar,
  IconUserCircle,
} from '@tabler/icons-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import type { UserRole } from '@/types';
import classes from './AppNav.module.css';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  roles: UserRole[];
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    items: [
      {
        label: 'Dashboard',
        icon: <IconLayoutDashboard size={18} />,
        path: '/dashboard',
        roles: ['admin', 'agent', 'requester'],
      },
    ],
  },
  {
    title: 'Tickets',
    items: [
      {
        label: 'All Tickets',
        icon: <IconTicket size={18} />,
        path: '/tickets',
        roles: ['admin', 'agent'],
      },
      {
        label: 'My Tickets',
        icon: <IconTicket size={18} />,
        path: '/my-tickets',
        roles: ['requester'],
      },
      {
        label: 'Create Ticket',
        icon: <IconPlus size={18} />,
        path: '/tickets/new',
        roles: ['admin', 'agent', 'requester'],
      },
    ],
  },
  {
    title: 'Administration',
    items: [
      {
        label: 'Users',
        icon: <IconUsers size={18} />,
        path: '/admin/users',
        roles: ['admin'],
      },
      {
        label: 'Categories',
        icon: <IconTag size={18} />,
        path: '/admin/categories',
        roles: ['admin'],
      },
      {
        label: 'Priorities',
        icon: <IconFlag size={18} />,
        path: '/admin/priorities',
        roles: ['admin'],
      },
      {
        label: 'Statuses',
        icon: <IconListCheck size={18} />,
        path: '/admin/statuses',
        roles: ['admin'],
      },
      {
        label: 'SLA Config',
        icon: <IconClock size={18} />,
        path: '/admin/sla',
        roles: ['admin'],
      },
      {
        label: 'SLA Report',
        icon: <IconChartBar size={18} />,
        path: '/admin/sla-report',
        roles: ['admin'],
      },
      {
        label: 'System Settings',
        icon: <IconSettings size={18} />,
        path: '/admin/settings',
        roles: ['admin'],
      },
      {
        label: 'Audit Logs',
        icon: <IconClipboardList size={18} />,
        path: '/admin/audit-logs',
        roles: ['admin'],
      },
    ],
  },
  {
    title: 'Account',
    items: [
      {
        label: 'My Profile',
        icon: <IconUserCircle size={18} />,
        path: '/profile',
        roles: ['admin', 'agent', 'requester'],
      },
    ],
  },
];

export function AppNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector((s) => s.auth.user);
  const role = user?.role ?? 'requester';

  return (
    <Box className={classes.nav}>
      <Box className={classes.logo}>
        <Group gap="xs">
          <IconHeadphones size={26} color="var(--mantine-color-blue-4)" />
          <Text fw={700} size="lg" c="white">
            HelpDesk
          </Text>
        </Group>
      </Box>

      <ScrollArea flex={1} scrollbarSize={4}>
        <Stack gap={4} px="sm" py="xs">
          {navSections.map((section, si) => {
            const visibleItems = section.items.filter((item) =>
              item.roles.includes(role)
            );
            if (visibleItems.length === 0) return null;

            return (
              <Box key={si}>
                {section.title && (
                  <Text
                    size="xs"
                    fw={600}
                    c="dimmed"
                    tt="uppercase"
                    px="xs"
                    pt={si > 0 ? 'sm' : 0}
                    pb={4}
                    className={classes.sectionTitle}
                  >
                    {section.title}
                  </Text>
                )}
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.path}
                    label={item.label}
                    leftSection={item.icon}
                    active={location.pathname === item.path}
                    onClick={() => navigate(item.path)}
                    className={classes.link}
                  />
                ))}
                {si < navSections.length - 1 && visibleItems.length > 0 && (
                  <Divider my={4} color="rgba(255,255,255,0.08)" />
                )}
              </Box>
            );
          })}
        </Stack>
      </ScrollArea>
    </Box>
  );
}
