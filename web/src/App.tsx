import { QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { queryClient } from './api/query-client.ts'
import { AuthProvider } from './auth/auth-provider.tsx'
import { RedirectIfLoggedIn } from './auth/redirect-if-logged-in.tsx'
import { RequireAuth } from './auth/require-auth.tsx'
import { AppLayout } from './components/app-layout.tsx'
import { BookingsPage } from './pages/bookings-page.tsx'
import { HomePage } from './pages/home-page.tsx'
import { LoginPage } from './pages/login-page.tsx'
import { NotFoundPage } from './pages/not-found-page.tsx'
import { RegisterPage } from './pages/register-page.tsx'

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      {
        element: <RedirectIfLoggedIn />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
        ],
      },
      {
        element: <RequireAuth />,
        children: [{ path: '/bookings', element: <BookingsPage /> }],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  )
}
