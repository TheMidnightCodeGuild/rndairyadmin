import { useAuth } from '../lib/auth';
import { useRouter } from 'next/router';

export default function Settings() {
  const { logout } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <div className="space-x-4">
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Back to Dashboard
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-lg text-gray-700">
            This is a protected settings page. You can only see this if you're logged in.
          </p>
        </div>
      </div>
    </div>
  );
} 