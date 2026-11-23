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
  TextInput,
  Textarea,
  Select,
  Alert,
  ColorSwatch,
  Badge,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { IconPlus, IconEdit, IconTrash, IconAlertCircle, IconShield } from '@tabler/icons-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addPriority, updatePriority, deletePriority } from '@/store/slices/prioritiesSlice';
import { addLog } from '@/store/slices/auditSlice';
import type { PriorityConfig, TicketPriority } from '@/types';
import { formatDate } from '@/utils/format';

const SYSTEM_IDS = new Set(['pri-001', 'pri-002', 'pri-003', 'pri-004']);

const colorOptions = [
  { value: 'blue', label: 'Blue' },
  { value: 'cyan', label: 'Cyan' },
  { value: 'teal', label: 'Teal' },
  { value: 'green', label: 'Green' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'orange', label: 'Orange' },
  { value: 'red', label: 'Red' },
  { value: 'grape', label: 'Purple' },
  { value: 'gray', label: 'Gray' },
];

const levelOptions: { value: TicketPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const emptyForm = { name: '', level: 'medium' as TicketPriority, description: '', color: 'blue' };

export function PrioritiesPage() {
  const dispatch = useAppDispatch();
  const priorities = useAppSelector((s) => s.priorities.priorities);
  const admin = useAppSelector((s) => s.auth.user);

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [editing, setEditing] = useState<PriorityConfig | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const deletingPriority = priorities.find((p) => p.id === deletingId);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    openModal();
  }

  function openEdit(p: PriorityConfig) {
    setEditing(p);
    setForm({ name: p.name, level: p.level, description: p.description, color: p.color });
    setErrors({});
    openModal();
  }

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: '' }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    return e;
  }

  function handleSave() {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    if (editing) {
      dispatch(updatePriority({ id: editing.id, name: form.name.trim(), description: form.description.trim(), color: form.color }));
      dispatch(addLog({
        action: 'Priority Updated',
        entity: 'Priority',
        entityId: editing.id,
        userId: admin!.id,
        userName: admin!.name,
        details: `Updated priority "${editing.name}" → "${form.name}"`,
        previousValue: editing.name,
        newValue: form.name.trim(),
      }));
      notifications.show({ title: 'Priority updated', message: `"${form.name}" has been updated.`, color: 'green' });
    } else {
      dispatch(addPriority({ name: form.name.trim(), level: form.level, description: form.description.trim(), color: form.color }));
      dispatch(addLog({
        action: 'Priority Created',
        entity: 'Priority',
        entityId: `pri-${Date.now()}`,
        userId: admin!.id,
        userName: admin!.name,
        details: `Created priority "${form.name}" (level: ${form.level})`,
      }));
      notifications.show({ title: 'Priority created', message: `"${form.name}" has been added.`, color: 'green' });
    }
    closeModal();
  }

  function confirmDelete(id: string) {
    setDeletingId(id);
    openDeleteModal();
  }

  function handleDelete() {
    if (!deletingId || !deletingPriority) return;
    dispatch(deletePriority(deletingId));
    dispatch(addLog({
      action: 'Priority Deleted',
      entity: 'Priority',
      entityId: deletingId,
      userId: admin!.id,
      userName: admin!.name,
      details: `Deleted priority "${deletingPriority.name}"`,
    }));
    notifications.show({ title: 'Priority deleted', message: `"${deletingPriority.name}" has been removed.`, color: 'orange' });
    closeDeleteModal();
    setDeletingId(null);
  }

  return (
    <Container fluid p="lg">
      <Stack gap="lg">
        <Group justify="space-between">
          <div>
            <Title order={2} fw={600}>Priorities</Title>
            <Text c="dimmed" size="sm">Manage ticket priority levels and their descriptions.</Text>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={openAdd}>
            Add Priority
          </Button>
        </Group>

        <Card withBorder radius="md" padding={0}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Level</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th>Color</Table.Th>
                <Table.Th>Created</Table.Th>
                <Table.Th></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {priorities.map((p) => (
                <Table.Tr key={p.id}>
                  <Table.Td>
                    <Group gap="xs">
                      <Text size="sm" fw={500}>{p.name}</Text>
                      {SYSTEM_IDS.has(p.id) && (
                        <Tooltip label="System priority">
                          <IconShield size={14} color="var(--mantine-color-gray-5)" />
                        </Tooltip>
                      )}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={p.color} variant="filled" size="sm">{p.level}</Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed" lineClamp={1}>{p.description || '—'}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ColorSwatch color={`var(--mantine-color-${p.color}-5)`} size={16} />
                      <Text size="xs" c="dimmed">{p.color}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td><Text size="xs" c="dimmed">{formatDate(p.createdAt)}</Text></Table.Td>
                  <Table.Td>
                    <Group gap={4} justify="flex-end">
                      <Tooltip label="Edit">
                        <ActionIcon variant="subtle" color="blue" onClick={() => openEdit(p)}>
                          <IconEdit size={16} />
                        </ActionIcon>
                      </Tooltip>
                      {!SYSTEM_IDS.has(p.id) && (
                        <Tooltip label="Delete">
                          <ActionIcon variant="subtle" color="red" onClick={() => confirmDelete(p.id)}>
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </Group>
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
        title={editing ? 'Edit Priority' : 'Add Priority'}
        size="sm"
      >
        <Stack gap="sm">
          <TextInput
            label="Name"
            placeholder="e.g. Urgent"
            value={form.name}
            onChange={(e) => set('name', e.currentTarget.value)}
            error={errors.name}
            required
          />
          {!editing && (
            <Select
              label="Level"
              data={levelOptions}
              value={form.level}
              onChange={(v) => set('level', v!)}
              description="Maps to the system ticket priority value"
            />
          )}
          <Textarea
            label="Description"
            placeholder="Describe when this priority should be used"
            value={form.description}
            onChange={(e) => set('description', e.currentTarget.value)}
            rows={3}
          />
          <Select
            label="Color"
            data={colorOptions}
            value={form.color}
            onChange={(v) => set('color', v!)}
          />
          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? 'Save Changes' : 'Create Priority'}</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title="Delete Priority"
        size="sm"
      >
        <Stack gap="md">
          <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
            Are you sure you want to delete <strong>{deletingPriority?.name}</strong>? This action cannot be undone.
          </Alert>
          <Group justify="flex-end">
            <Button variant="default" onClick={closeDeleteModal}>Cancel</Button>
            <Button color="red" onClick={handleDelete}>Delete</Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
