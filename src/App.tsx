import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { store } from '@/store';
import { router } from '@/router';

const theme = createTheme({
  primaryColor: 'blue',
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  defaultRadius: 'md',
  components: {
    Card: {
      defaultProps: {
        shadow: 'xs',
      },
    },
  },
});

export function App() {
  return (
    <Provider store={store}>
      <MantineProvider theme={theme}>
        <Notifications position="top-right" />
        <RouterProvider router={router} />
      </MantineProvider>
    </Provider>
  );
}
