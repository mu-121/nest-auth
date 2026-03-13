import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './components/Login';
import { Chat } from './components/Chat';

function AppContent() {
  const { user } = useAuth();
  return user ? <Chat /> : <Login />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
