import {
  Container,
  Stack,
  Title,
  Text,
  Card,
  Group,
  Button,
  Switch,
  NumberInput,
  Select,
  Divider,
  SimpleGrid,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateSettings } from '@/store/slices/settingsSlice';
import { addLog } from '@/store/slices/auditSlice';

export function SettingsPage() {
  const dispatch = useAppDispatch();
  const settings = useAppSelector((s) => s.settings);
  const categories = useAppSelector((s) => s.categories.categories);
  const admin = useAppSelector((s) => s.auth.user);

  const [form, setForm] = useState({
    attachmentsEnabled: settings.attachmentsEnabled,
    notificationsEnabled: settings.notificationsEnabled,
    maxAttachmentSizeMB: settings.maxAttachmentSizeMB,
    allowedFileTypes: settings.allowedFileTypes ?? [],
    defaultPriority: settings.defaultPriority,
    defaultCategory: settings.defaultCategory,
    autoAssignEnabled: settings.autoAssignEnabled ?? false,
  });

  const categoryOptions = categories.map((c) => ({ value: c.name, label: c.name }));

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' },
  ];

  function handleSave() {
    dispatch(updateSettings(form));
    dispatch(addLog({
      action: 'Settings Updated',
      entity: 'SystemSettings',
      entityId: 'settings',
      userId: admin!.id,
      userName: admin!.name,
      details: `Updated system settings: attachments=${form.attachmentsEnabled}, notifications=${form.notificationsEnabled}, maxAttachmentSizeMB=${form.maxAttachmentSizeMB}, autoAssign=${form.autoAssignEnabled}`,
    }));
    notifications.show({
      title: 'Settings saved',
      message: 'System configuration has been updated.',
      color: 'green',
    });
  }

  return (
    <Container fluid p="lg" maw={700}>
      <Stack gap="lg">
        <div>
          <Title order={2} fw={600}>System Settings</Title>
          <Text c="dimmed" size="sm">Configure system-wide behaviour for the helpdesk.</Text>
        </div>

        <Card withBorder radius="md" padding="lg">
          <Stack gap="lg">
            <div>
              <Text fw={600} size="sm" mb="xs">Features</Text>
              <Divider mb="md" />
              <Stack gap="md">
                <Switch
                  label="Attachments"
                  description="Allow users to upload files with tickets and comments"
                  checked={form.attachmentsEnabled}
                  onChange={(e) => setForm((f) => ({ ...f, attachmentsEnabled: e.currentTarget.checked }))}
                />
                <Switch
                  label="In-app Notifications"
                  description="Enable the notification bell and push notifications within the app"
                  checked={form.notificationsEnabled}
                  onChange={(e) => setForm((f) => ({ ...f, notificationsEnabled: e.currentTarget.checked }))}
                />
                <Switch
                  label="Auto-assign Tickets"
                  description="Automatically assign new tickets to the least-busy active support agent"
                  checked={form.autoAssignEnabled}
                  onChange={(e) => setForm((f) => ({ ...f, autoAssignEnabled: e.currentTarget.checked }))}
                />
              </Stack>
            </div>

            <div>
              <Text fw={600} size="sm" mb="xs">Attachment Limits</Text>
              <Divider mb="md" />
              <NumberInput
                label="Maximum attachment size (MB)"
                description="Files larger than this will be rejected"
                value={form.maxAttachmentSizeMB}
                onChange={(v) => setForm((f) => ({ ...f, maxAttachmentSizeMB: Number(v) || 1 }))}
                min={1}
                max={100}
                w={200}
                disabled={!form.attachmentsEnabled}
              />
            </div>

            <div>
              <Text fw={600} size="sm" mb="xs">Ticket Defaults</Text>
              <Divider mb="md" />
              <SimpleGrid cols={2} spacing="md">
                <Select
                  label="Default Priority"
                  description="Pre-selected priority when creating a new ticket"
                  data={priorityOptions}
                  value={form.defaultPriority}
                  onChange={(v) => setForm((f) => ({ ...f, defaultPriority: (v ?? 'medium') as typeof form.defaultPriority }))}
                />
                <Select
                  label="Default Category"
                  description="Pre-selected category when creating a new ticket"
                  data={categoryOptions}
                  value={form.defaultCategory}
                  onChange={(v) => setForm((f) => ({ ...f, defaultCategory: v ?? '' }))}
                  clearable
                />
              </SimpleGrid>
            </div>

            <Group justify="flex-end">
              <Button onClick={handleSave}>Save Settings</Button>
            </Group>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
