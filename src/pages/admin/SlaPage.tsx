import {
  Container,
  Stack,
  Title,
  Text,
  Card,
  Group,
  Button,
  NumberInput,
  Table,
  Badge,
  Alert,
  Divider,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { IconClock, IconInfoCircle } from '@tabler/icons-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateSlaConfig } from '@/store/slices/slaSlice';
import { addLog } from '@/store/slices/auditSlice';
import type { TicketPriority } from '@/types';

const priorityOrder: TicketPriority[] = ['critical', 'high', 'medium', 'low'];

const priorityColors: Record<TicketPriority, string> = {
  critical: 'red',
  high: 'orange',
  medium: 'yellow',
  low: 'blue',
};

const priorityLabels: Record<TicketPriority, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export function SlaPage() {
  const dispatch = useAppDispatch();
  const admin = useAppSelector((s) => s.auth.user);
  const slaConfigs = useAppSelector((s) => s.sla.configs);

  const [edited, setEdited] = useState<Record<TicketPriority, number>>(
    () => Object.fromEntries(slaConfigs.map((c) => [c.priority, c.resolutionHours])) as Record<TicketPriority, number>
  );

  function handleSave() {
    for (const priority of priorityOrder) {
      const cfg = slaConfigs.find((c) => c.priority === priority);
      if (cfg && cfg.resolutionHours !== edited[priority]) {
        dispatch(updateSlaConfig({ priority, resolutionHours: edited[priority] }));
        dispatch(addLog({
          action: 'SLA Config Updated',
          entity: 'SlaConfig',
          entityId: cfg.id,
          userId: admin!.id,
          userName: admin!.name,
          details: `Updated SLA for ${priority} priority from ${cfg.resolutionHours}h to ${edited[priority]}h`,
          previousValue: `${cfg.resolutionHours}h`,
          newValue: `${edited[priority]}h`,
        }));
      }
    }
    notifications.show({ title: 'SLA configs saved', message: 'SLA parameters have been updated.', color: 'green' });
  }

  function formatTarget(hours: number) {
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d ${hours % 24 > 0 ? `${hours % 24}h` : ''}`.trim();
  }

  return (
    <Container fluid p="lg" maw={700}>
      <Stack gap="lg">
        <div>
          <Title order={2} fw={600}>SLA Configuration</Title>
          <Text c="dimmed" size="sm">
            Define resolution time targets per ticket priority. Tickets breaching these targets trigger alerts.
          </Text>
        </div>

        <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
          SLA timers start when a ticket is created. The timer stops when the ticket is resolved or closed.
          Tickets near breach (75%+ elapsed) are highlighted in amber; breached tickets are highlighted in red.
        </Alert>

        <Card withBorder radius="md" padding="lg">
          <Stack gap="md">
            <Group gap="xs">
              <IconClock size={18} />
              <Text fw={600}>Resolution Time Targets</Text>
            </Group>
            <Divider />

            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Priority</Table.Th>
                  <Table.Th>Current Target</Table.Th>
                  <Table.Th>New Target (hours)</Table.Th>
                  <Table.Th>Last Updated</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {priorityOrder.map((priority) => {
                  const cfg = slaConfigs.find((c) => c.priority === priority);
                  if (!cfg) return null;
                  return (
                    <Table.Tr key={priority}>
                      <Table.Td>
                        <Badge color={priorityColors[priority]} variant="light">
                          {priorityLabels[priority]}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{formatTarget(cfg.resolutionHours)}</Text>
                      </Table.Td>
                      <Table.Td>
                        <NumberInput
                          value={edited[priority]}
                          onChange={(v) => setEdited((e) => ({ ...e, [priority]: Number(v) || 1 }))}
                          min={1}
                          max={720}
                          w={120}
                          size="xs"
                          suffix=" h"
                        />
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" c="dimmed">
                          {new Date(cfg.updatedAt).toLocaleDateString()}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>

            <Group justify="flex-end">
              <Button onClick={handleSave}>Save SLA Targets</Button>
            </Group>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
