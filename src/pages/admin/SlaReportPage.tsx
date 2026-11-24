import {
  Container,
  Stack,
  Title,
  Text,
  Card,
  Group,
  Badge,
  Table,
  SimpleGrid,
  ThemeIcon,
  Progress,
  Select,
  Divider,
} from '@mantine/core';
import { useState } from 'react';
import { IconCircleCheck, IconAlertTriangle, IconClock, IconChartBar } from '@tabler/icons-react';
import { useAppSelector } from '@/store/hooks';
import { getSlaInfo } from '@/utils/sla';
import type { TicketPriority } from '@/types';

const priorityOrder: TicketPriority[] = ['critical', 'high', 'medium', 'low'];

const priorityColors: Record<TicketPriority, string> = {
  critical: 'red',
  high: 'orange',
  medium: 'yellow',
  low: 'blue',
};

export function SlaReportPage() {
  const tickets = useAppSelector((s) => s.tickets.tickets);
  const slaConfigs = useAppSelector((s) => s.sla.configs);
  const categories = useAppSelector((s) => s.categories.categories);

  const [rangeFilter, setRangeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');

  const cutoff = (() => {
    const now = Date.now();
    if (rangeFilter === '7d') return now - 7 * 86400000;
    if (rangeFilter === '30d') return now - 30 * 86400000;
    if (rangeFilter === '90d') return now - 90 * 86400000;
    return 0;
  })();

  const filtered = tickets.filter((t) => {
    if (cutoff && new Date(t.createdAt).getTime() < cutoff) return false;
    if (categoryFilter && t.category !== categoryFilter) return false;
    return true;
  });

  const stats = priorityOrder.map((priority) => {
    const pts = filtered.filter((t) => t.priority === priority);
    const total = pts.length;
    if (total === 0) return { priority, total, met: 0, nearBreach: 0, breached: 0, avgElapsed: 0 };

    let met = 0, nearBreach = 0, breached = 0, totalElapsed = 0;
    for (const t of pts) {
      const info = getSlaInfo(t, slaConfigs);
      if (!info) { met++; continue; }
      if (info.status === 'resolved' || info.status === 'on_track') met++;
      else if (info.status === 'near_breach') nearBreach++;
      else breached++;
      totalElapsed += info.percentElapsed;
    }

    return { priority, total, met, nearBreach, breached, avgElapsed: totalElapsed / total };
  });

  const overall = stats.reduce(
    (acc, s) => ({ total: acc.total + s.total, met: acc.met + s.met, breached: acc.breached + s.breached }),
    { total: 0, met: 0, breached: 0 }
  );
  const overallRate = overall.total > 0 ? Math.round((overall.met / overall.total) * 100) : 100;

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...categories.map((c) => ({ value: c.name, label: c.name })),
  ];

  const rangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
  ];

  return (
    <Container fluid p="lg">
      <Stack gap="lg">
        <div>
          <Title order={2} fw={600}>SLA Compliance Report</Title>
          <Text c="dimmed" size="sm">
            Monitor ticket resolution performance against SLA targets.
          </Text>
        </div>

        <Group gap="md">
          <Select
            label="Time Range"
            data={rangeOptions}
            value={rangeFilter}
            onChange={(v) => setRangeFilter(v ?? 'all')}
            w={160}
          />
          <Select
            label="Category"
            data={categoryOptions}
            value={categoryFilter}
            onChange={(v) => setCategoryFilter(v ?? '')}
            w={200}
          />
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
          <Card withBorder radius="md" padding="md">
            <Group gap="sm">
              <ThemeIcon color="blue" variant="light" size="lg" radius="md">
                <IconChartBar size={20} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">Total Tickets</Text>
                <Text fw={700} size="xl">{overall.total}</Text>
              </div>
            </Group>
          </Card>
          <Card withBorder radius="md" padding="md">
            <Group gap="sm">
              <ThemeIcon color="green" variant="light" size="lg" radius="md">
                <IconCircleCheck size={20} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">SLA Compliance Rate</Text>
                <Text fw={700} size="xl" c={overallRate >= 80 ? 'green' : overallRate >= 60 ? 'orange' : 'red'}>
                  {overallRate}%
                </Text>
              </div>
            </Group>
          </Card>
          <Card withBorder radius="md" padding="md">
            <Group gap="sm">
              <ThemeIcon color="red" variant="light" size="lg" radius="md">
                <IconAlertTriangle size={20} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">SLA Breached</Text>
                <Text fw={700} size="xl" c="red">{overall.breached}</Text>
              </div>
            </Group>
          </Card>
        </SimpleGrid>

        <Card withBorder radius="md" padding="lg">
          <Stack gap="md">
            <Group gap="xs">
              <IconClock size={18} />
              <Text fw={600}>SLA Compliance by Priority</Text>
            </Group>
            <Divider />
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Priority</Table.Th>
                  <Table.Th>Total</Table.Th>
                  <Table.Th>Met SLA</Table.Th>
                  <Table.Th>Near Breach</Table.Th>
                  <Table.Th>Breached</Table.Th>
                  <Table.Th>Compliance Rate</Table.Th>
                  <Table.Th>Avg. Elapsed</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {stats.map((s) => {
                  const rate = s.total > 0 ? Math.round((s.met / s.total) * 100) : 100;
                  return (
                    <Table.Tr key={s.priority}>
                      <Table.Td>
                        <Badge color={priorityColors[s.priority]} variant="light">
                          {s.priority.charAt(0).toUpperCase() + s.priority.slice(1)}
                        </Badge>
                      </Table.Td>
                      <Table.Td><Text size="sm">{s.total}</Text></Table.Td>
                      <Table.Td><Text size="sm" c="green">{s.met}</Text></Table.Td>
                      <Table.Td><Text size="sm" c="orange">{s.nearBreach}</Text></Table.Td>
                      <Table.Td><Text size="sm" c="red">{s.breached}</Text></Table.Td>
                      <Table.Td>
                        <Group gap="xs" wrap="nowrap">
                          <Progress
                            value={rate}
                            color={rate >= 80 ? 'green' : rate >= 60 ? 'orange' : 'red'}
                            size="sm"
                            w={80}
                          />
                          <Text size="xs">{rate}%</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{s.total > 0 ? `${Math.round(s.avgElapsed)}%` : '—'}</Text>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
