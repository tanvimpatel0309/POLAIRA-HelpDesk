import { Center, Stack, Title, Text, Button } from '@mantine/core';
import { useNavigate } from 'react-router-dom';

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <Center mih="60vh">
      <Stack align="center" gap="md">
        <Title order={1} fw={900} c="dimmed" style={{ fontSize: 80, lineHeight: 1 }}>
          404
        </Title>
        <Title order={3}>Page not found</Title>
        <Text c="dimmed" ta="center">
          The page you're looking for doesn't exist or you don't have access.
        </Text>
        <Button variant="light" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </Stack>
    </Center>
  );
}
