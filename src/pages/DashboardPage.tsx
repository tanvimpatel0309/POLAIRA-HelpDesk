import {
  Container,
  Card,
  Text,
  Group,
  ThemeIcon,
  Stack,
  Title,
  SimpleGrid,
  Table,
  Badge,
  Button,
  Anchor,
} from '@mantine/core';
import {
  IconTicket,
  IconAlertCircle,
  IconClockHour4,
  IconCircleCheck,
  IconRefresh,
  IconLock,
  IconFolderOpen,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addNotification } from '@/store/slices/notificationsSlice';
import type { TicketStatus } from '@/types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { formatRelative } from '@/utils/format';
import { getSlaInfo } from '@/utils/sla';

interface StatCard {
  label: string;
  icon: React.ElementType;
  color: string;
  status?: TicketStatus;
  key: string;
}

const statCards: StatCard[] = [
  { key: 'total', label: 'Total Tickets', icon: IconTicket, color: 'blue' },
  { key: 'new', label: 'New', icon: IconAlertCircle, color: 'orange', status: 'new' },
  { key: 'open', label: 'Open', icon: IconFolderOpen, color: 'cyan', status: 'open' },
  { key: 'in_progress', label: 'In Progress', icon: IconClockHour4, color: 'yellow', status: 'in_progress' },
  { key: 'resolved', label: 'Resolved', icon: IconCircleCheck, color: 'green', status: 'resolved' },
  { key: 'reopened', label: 'Reopened', icon: IconRefresh, color: 'grape', status: 'reopened' },
  { key: 'closed', label: 'Closed', icon: IconLock, color: 'gray', status: 'closed' },
];

