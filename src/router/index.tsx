import { createBrowserRouter } from 'react-router'
import MainLayout from '../layouts/MainLayout'
import Login from '../pages/Login'
import Register from '../pages/Register'

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: Login,
  },
  {
    path: '/register',
    Component: Register,
  },
  {
    path: '/',
    Component: MainLayout,
    children: [
      {
        index: true,
        lazy: async () => {
          const mod = await import('../pages/Home');
          return { Component: mod.default };
        }
      },
      {
        path: '/image',
        lazy: async () => {
          const mod = await import('../pages/ImageTool');
          return { Component: mod.default };
        }
      },
      {
        path: '/json',
        lazy: async () => {
          const mod = await import('../pages/JsonTool');
          return { Component: mod.default };
        }
      },
      {
        path: '/text',
        lazy: async () => {
          const mod = await import('../pages/TextTool');
          return { Component: mod.default };
        }
      },
      {
        path: '/time',
        lazy: async () => {
          const mod = await import('../pages/TimeTool');
          return { Component: mod.default };
        }
      },
    ]
  },
])
