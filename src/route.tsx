import { createBrowserRouter } from 'react-router';
import AppLayout from './AppLayout';
import HomePage from './pages/home';

const router = createBrowserRouter([
  {
    path: '/',
    Component: AppLayout,
    children: [{ index: true, Component: HomePage }],
  },
]);

export default router;
