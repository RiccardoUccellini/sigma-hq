import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { currentUser, logout } = useAuth();

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">SIGMA HQ Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Welcome, {currentUser?.email}
              </span>
              <button
                onClick={handleLogout}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome to SIGMA HQ!
              </h2>
              <p className="text-gray-600 mb-4">
                You're successfully authenticated with Firebase.
              </p>
              <p className="text-sm text-gray-500">
                User ID: {currentUser?.uid}
              </p>
              <div className="mt-6 space-y-2">
                <p className="text-sm text-gray-600">Ready to build something amazing?</p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>✅ React + TypeScript</li>
                  <li>✅ Vite for fast development</li>
                  <li>✅ Firebase Authentication</li>
                  <li>✅ Firestore Database ready</li>
                  <li>✅ Firebase Storage ready</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
