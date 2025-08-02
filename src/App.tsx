import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <PrivateRoute>
        <Dashboard />
      </PrivateRoute>
    </AuthProvider>
  );
}

export default App;
