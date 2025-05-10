import { useEffect } from 'react'
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import Auth from './pages/Auth'
import Home from './pages/Home'
import EventDetails from './pages/EventDetails'
import CreateEvent from './pages/CreateEvent'
import Profile from './pages/Profile'
import Layout from './components/Layout'
import DJPage from './pages/DJPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" />
}

function DJRoute() {
  const { eventId } = useParams();
  return (
    <PrivateRoute>
      <Layout>
        <DJPage eventId={eventId!} />
      </Layout>
    </PrivateRoute>
  );
}

function App() {
  const { initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <Routes>
      <Route path="/auth/*" element={<Auth />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout>
              <Home />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/events/:eventId"
        element={
          <PrivateRoute>
            <Layout>
              <EventDetails />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/create-event"
        element={
          <PrivateRoute>
            <Layout>
              <CreateEvent />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <Layout>
              <Profile />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route path="/dj/:eventId" element={<DJRoute />} />
    </Routes>
  )
}

export default App 