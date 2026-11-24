import {
  Group,
  Text,
  Avatar,
  Menu,
  Badge,
  ActionIcon,
  Burger,
  Select,
  Box,
  Popover,
  Stack,
  ScrollArea,
  Indicator,
  Button,
  Divider,
} from '@mantine/core';
import {
  IconBell,
  IconChevronDown,
  IconLogout,
  IconUser,
  IconShield,
  IconHeadset,
  IconExternalLink,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setRole, logout } from '@/store/slices/authSlice';
import { markRead, markAllRead } from '@/store/slices/notificationsSlice';
import type { UserRole } from '@/types';
import { formatRelative } from '@/utils/format';
import classes from './AppHeader.module.css';

const roleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  agent: 'Support Agent',
  requester: 'Requester',
};

const roleIcons: Record<UserRole, React.ReactNode> = {
  admin: <IconShield size={14} />,
  agent: <IconHeadset size={14} />,
  requester: <IconUser size={14} />,
};

const roleBadgeColor: Record<UserRole, string> = {
  admin: 'red',
  agent: 'blue',
  requester: 'green',
};

interface AppHeaderProps {
  opened: boolean;
  onToggle: () => void;
}

export function AppHeader({ opened, onToggle }: AppHeaderProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const role = user?.role ?? 'requester';
  const allNotifications = useAppSelector((s) => s.notifications.notifications);
  const myNotifications = allNotifications.filter((n) => n.userId === user?.id);
  const unreadCount = myNotifications.filter((n) => !n.read).length;

  return (
    <Box className={classes.header}>
      <Group h="100%" px="md" justify="space-between">
        <Group gap="sm">
          <Burger opened={opened} onClick={onToggle} hiddenFrom="sm" size="sm" />
        </Group>

        <Group gap="xs">
          <Select
            size="xs"
            value={role}
            data={[
              { value: 'admin', label: 'Admin' },
              { value: 'agent', label: 'Support Agent' },
              { value: 'requester', label: 'Requester' },
            ]}
            onChange={(val) => val && dispatch(setRole(val as UserRole))}
            w={140}
            styles={{ input: { fontSize: 12 } }}
            aria-label="Switch role (dev only)"
          />

          <Popover width={340} position="bottom-end" shadow="md">
            <Popover.Target>
              <Indicator
                label={unreadCount > 0 ? unreadCount : undefined}
                size={16}
                disabled={unreadCount === 0}
                color="red"
              >
                <ActionIcon variant="subtle" color="gray" size="lg" aria-label="Notifications">
                  <IconBell size={18} />
                </ActionIcon>
              </Indicator>
            </Popover.Target>
            <Popover.Dropdown p={0}>
              <Group px="md" py="sm" justify="space-between">
                <Text fw={600} size="sm">Notifications</Text>
                {unreadCount > 0 && (
                  <Button
                    variant="subtle"
                    size="xs"
                    onClick={() => user && dispatch(markAllRead(user.id))}
                  >
                    Mark all read
                  </Button>
                )}
              </Group>
              <Divider />
              <ScrollArea mah={320}>
                {myNotifications.length === 0 ? (
                  <Text size="sm" c="dimmed" ta="center" py="lg">
                    No notifications
                  </Text>
                ) : (
                  <Stack gap={0}>
                    {myNotifications.map((n) => (
                      <Box
                        key={n.id}
                        px="md"
                        py="sm"
                        style={{
                          cursor: 'pointer',
                          background: n.read ? undefined : 'var(--mantine-color-blue-0)',
                          borderBottom: '1px solid var(--mantine-color-gray-2)',
                        }}
                        onClick={() => {
                          dispatch(markRead(n.id));
                          navigate(`/tickets/${n.ticketId}`);
                        }}
                      >
                        <Group justify="space-between" wrap="nowrap">
                          <Stack gap={2}>
                            <Text size="xs" fw={n.read ? 400 : 600}>
                              {n.message}
                            </Text>
                            <Group gap={4}>
                              <IconExternalLink size={10} color="var(--mantine-color-blue-5)" />
                              <Text size="xs" c="blue">
                                {n.ticketTitle}
                              </Text>
                            </Group>
                          </Stack>
                          <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                            {formatRelative(n.createdAt)}
                          </Text>
                        </Group>
                      </Box>
                    ))}
                  </Stack>
                )}
              </ScrollArea>
            </Popover.Dropdown>
          </Popover>

          <Menu shadow="md" width={200} position="bottom-end">
            <Menu.Target>
              <Group gap="xs" className={classes.userButton}>
                <Avatar size={32} radius="xl" color="blue" name={user?.name} />
                <Box visibleFrom="sm">
                  <Text size="sm" fw={500} lh={1.2}>
                    {user?.name}
                  </Text>
                  <Badge
                    size="xs"
                    color={roleBadgeColor[role]}
                    variant="light"
                    leftSection={roleIcons[role]}
                  >
                    {roleLabels[role]}
                  </Badge>
                </Box>
                <IconChevronDown size={14} />
              </Group>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>{user?.email}</Menu.Label>
              <Menu.Item leftSection={<IconUser size={14} />} onClick={() => navigate('/profile')}>Profile</Menu.Item>
              <Menu.Divider />
              <Menu.Item
                color="red"
                leftSection={<IconLogout size={14} />}
                onClick={() => {
                  dispatch(logout());
                  navigate('/login');
                }}
              >
                Sign out
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>
    </Box>
  );
}
