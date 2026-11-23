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
  Alert,
  Badge,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { IconPlus, IconEdit, IconTrash, IconAlertCircle } from '@tabler/icons-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addCategory, updateCategory, deleteCategory } from '@/store/slices/categoriesSlice';
import { updateTicketCategory } from '@/store/slices/ticketsSlice';
import { addLog } from '@/store/slices/auditSlice';
import type { Category } from '@/types';
import { formatDate } from '@/utils/format';

const emptyForm = { name: '', description: '' };

export function CategoriesPage() {
  const dispatch = useAppDispatch();
  const categories = useAppSelector((s) => s.categories.categories);
  const tickets = useAppSelector((s) => s.tickets.tickets);
  const admin = useAppSelector((s) => s.auth.user);

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const deletingCategory = categories.find((c) => c.id === deletingId);
  const deletingInUse = tickets.some((t) => t.category === deletingCategory?.name);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    openModal();
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description });
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
    else {
      const dup = categories.find(
        (c) => c.name.toLowerCase() === form.name.toLowerCase() && c.id !== editing?.id
      );
      if (dup) e.name = 'A category with this name already exists';
    }
    return e;
  }

  function handleSave() {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const name = form.name.trim();
    const description = form.description.trim();

    if (editing) {
      if (editing.name !== name) {
        dispatch(updateTicketCategory({ oldCategory: editing.name, newCategory: name }));
      }
      dispatch(updateCategory({ id: editing.id, name, description }));
      dispatch(addLog({
        action: 'Category Updated',
        entity: 'Category',
        entityId: editing.id,
        userId: admin!.id,
        userName: admin!.name,
        details: `Updated category: ${editing.name}${editing.name !== name ? ` → ${name}` : ''}`,
        previousValue: editing.name,
        newValue: name,
      }));
      notifications.show({ title: 'Category updated', message: `"${name}" has been updated.`, color: 'green' });
    } else {
      dispatch(addCategory({ name, description }));
      dispatch(addLog({
        action: 'Category Created',
        entity: 'Category',
        entityId: `cat-${Date.now()}`,
        userId: admin!.id,
        userName: admin!.name,
        details: `Created category: ${name}`,
      }));
      notifications.show({ title: 'Category created', message: `"${name}" has been added.`, color: 'green' });
    }
    closeModal();
  }

  function confirmDelete(id: string) {
    setDeletingId(id);
    openDeleteModal();
  }

  function handleDelete() {
    if (!deletingId || !deletingCategory) return;
    dispatch(deleteCategory(deletingId));
    dispatch(addLog({
      action: 'Category Deleted',
      entity: 'Category',
      entityId: deletingId,
      userId: admin!.id,
      userName: admin!.name,
      details: `Deleted category: ${deletingCategory.name}`,
    }));
    notifications.show({ title: 'Category deleted', message: `"${deletingCategory.name}" has been removed.`, color: 'orange' });
    closeDeleteModal();
    setDeletingId(null);
  }

  return (
    <Container fluid p="lg">
      <Stack gap="lg">
        <Group justify="space-between">
          <div>
            <Title order={2} fw={600}>Categories</Title>
            <Text c="dimmed" size="sm">Manage ticket categories for classification and reporting.</Text>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={openAdd}>
            Add Category
          </Button>
        </Group>

        <Card withBorder radius="md" padding={0}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th>Tickets</Table.Th>
                <Table.Th>Created</Table.Th>
                <Table.Th></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {categories.map((cat) => {
                const count = tickets.filter((t) => t.category === cat.name).length;
                return (
                  <Table.Tr key={cat.id}>
                    <Table.Td><Text size="sm" fw={500}>{cat.name}</Text></Table.Td>
                    <Table.Td><Text size="sm" c="dimmed" lineClamp={1}>{cat.description || '—'}</Text></Table.Td>
                    <Table.Td>
                      <Badge variant="light" color="blue" size="sm">{count}</Badge>
                    </Table.Td>
                    <Table.Td><Text size="xs" c="dimmed">{formatDate(cat.createdAt)}</Text></Table.Td>
                    <Table.Td>
                      <Group gap={4} justify="flex-end">
                        <Tooltip label="Edit">
                          <ActionIcon variant="subtle" color="blue" onClick={() => openEdit(cat)}>
                            <IconEdit size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Delete">
                          <ActionIcon variant="subtle" color="red" onClick={() => confirmDelete(cat.id)}>
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Card>
      </Stack>

      <Modal
        opened={modalOpened}
        onClose={closeModal}
        title={editing ? 'Edit Category' : 'Add Category'}
        size="sm"
      >
        <Stack gap="sm">
          <TextInput
            label="Name"
            placeholder="e.g. Network Issues"
            value={form.name}
            onChange={(e) => set('name', e.currentTarget.value)}
            error={errors.name}
            required
          />
          <Textarea
            label="Description"
            placeholder="Brief description of this category"
            value={form.description}
            onChange={(e) => set('description', e.currentTarget.value)}
            rows={3}
          />
          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? 'Save Changes' : 'Create Category'}</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title="Delete Category"
        size="sm"
      >
        <Stack gap="md">
          {deletingInUse ? (
            <Alert icon={<IconAlertCircle size={16} />} color="orange" variant="light">
              <strong>{deletingCategory?.name}</strong> is used by existing tickets. Deleting it will not affect those tickets, but it will no longer be available for new tickets.
            </Alert>
          ) : (
            <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
              Are you sure you want to delete <strong>{deletingCategory?.name}</strong>? This action cannot be undone.
            </Alert>
          )}
          <Group justify="flex-end">
            <Button variant="default" onClick={closeDeleteModal}>Cancel</Button>
            <Button color="red" onClick={handleDelete}>Delete</Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
