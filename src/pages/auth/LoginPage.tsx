import {
  Center,
  Card,
  Stack,
  Title,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Group,
  Anchor,
  ThemeIcon,
  Divider,
  SimpleGrid,
  Badge,
  Alert,
} from '@mantine/core';
import { useState } from 'react';
import { IconHeadphones, IconAlertCircle } from '@tabler/icons-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { login } from '@/store/slices/authSlice';
import type { UserRole } from '@/types';

const demoAccounts = [
  { role: 'admin' as UserRole, label: 'Admin', email: 'admin@helpdesk.io', color: 'red' },
  { role: 'agent' as UserRole, label: 'Support Agent', email: 'agent@helpdesk.io', color: 'blue' },
  { role: 'requester' as UserRole, label: 'Requester', email: 'user@helpdesk.io', color: 'green' },
];

export function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const users = useAppSelector((s) => s.users.users);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email format';
    if (!password) e.password = 'Password is required';
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    setTimeout(() => {
      const user = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password && u.isActive
      );
      if (!user) {
        setErrors({ form: 'Invalid email or password. Try password: "password"' });
        setLoading(false);
        return;
      }
      dispatch(login(user));
      navigate('/dashboard', { replace: true });
    }, 400);
  }

  function handleDemo(role: UserRole) {
    const user = users.find((u) => u.role === role && u.isActive);
    if (user) {
      dispatch(login(user));
      navigate('/dashboard', { replace: true });
    }
  }

  return (
    <Center mih="100vh" bg="gray.0">
      <Card withBorder radius="md" p="xl" w={420} shadow="sm">
        <Stack gap="md">
          <Group justify="center" mb="xs">
            <ThemeIcon size={48} radius="md" color="blue" variant="light">
              <IconHeadphones size={28} />
            </ThemeIcon>
          </Group>

          <Stack gap={4} ta="center">
            <Title order={2} fw={700}>HelpDesk</Title>
            <Text size="sm" c="dimmed">Sign in to your account</Text>
          </Stack>

          {errors.form && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
              {errors.form}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack gap="sm">
              <TextInput
                label="Email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => { setEmail(e.currentTarget.value); setErrors((x) => ({ ...x, email: undefined, form: undefined })); }}
                error={errors.email}
                autoComplete="email"
              />
              <PasswordInput
                label="Password"
                placeholder="Your password"
                value={password}
                onChange={(e) => { setPassword(e.currentTarget.value); setErrors((x) => ({ ...x, password: undefined, form: undefined })); }}
                error={errors.password}
                autoComplete="current-password"
              />
              <Button type="submit" fullWidth mt="xs" loading={loading}>
                Sign in
              </Button>
            </Stack>
          </form>

          <Text ta="center" size="sm">
            Don't have an account?{' '}
            <Anchor component={Link} to="/register" size="sm">
              Register
            </Anchor>
          </Text>

          <Divider label="Quick demo access" labelPosition="center" />

          <SimpleGrid cols={3} spacing="xs">
            {demoAccounts.map((a) => (
              <Button
                key={a.role}
                variant="light"
                color={a.color}
                size="xs"
                onClick={() => handleDemo(a.role)}
              >
                <Stack gap={2} align="center">
                  <Badge size="xs" color={a.color} variant="filled">{a.label}</Badge>
                  <Text size="xs" c="dimmed">{a.email}</Text>
                </Stack>
              </Button>
            ))}
          </SimpleGrid>
        </Stack>
      </Card>
    </Center>
  );
}
