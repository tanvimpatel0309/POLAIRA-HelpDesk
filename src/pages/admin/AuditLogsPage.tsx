import {
  Container,
  Stack,
  Title,
  Text,
  Card,
  Group,
  Table,
  Badge,
  TextInput,
  Select,
  Pagination,
  ActionIcon,
  Tooltip,
  Code,
} from '@mantine/core';
import { useMemo, useState } from 'react';
import { IconSearch, IconX } from '@tabler/icons-react';
import { useAppSelector } from '@/store/hooks';
import { formatDateTime } from '@/utils/format';

const PAGE_SIZE = 15;

const entityOptions = [
  { value: '', label: 'All Entities' },
  { value: 'User', label: 'User' },
  { value: 'Ticket', label: 'Ticket' },
  { value: 'Category', label: 'Category' },
  { value: 'Priority', label: 'Priority' },
  { value: 'Status', label: 'Status' },
  { value: 'SystemSettings', label: 'System Settings' },
];

const entityColors: Record<string, string> = {
  User: 'blue',
  Ticket: 'cyan',
  Category: 'teal',
  Priority: 'orange',
  Status: 'grape',
  SystemSettings: 'gray',
};

export function AuditLogsPage() {
  const logs = useAppSelector((s) => s.audit.logs);

  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (entityFilter && l.entity !== entityFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !l.action.toLowerCase().includes(q) &&
          !l.userName.toLowerCase().includes(q) &&
          !l.details.toLowerCase().includes(q) &&
          !l.entityId.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [logs, search, entityFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const hasFilters = search || entityFilter;

  function clearFilters() {
    setSearch('');
    setEntityFilter('');
    setPage(1);
  }

  return (
    <Container fluid p="lg">
      <Stack gap="lg">
        <div>
          <Title order={2} fw={600}>Audit Logs</Title>
          <Text c="dimmed" size="sm">
            Chronological record of all system configuration changes and ticket events.
          </Text>
        </div>

        <Card withBorder radius="md" padding="md">
          <Group>
            <TextInput
              placeholder="Search action, user, entity ID…"
              leftSection={<IconSearch size={16} />}
              value={search}
              onChange={(e) => { setSearch(e.currentTarget.value); setPage(1); }}
              style={{ flex: 1 }}
            />
            <Select
              placeholder="Entity type"
              data={entityOptions}
              value={entityFilter}
              onChange={(v) => { setEntityFilter(v ?? ''); setPage(1); }}
              clearable
              w={180}
            />
            {hasFilters && (
              <Tooltip label="Clear filters">
                <ActionIcon variant="subtle" color="gray" onClick={clearFilters}>
                  <IconX size={18} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
          <Text size="xs" c="dimmed" mt="xs">
            Showing {filtered.length} of {logs.length} log entr{logs.length !== 1 ? 'ies' : 'y'}
          </Text>
        </Card>

        <Card withBorder radius="md" padding={0}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Timestamp</Table.Th>
                <Table.Th>Action</Table.Th>
                <Table.Th>Entity</Table.Th>
                <Table.Th>Entity ID</Table.Th>
                <Table.Th>Performed By</Table.Th>
                <Table.Th>Details</Table.Th>
                <Table.Th>Change</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paged.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <Text ta="center" c="dimmed" py="xl">No audit log entries found.</Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                paged.map((log) => (
                  <Table.Tr key={log.id}>
                    <Table.Td style={{ whiteSpace: 'nowrap' }}>
                      <Text size="xs" c="dimmed">{formatDateTime(log.createdAt)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={500}>{log.action}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={entityColors[log.entity] ?? 'gray'}
                        variant="light"
                        size="sm"
                      >
                        {log.entity}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Code>{log.entityId}</Code>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{log.userName}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" c="dimmed" lineClamp={2} maw={260}>{log.details}</Text>
                    </Table.Td>
                    <Table.Td>
                      {log.previousValue || log.newValue ? (
                        <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                          {log.previousValue && <span style={{ color: 'var(--mantine-color-red-6)' }}>{log.previousValue}</span>}
                          {log.previousValue && log.newValue && ' → '}
                          {log.newValue && <span style={{ color: 'var(--mantine-color-green-6)' }}>{log.newValue}</span>}
                        </Text>
                      ) : (
                        <Text size="xs" c="dimmed">—</Text>
                      )}
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
