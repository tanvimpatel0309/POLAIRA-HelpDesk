import {
  Center,
  Card,
  Stack,
  Title,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Anchor,
  ThemeIcon,
  Select,
  Alert,
} from '@mantine/core';
import { useState } from 'react';
import { IconHeadphones, IconAlertCircle, IconCircleCheck } from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addUser } from '@/store/slices/usersSlice';
import { login } from '@/store/slices/authSlice';
import { addLog } from '@/store/slices/auditSlice';

export function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const users = useAppSelector((s) => s.users.users);

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: '' }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email format';
    else if (users.some((u) => u.email.toLowerCase() === form.email.toLowerCase()))
      e.email = 'Email already registered';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Minimum 6 characters';
    if (!form.confirm) e.confirm = 'Please confirm your password';
    else if (form.confirm !== form.password) e.confirm = 'Passwords do not match';
    return e;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    setTimeout(() => {
      dispatch(addUser({ name: form.name.trim(), email: form.email.toLowerCase(), role: 'requester', password: form.password }));
      const newUser = {
        id: `usr-${Date.now()}`,
        name: form.name.trim(),
        email: form.email.toLowerCase(),
        role: 'requester' as const,
        password: form.password,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      dispatch(addLog({
        action: 'User Registered',
        entity: 'User',
        entityId: newUser.id,
        userId: newUser.id,
        userName: newUser.name,
        details: `${newUser.name} registered with role requester`,
      }));
      dispatch(login(newUser));
      setSuccess(true);
      setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
    }, 400);
  }

  return (
    <Center mih="100vh" bg="gray.0">
      <Card withBorder radius="md" p="xl" w={420} shadow="sm">
        <Stack gap="md">
          <Stack align="center" gap="xs" mb="xs">
            <ThemeIcon size={48} radius="md" color="blue" variant="light">
              <IconHeadphones size={28} />
            </ThemeIcon>
            <Title order={2} fw={700}>Create Account</Title>
            <Text size="sm" c="dimmed">Register to submit support tickets</Text>
          </Stack>

          {success && (
            <Alert icon={<IconCircleCheck size={16} />} color="green" variant="light">
              Account created! Redirecting to dashboard…
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
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
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) => set('email', e.currentTarget.value)}
                error={errors.email}
                required
                autoComplete="email"
              />
              <PasswordInput
                label="Password"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={(e) => set('password', e.currentTarget.value)}
                error={errors.password}
                required
                autoComplete="new-password"
              />
              <PasswordInput
                label="Confirm Password"
                placeholder="Repeat password"
                value={form.confirm}
                onChange={(e) => set('confirm', e.currentTarget.value)}
                error={errors.confirm}
                required
                autoComplete="new-password"
              />
              <Select
                label="Role"
                value="requester"
                data={[{ value: 'requester', label: 'Requester' }]}
                disabled
                description="New accounts are created as Requester. An admin can change your role."
              />
              <Button type="submit" fullWidth mt="xs" loading={loading} disabled={success}>
                Create Account
              </Button>
            </Stack>
          </form>

          <Text ta="center" size="sm">
            Already have an account?{' '}
            <Anchor component={Link} to="/login" size="sm">
              Sign in
            </Anchor>
          </Text>
        </Stack>
      </Card>
    </Center>
  );
}
