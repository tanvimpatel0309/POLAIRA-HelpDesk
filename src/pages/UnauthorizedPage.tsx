import { Center, Stack, Title, Text, Button } from '@mantine/core';
import { IconLock } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

export function UnauthorizedPage() {
  const navigate = useNavigate();
  return (
    <Center mih="60vh">
      <Stack align="center" gap="md">
        <IconLock size={64} color="var(--mantine-color-gray-4)" />
        <Title order={3}>Access Denied</Title>
        <Text c="dimmed" ta="center">
          You don't have permission to view this page.
        </Text>
        <Button variant="light" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </Stack>
    </Center>
  );
}
