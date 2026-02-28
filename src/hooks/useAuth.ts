// Re-export from the AuthContext singleton.
// All components that import useAuth get the same shared auth state.
export { useAuth } from '@/context/AuthContext'
