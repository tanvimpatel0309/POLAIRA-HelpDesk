import {
  Container,
  Stack,
  Title,
  Text,
  Card,
  Group,
  Button,
  Table,
  ActionIcon,
  Tooltip,
  Modal,
  Textarea,
  Badge,
  Checkbox,
  SimpleGrid,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { IconEdit, IconShield } from '@tabler/icons-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateStatusTransitions, updateStatusDescription } from '@/store/slices/statusesSlice';
import { addLog } from '@/store/slices/auditSlice';
import type { StatusConfig, TicketStatus } from '@/types';

const ALL_STATUSES: { value: TicketStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
  { value: 'reopened', label: 'Reopened' },
];

const statusColors: Record<TicketStatus, string> = {
  new: 'blue',
  open: 'cyan',
  in_progress: 'yellow',
  resolved: 'green',
  closed: 'gray',
  reopened: 'grape',
};

export function StatusesPage() {
  const dispatch = useAppDispatch();
  const statuses = useAppSelector((s) => s.statuses.statuses);
  const admin = useAppSelector((s) => s.auth.user);

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editing, setEditing] = useState<StatusConfig | null>(null);
  const [description, setDescription] = useState('');
  const [transitions, setTransitions] = useState<TicketStatus[]>([]);

  function openEdit(s: StatusConfig) {
    setEditing(s);
    setDescription(s.description);
    setTransitions([...s.allowedTransitions]);
    openModal();
  }

  function toggleTransition(key: TicketStatus) {
    setTransitions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  function handleSave() {
    if (!editing) return;
    dispatch(updateStatusDescription({ id: editing.id, description }));
    dispatch(updateStatusTransitions({ id: editing.id, allowedTransitions: transitions }));
    dispatch(addLog({
      action: 'Status Updated',
      entity: 'Status',
      entityId: editing.id,
      userId: admin!.id,
      userName: admin!.name,
      details: `Updated status "${editing.name}": transitions → [${transitions.join(', ')}]`,
      previousValue: editing.allowedTransitions.join(', '),
      newValue: transitions.join(', '),
    }));
    notifications.show({ title: 'Status updated', message: `"${editing.name}" has been updated.`, color: 'green' });
    closeModal();
  }

  return (
    <Container fluid p="lg">
      <Stack gap="lg">
        <div>
          <Title order={2} fw={600}>Ticket Statuses</Title>
          <Text c="dimmed" size="sm">
            Configure status descriptions and allowed lifecycle transitions.
          </Text>
        </div>

        <Card withBorder radius="md" padding={0}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Status</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th>Allowed Transitions</Table.Th>
                <Table.Th>System</Table.Th>
                <Table.Th></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {statuses.map((s) => (
                <Table.Tr key={s.id}>
                  <Table.Td>
                    <Badge color={statusColors[s.key]} variant="light" size="sm">
                      {s.name}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed" lineClamp={2} maw={280}>{s.description || '—'}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4} wrap="wrap">
                      {s.allowedTransitions.length === 0 ? (
                        <Text size="xs" c="dimmed">None</Text>
                      ) : (
                        s.allowedTransitions.map((t) => (
                          <Badge key={t} color={statusColors[t]} variant="outline" size="xs">{t}</Badge>
                        ))
                      )}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    {s.isSystem && (
                      <Tooltip label="System-managed status">
                        <IconShield size={16} color="var(--mantine-color-gray-5)" />
                      </Tooltip>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Tooltip label="Edit transitions & description">
                      <ActionIcon variant="subtle" color="blue" onClick={() => openEdit(s)}>
                        <IconEdit size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      </Stack>

      <Modal
        opened={modalOpened}
        onClose={closeModal}
        title={editing ? `Edit Status: ${editing.name}` : 'Edit Status'}
        size="md"
      >
        <Stack gap="md">
          <Textarea
            label="Description"
            placeholder="Describe when this status applies"
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            rows={3}
          />

          <div>
            <Text size="sm" fw={500} mb="xs">Allowed Transitions</Text>
            <Text size="xs" c="dimmed" mb="sm">
              Select which statuses this status can transition to.
            </Text>
            <SimpleGrid cols={2} spacing="xs">
              {ALL_STATUSES.filter((opt) => opt.value !== editing?.key).map((opt) => (
                <Checkbox
                  key={opt.value}
                  label={
                    <Group gap={6}>
                      <Badge color={statusColors[opt.value]} variant="light" size="xs">
                        {opt.label}
                      </Badge>
                    </Group>
                  }
                  checked={transitions.includes(opt.value)}
                  onChange={() => toggleTransition(opt.value)}
                />
              ))}
            </SimpleGrid>
          </div>

          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
