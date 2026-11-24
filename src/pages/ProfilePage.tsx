import {
  Container,
  Stack,
  Title,
  Text,
  Card,
  Group,
  Button,
  PasswordInput,
  Divider,
  Switch,
  Checkbox,
  SimpleGrid,
  Alert,
  Badge,
  Avatar,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { IconAlertCircle, IconCircleCheck } from '@tabler/icons-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { changePassword, updateNotificationPreferences } from '@/store/slices/usersSlice';
import type { NotificationPreferences } from '@/types';

const DEFAULT_PREFS: NotificationPreferences = {
  enabled: true,
  channels: ['in_app'],
  events: {
    ticketCreated: true,
    ticketAssigned: true,
    statusChanged: true,
    commentAdded: true,
    ticketResolved: true,
  },
};

const roleColors = { admin: 'red', agent: 'blue', requester: 'green' } as const;
const roleLabels = { admin: 'Admin', agent: 'Support Agent', requester: 'Requester' } as const;

export function ProfilePage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const users = useAppSelector((s) => s.users.users);
  const liveUser = users.find((u) => u.id === user?.id);
  const prefs: NotificationPreferences = liveUser?.notificationPreferences ?? DEFAULT_PREFS;

  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [pwSuccess, setPwSuccess] = useState(false);

  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(prefs);

  if (!user) return null;

  function validatePassword() {
    const e: Record<string, string> = {};
    if (!pwForm.current) e.current = 'Current password is required';
    else if (liveUser?.password !== pwForm.current) e.current = 'Current password is incorrect';
    if (!pwForm.newPw) e.newPw = 'New password is required';
    else {
      if (pwForm.newPw.length < 8) e.newPw = 'Minimum 8 characters';
      else if (!/[A-Z]/.test(pwForm.newPw)) e.newPw = 'Must include an uppercase letter';
      else if (!/[a-z]/.test(pwForm.newPw)) e.newPw = 'Must include a lowercase letter';
      else if (!/[0-9]/.test(pwForm.newPw)) e.newPw = 'Must include a number';
      else if (!/[^A-Za-z0-9]/.test(pwForm.newPw)) e.newPw = 'Must include a special character';
    }
    if (!pwForm.confirm) e.confirm = 'Please confirm your new password';
    else if (pwForm.confirm !== pwForm.newPw) e.confirm = 'Passwords do not match';
    return e;
  }

  function handlePasswordChange(ev: React.FormEvent) {
    ev.preventDefault();
    const errs = validatePassword();
    if (Object.keys(errs).length > 0) { setPwErrors(errs); return; }
    if (!user) return;
    dispatch(changePassword({ userId: user.id, newPassword: pwForm.newPw }));
    setPwForm({ current: '', newPw: '', confirm: '' });
    setPwErrors({});
    setPwSuccess(true);
    setTimeout(() => setPwSuccess(false), 4000);
    notifications.show({ title: 'Password updated', message: 'Your password has been changed.', color: 'green' });
  }

  function toggleChannel(ch: 'in_app' | 'email' | 'sms') {
    setNotifPrefs((p) => {
      const has = p.channels.includes(ch);
      return {
        ...p,
        channels: has ? p.channels.filter((c) => c !== ch) : [...p.channels, ch],
      };
    });
  }

  function toggleEvent(key: keyof NotificationPreferences['events']) {
    setNotifPrefs((p) => ({
      ...p,
      events: { ...p.events, [key]: !p.events[key] },
    }));
  }

  function handleSavePrefs() {
    if (!user) return;
    dispatch(updateNotificationPreferences({ userId: user.id, preferences: notifPrefs }));
    notifications.show({ title: 'Preferences saved', message: 'Notification preferences updated.', color: 'green' });
  }

  return (
    <Container size="md" p="lg">
      <Stack gap="lg">
        <div>
          <Title order={2} fw={600}>My Profile</Title>
          <Text c="dimmed" size="sm">Manage your account settings and notification preferences.</Text>
        </div>

        <Card withBorder radius="md" padding="lg">
          <Stack gap="sm">
            <Text fw={600}>Account Information</Text>
            <Divider />
            <Group gap="md">
              <Avatar size={56} radius="xl" color={roleColors[user.role]} name={user.name} />
              <div>
                <Text fw={600}>{user.name}</Text>
                <Text size="sm" c="dimmed">{user.email}</Text>
                <Badge size="xs" color={roleColors[user.role]} variant="light" mt={4}>
                  {roleLabels[user.role]}
                </Badge>
              </div>
            </Group>
          </Stack>
        </Card>

        <Card withBorder radius="md" padding="lg">
          <form onSubmit={handlePasswordChange}>
            <Stack gap="md">
              <Text fw={600}>Change Password</Text>
              <Divider />

              {pwSuccess && (
                <Alert icon={<IconCircleCheck size={16} />} color="green" variant="light">
                  Password changed successfully.
                </Alert>
              )}

              <PasswordInput
                label="Current Password"
                placeholder="Enter your current password"
                value={pwForm.current}
                onChange={(e) => { setPwForm((f) => ({ ...f, current: e.currentTarget.value })); setPwErrors((x) => ({ ...x, current: '' })); }}
                error={pwErrors.current}
                required
              />
              <SimpleGrid cols={2} spacing="md">
                <PasswordInput
                  label="New Password"
                  placeholder="Min. 8 chars, upper, lower, number, special"
                  value={pwForm.newPw}
                  onChange={(e) => { setPwForm((f) => ({ ...f, newPw: e.currentTarget.value })); setPwErrors((x) => ({ ...x, newPw: '' })); }}
                  error={pwErrors.newPw}
                  required
                />
                <PasswordInput
                  label="Confirm New Password"
                  placeholder="Repeat new password"
                  value={pwForm.confirm}
                  onChange={(e) => { setPwForm((f) => ({ ...f, confirm: e.currentTarget.value })); setPwErrors((x) => ({ ...x, confirm: '' })); }}
                  error={pwErrors.confirm}
                  required
                />
              </SimpleGrid>
              <Alert icon={<IconAlertCircle size={14} />} color="blue" variant="light">
                Password must be at least 8 characters and include uppercase, lowercase, number, and special character.
              </Alert>
              <Group justify="flex-end">
                <Button type="submit">Change Password</Button>
              </Group>
            </Stack>
          </form>
        </Card>

        <Card withBorder radius="md" padding="lg">
          <Stack gap="md">
            <Text fw={600}>Notification Preferences</Text>
            <Divider />

            <Switch
              label="Enable notifications"
              description="Receive notifications about ticket activity"
              checked={notifPrefs.enabled}
              onChange={(e) => setNotifPrefs((p) => ({ ...p, enabled: e.currentTarget.checked }))}
            />

            <div>
              <Text size="sm" fw={500} mb="xs">Delivery Channels</Text>
              <Stack gap="xs">
                <Checkbox
                  label="In-app notifications"
                  checked={notifPrefs.channels.includes('in_app')}
                  onChange={() => toggleChannel('in_app')}
                  disabled={!notifPrefs.enabled}
                />
                <Checkbox
                  label="Email (requires email service configuration)"
                  checked={notifPrefs.channels.includes('email')}
                  onChange={() => toggleChannel('email')}
                  disabled={!notifPrefs.enabled}
                />
                <Checkbox
                  label="SMS (requires SMS service configuration)"
                  checked={notifPrefs.channels.includes('sms')}
                  onChange={() => toggleChannel('sms')}
                  disabled={!notifPrefs.enabled}
                />
              </Stack>
            </div>

            <div>
              <Text size="sm" fw={500} mb="xs">Notify me when</Text>
              <Stack gap="xs">
                <Checkbox
                  label="A ticket is created (for agents/admins)"
                  checked={notifPrefs.events.ticketCreated}
                  onChange={() => toggleEvent('ticketCreated')}
                  disabled={!notifPrefs.enabled}
                />
                <Checkbox
                  label="A ticket is assigned to me"
                  checked={notifPrefs.events.ticketAssigned}
                  onChange={() => toggleEvent('ticketAssigned')}
                  disabled={!notifPrefs.enabled}
                />
                <Checkbox
                  label="A ticket status changes"
                  checked={notifPrefs.events.statusChanged}
                  onChange={() => toggleEvent('statusChanged')}
                  disabled={!notifPrefs.enabled}
                />
                <Checkbox
                  label="A comment is added to my ticket"
                  checked={notifPrefs.events.commentAdded}
                  onChange={() => toggleEvent('commentAdded')}
                  disabled={!notifPrefs.enabled}
                />
                <Checkbox
                  label="A ticket I submitted is resolved"
                  checked={notifPrefs.events.ticketResolved}
                  onChange={() => toggleEvent('ticketResolved')}
                  disabled={!notifPrefs.enabled}
                />
              </Stack>
            </div>

            <Group justify="flex-end">
              <Button onClick={handleSavePrefs}>Save Preferences</Button>
            </Group>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
