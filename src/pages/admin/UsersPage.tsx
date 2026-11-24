import {
  Container,
  Stack,
  Title,
  Text,
  Card,
  Group,
  Button,
  Table,
  Badge,
  Avatar,
  ActionIcon,
  Tooltip,
  Modal,
  TextInput,
  Select,
  Switch,
  PasswordInput,
  Alert,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { IconPlus, IconEdit, IconTrash, IconAlertCircle } from '@tabler/icons-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addUser, updateUser, deleteUser } from '@/store/slices/usersSlice';
import { addLog } from '@/store/slices/auditSlice';
import type { User, UserRole } from '@/types';
import { formatDate } from '@/utils/format';

const roleColors: Record<UserRole, string> = {
  admin: 'red',
  agent: 'blue',
  requester: 'green',
};

const roleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  agent: 'Support Agent',
  requester: 'Requester',
};

const emptyForm = { name: '', email: '', password: '', role: 'requester' as UserRole, isActive: true };

export function UsersPage() {
  const dispatch = useAppDispatch();
  const users = useAppSelector((s) => s.users.users);
  const admin = useAppSelector((s) => s.auth.user);

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const deletingUser = users.find((u) => u.id === deletingId);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    openModal();
  }

  function openEdit(user: User) {
    setEditing(user);
    setForm({ name: user.name, email: user.email, password: '', role: user.role, isActive: user.isActive });
    setErrors({});
    openModal();
  }

  function set(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: '' }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email format';
    else {
      const dup = users.find(
        (u) => u.email.toLowerCase() === form.email.toLowerCase() && u.id !== editing?.id
      );
      if (dup) e.email = 'Email already in use';
    }
    if (!editing && !form.password) e.password = 'Password is required';
    return e;
  }

  function handleSave() {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    if (editing) {
      dispatch(updateUser({
        id: editing.id,
        name: form.name.trim(),
        email: form.email.toLowerCase(),
        role: form.role,
        isActive: form.isActive,
        ...(form.password ? { password: form.password } : {}),
      }));
      dispatch(addLog({
        action: 'User Updated',
        entity: 'User',
        entityId: editing.id,
        userId: admin!.id,
        userName: admin!.name,
        details: `Updated user ${form.name} (role: ${form.role})`,
        previousValue: editing.role,
        newValue: form.role,
      }));
      notifications.show({ title: 'User updated', message: `${form.name} has been updated.`, color: 'green' });
    } else {
      dispatch(addUser({ name: form.name.trim(), email: form.email.toLowerCase(), role: form.role, password: form.password }));
      dispatch(addLog({
        action: 'User Created',
        entity: 'User',
        entityId: `usr-${Date.now()}`,
        userId: admin!.id,
        userName: admin!.name,
        details: `Created user ${form.name} with role ${form.role}`,
      }));
      notifications.show({ title: 'User created', message: `${form.name} has been added.`, color: 'green' });
    }
    closeModal();
  }

  function confirmDelete(id: string) {
    setDeletingId(id);
    openDeleteModal();
  }

  function handleDelete() {
    if (!deletingId || !deletingUser) return;
    if (deletingUser.id === admin?.id) {
      notifications.show({ title: 'Cannot delete', message: 'You cannot delete your own account.', color: 'red' });
      closeDeleteModal();
      return;
    }
    dispatch(deleteUser(deletingId));
    dispatch(addLog({
      action: 'User Deleted',
      entity: 'User',
      entityId: deletingId,
      userId: admin!.id,
      userName: admin!.name,
      details: `Deleted user ${deletingUser.name}`,
    }));
    notifications.show({ title: 'User deleted', message: `${deletingUser.name} has been removed.`, color: 'orange' });
    closeDeleteModal();
    setDeletingId(null);
  }

  return (
    <Container fluid p="lg">
      <Stack gap="lg">
        <Group justify="space-between">
          <div>
            <Title order={2} fw={600}>Users</Title>
            <Text c="dimmed" size="sm">Manage user accounts and role assignments.</Text>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={openAdd}>
            Add User
          </Button>
        </Group>

        <Card withBorder radius="md" padding={0}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>User</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Role</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Created</Table.Th>
                <Table.Th></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {users.map((u) => (
                <Table.Tr key={u.id}>
                  <Table.Td>
                    <Group gap="sm">
                      <Avatar size={32} radius="xl" color={roleColors[u.role]} name={u.name} />
                      <Text size="sm" fw={500}>{u.name}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td><Text size="sm" c="dimmed">{u.email}</Text></Table.Td>
                  <Table.Td>
                    <Badge color={roleColors[u.role]} variant="light" size="sm">
                      {roleLabels[u.role]}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={u.isActive ? 'green' : 'gray'} variant="dot" size="sm">
                      {u.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </Table.Td>
                  <Table.Td><Text size="xs" c="dimmed">{formatDate(u.createdAt)}</Text></Table.Td>
                  <Table.Td>
                    <Group gap={4} justify="flex-end">
                      <Tooltip label="Edit">
                        <ActionIcon variant="subtle" color="blue" onClick={() => openEdit(u)}>
                          <IconEdit size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Delete">
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => confirmDelete(u.id)}
                          disabled={u.id === admin?.id}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
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
        title={editing ? 'Edit User' : 'Add User'}
        size="sm"
      >
        <Stack gap="sm">
          <TextInput
            label="Full Name"
            placeholder="Jane Smith"
            value={form.name}
            onChange={(e) => set('name', e.currentTarget.value)}
            error={errors.name}
            required
          />
          <TextInput
            label="Email"
            placeholder="jane@company.com"
            value={form.email}
            onChange={(e) => set('email', e.currentTarget.value)}
            error={errors.email}
            required
          />
          <PasswordInput
            label={editing ? 'New Password (leave blank to keep current)' : 'Password'}
            placeholder={editing ? 'Leave blank to keep current' : 'Min. 6 characters'}
            value={form.password}
            onChange={(e) => set('password', e.currentTarget.value)}
            error={errors.password}
          />
          <Select
            label="Role"
            data={[
              { value: 'admin', label: 'Admin' },
              { value: 'agent', label: 'Support Agent' },
              { value: 'requester', label: 'Requester' },
            ]}
            value={form.role}
            onChange={(v) => set('role', v as UserRole)}
          />
          {editing && (
            <Switch
              label="Active"
              checked={form.isActive}
              onChange={(e) => set('isActive', e.currentTarget.checked)}
            />
          )}
          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? 'Save Changes' : 'Create User'}</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title="Delete User"
        size="sm"
      >
        <Stack gap="md">
          <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
            Are you sure you want to delete <strong>{deletingUser?.name}</strong>? This action cannot be undone.
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
