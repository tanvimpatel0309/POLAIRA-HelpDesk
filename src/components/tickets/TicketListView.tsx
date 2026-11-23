import {
  Container,
  Stack,
  Title,
  Text,
  Card,
  Group,
  TextInput,
  Select,
  Table,
  Badge,
  Button,
  Pagination,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { IconSearch, IconPlus, IconEye, IconX } from '@tabler/icons-react';
import { useAppSelector } from '@/store/hooks';
import type { Ticket, TicketStatus, TicketPriority } from '@/types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { formatRelative } from '@/utils/format';

const PAGE_SIZE = 10;

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'new', label: 'New' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
  { value: 'reopened', label: 'Reopened' },
];

const priorityOptions = [
  { value: '', label: 'All Priorities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

interface Props {
  tickets: Ticket[];
  title: string;
  subtitle: string;
  showAgent?: boolean;
  showRequester?: boolean;
  showAssignFilter?: boolean;
}

export function TicketListView({
  tickets,
  title,
  subtitle,
  showAgent = true,
  showRequester = true,
  showAssignFilter = false,
}: Props) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categories = useAppSelector((s) => s.categories.categories);
  const agents = useAppSelector((s) => s.users.users.filter((u) => u.role === 'agent'));

  const initialStatus = searchParams.get('status') ?? '';

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>(initialStatus);
  const [priority, setPriority] = useState('');
  const [category, setCategory] = useState('');
  const [agentFilter, setAgentFilter] = useState('');
  const [page, setPage] = useState(1);

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...categories.map((c) => ({ value: c.name, label: c.name })),
  ];

  const agentOptions = [
    { value: '', label: 'All Agents' },
    { value: '__unassigned__', label: 'Unassigned' },
    ...agents.map((a) => ({ value: a.id, label: a.name })),
  ];

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (search && !`${t.title} ${t.id} ${t.requesterName}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (status && t.status !== status) return false;
      if (priority && t.priority !== priority) return false;
      if (category && t.category !== category) return false;
      if (agentFilter) {
        if (agentFilter === '__unassigned__' && t.assignedAgentId) return false;
        if (agentFilter !== '__unassigned__' && t.assignedAgentId !== agentFilter) return false;
      }
      return true;
    });
  }, [tickets, search, status, priority, category, agentFilter]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [filtered]
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function clearFilters() {
    setSearch('');
    setStatus('');
    setPriority('');
    setCategory('');
    setAgentFilter('');
    setPage(1);
  }

  const hasFilters = search || status || priority || category || agentFilter;

  return (
    <Container fluid p="lg">
      <Stack gap="lg">
        <Group justify="space-between">
          <div>
            <Title order={2} fw={600}>{title}</Title>
            <Text c="dimmed" size="sm">{subtitle}</Text>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={() => navigate('/tickets/new')}>
            New Ticket
          </Button>
        </Group>

        <Card withBorder radius="md" padding="md">
          <Stack gap="sm">
            <Group grow>
              <TextInput
                placeholder="Search by title, ID or requester…"
                leftSection={<IconSearch size={16} />}
                value={search}
                onChange={(e) => { setSearch(e.currentTarget.value); setPage(1); }}
              />
              <Select
                placeholder="Status"
                data={statusOptions}
                value={status}
                onChange={(v) => { setStatus(v ?? ''); setPage(1); }}
                clearable
              />
              <Select
                placeholder="Priority"
                data={priorityOptions}
                value={priority}
                onChange={(v) => { setPriority(v ?? ''); setPage(1); }}
                clearable
              />
              <Select
                placeholder="Category"
                data={categoryOptions}
                value={category}
                onChange={(v) => { setCategory(v ?? ''); setPage(1); }}
                clearable
              />
              {showAssignFilter && (
                <Select
                  placeholder="Assigned agent"
                  data={agentOptions}
                  value={agentFilter}
                  onChange={(v) => { setAgentFilter(v ?? ''); setPage(1); }}
                  clearable
                />
              )}
              {hasFilters && (
                <ActionIcon variant="subtle" color="gray" onClick={clearFilters} title="Clear filters">
                  <IconX size={18} />
                </ActionIcon>
              )}
            </Group>

            <Text size="xs" c="dimmed">
              Showing {filtered.length} of {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
            </Text>
          </Stack>
        </Card>

        <Card withBorder radius="md" padding={0}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>Title</Table.Th>
                <Table.Th>Category</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Priority</Table.Th>
                {showRequester && <Table.Th>Requester</Table.Th>}
                {showAgent && <Table.Th>Assigned To</Table.Th>}
                <Table.Th>Updated</Table.Th>
                <Table.Th></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paged.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={9}>
                    <Text ta="center" c="dimmed" py="xl">
                      No tickets found.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                paged.map((t) => (
                  <Table.Tr
                    key={t.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/tickets/${t.id}`)}
                  >
                    <Table.Td>
                      <Badge variant="outline" size="sm" style={{ fontFamily: 'monospace' }}>
                        {t.id}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={500} lineClamp={1} maw={260}>{t.title}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">{t.category}</Text>
                    </Table.Td>
                    <Table.Td><StatusBadge status={t.status} /></Table.Td>
                    <Table.Td><PriorityBadge priority={t.priority} /></Table.Td>
                    {showRequester && (
                      <Table.Td>
                        <Text size="sm">{t.requesterName}</Text>
                      </Table.Td>
                    )}
                    {showAgent && (
                      <Table.Td>
                        <Text size="sm" c={t.assignedAgentName ? undefined : 'dimmed'}>
                          {t.assignedAgentName ?? '—'}
                        </Text>
                      </Table.Td>
                    )}
                    <Table.Td>
                      <Text size="xs" c="dimmed">{formatRelative(t.updatedAt)}</Text>
                    </Table.Td>
                    <Table.Td onClick={(e) => e.stopPropagation()}>
                      <Tooltip label="View ticket">
                        <ActionIcon
                          variant="subtle"
                          color="blue"
                          onClick={() => navigate(`/tickets/${t.id}`)}
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
          {totalPages > 1 && (
            <Group justify="center" py="md">
              <Pagination value={page} onChange={setPage} total={totalPages} size="sm" />
            </Group>
          )}
        </Card>
      </Stack>
    </Container>
  );
}
