import { AppShell } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet } from 'react-router-dom';
import { AppHeader } from '@/components/header/AppHeader';
import { AppNav } from '@/components/navigation/AppNav';

export function AppLayout() {
  const [opened, { toggle }] = useDisclosure();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 240,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding={0}
    >
      <AppShell.Header>
        <AppHeader opened={opened} onToggle={toggle} />
      </AppShell.Header>

      <AppShell.Navbar>
        <AppNav />
      </AppShell.Navbar>

      <AppShell.Main
        style={{
          background: 'var(--mantine-color-gray-0)',
          minHeight: 'calc(100vh - 60px)',
        }}
      >
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