export function DashboardPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const allTickets = useAppSelector((s) => s.tickets.tickets);
  const slaConfigs = useAppSelector((s) => s.sla.configs);
  const existingNotifications = useAppSelector((s) => s.notifications.notifications);

  const tickets = (() => {
    if (!user) return [];
    if (user.role === 'admin') return allTickets;
    if (user.role === 'agent') return allTickets.filter((t) => t.assignedAgentId === user.id);
    return allTickets.filter((t) => t.requesterId === user.id);
  })();

  const breachedTickets = tickets.filter((t) => {
    const info = getSlaInfo(t, slaConfigs);
    return info?.status === 'breached';
  });

  const nearBreachTickets = tickets.filter((t) => {
    const info = getSlaInfo(t, slaConfigs);
    return info?.status === 'near_breach';
  });

  // Dispatch in-app alerts for newly breached tickets (US-057)
  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'agent')) return;
    for (const t of breachedTickets) {
      const alreadyAlerted = existingNotifications.some(
        (n) => n.ticketId === t.id && n.message.includes('SLA breached')
      );
      if (!alreadyAlerted) {
        dispatch(addNotification({
          userId: user.id,
          message: `SLA breached for ticket ${t.id}: ${t.title}`,
          ticketId: t.id,
          ticketTitle: t.title,
        }));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts: Record<string, number> = {
    total: tickets.length,
    new: tickets.filter((t) => t.status === 'new').length,
    open: tickets.filter((t) => t.status === 'open').length,
    in_progress: tickets.filter((t) => t.status === 'in_progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
    closed: tickets.filter((t) => t.status === 'closed').length,
    reopened: tickets.filter((t) => t.status === 'reopened').length,
  };

  const recentTickets = [...tickets]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 8);

  const baseRoute =
    user?.role === 'requester' ? '/my-tickets' : '/tickets';

  function handleCardClick(card: StatCard) {
    if (card.status) {
      navigate(`${baseRoute}?status=${card.status}`);
    } else {
      navigate(baseRoute);
    }
  }

  const roleLabelMap = {
    admin: 'system-wide',
    agent: 'assigned to you',
    requester: 'submitted by you',
  };

  return (
    <Container fluid p="lg">
      <Stack gap="lg">
        <div>
          <Title order={2} fw={600}>Dashboard</Title>
          <Text c="dimmed" size="sm">
            Welcome back, {user?.name}. Showing tickets{' '}
            {user ? roleLabelMap[user.role] : ''}.
          </Text>
        </div>

        <SimpleGrid cols={{ base: 2, sm: 3, lg: 7 }} spacing="md">
          {statCards.map((card) => (
            <Card
              key={card.key}
              withBorder
              radius="md"
              padding="md"
              style={{ cursor: 'pointer' }}
              onClick={() => handleCardClick(card)}
            >
              <Group justify="space-between" mb="xs">
                <ThemeIcon color={card.color} variant="light" size="lg" radius="md">
                  <card.icon size={20} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c={card.color}>{counts[card.key]}</Text>
              <Text size="xs" c="dimmed" mt={4}>{card.label}</Text>
            </Card>
          ))}
        </SimpleGrid>

        {(user?.role === 'admin' || user?.role === 'agent') && (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <Card
              withBorder
              radius="md"
              padding="md"
              style={{ cursor: breachedTickets.length > 0 ? 'pointer' : undefined, borderColor: breachedTickets.length > 0 ? 'var(--mantine-color-red-4)' : undefined }}
              onClick={() => breachedTickets.length > 0 && navigate(`${baseRoute}?status=`)}
            >
              <Group justify="space-between" mb="xs">
                <ThemeIcon color="red" variant="light" size="lg" radius="md">
                  <IconAlertTriangle size={20} />
                </ThemeIcon>
                {breachedTickets.length > 0 && (
                  <Badge color="red" variant="filled" size="sm">Action needed</Badge>
                )}
              </Group>
              <Text fw={700} size="xl" c="red">{breachedTickets.length}</Text>
              <Text size="xs" c="dimmed" mt={4}>SLA Breached</Text>
            </Card>
            <Card
              withBorder
              radius="md"
              padding="md"
              style={{ cursor: nearBreachTickets.length > 0 ? 'pointer' : undefined, borderColor: nearBreachTickets.length > 0 ? 'var(--mantine-color-orange-4)' : undefined }}
              onClick={() => nearBreachTickets.length > 0 && navigate(`${baseRoute}?status=`)}
            >
              <Group justify="space-between" mb="xs">
                <ThemeIcon color="orange" variant="light" size="lg" radius="md">
                  <IconClockHour4 size={20} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="orange">{nearBreachTickets.length}</Text>
              <Text size="xs" c="dimmed" mt={4}>SLA Near Breach</Text>
            </Card>
          </SimpleGrid>
        )}

        <Card withBorder radius="md" padding="lg">
          <Group justify="space-between" mb="md">
            <Text fw={600}>Recent Tickets</Text>
            <Button variant="subtle" size="xs" onClick={() => navigate(baseRoute)}>
              View all
            </Button>
          </Group>
          {recentTickets.length === 0 ? (
            <Text c="dimmed" size="sm" ta="center" py="lg">
              No tickets to show.{' '}
              {user?.role !== 'agent' && (
                <Anchor
                  size="sm"
                  onClick={() => navigate('/tickets/new')}
                  style={{ cursor: 'pointer' }}
                >
                  Create one
                </Anchor>
              )}
            </Text>
          ) : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>ID</Table.Th>
                  <Table.Th>Title</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Priority</Table.Th>
                  <Table.Th>Updated</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {recentTickets.map((t) => (
                  <Table.Tr
                    key={t.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/tickets/${t.id}`)}
                  >
                    <Table.Td>
                      <Badge variant="outline" size="sm">{t.id}</Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={500} lineClamp={1}>{t.title}</Text>
                    </Table.Td>
                    <Table.Td><StatusBadge status={t.status} /></Table.Td>
                    <Table.Td><PriorityBadge priority={t.priority} /></Table.Td>
                    <Table.Td>
                      <Text size="xs" c="dimmed">{formatRelative(t.updatedAt)}</Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Card>
      </Stack>
    </Container>
  );
}
