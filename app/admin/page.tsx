'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import Link from 'next/link';

interface ApiKey {
  key: string;
  value: string;
  description: string;
}

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [editedKeys, setEditedKeys] = useState<Record<string, string>>({});

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  const checkAdminAccess = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Check if user has admin metadata
    const userMetadata = (user as any).user_metadata;
    if (!userMetadata?.is_admin) {
      router.push('/dashboard');
      return;
    }

    setIsAdmin(true);
    await fetchApiKeys();
    setLoading(false);
  };

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (!response.ok) {
        // If API fails, use default keys
        const defaultKeys: ApiKey[] = [
          { key: 'leonardo_api_key', value: '', description: 'Leonardo.ai API Key for image generation' },
          { key: 'iconkit_api_key', value: '', description: 'IconKit.ai API Key for icon generation' },
        ];
        setApiKeys(defaultKeys);

        const initialKeys: Record<string, string> = {};
        defaultKeys.forEach((item: ApiKey) => {
          initialKeys[item.key] = '';
        });
        setEditedKeys(initialKeys);

        console.error('Failed to fetch API keys, using defaults');
        return;
      }

      const data = await response.json();
      setApiKeys(data);

      // Initialize edited keys
      const initialKeys: Record<string, string> = {};
      data.forEach((item: ApiKey) => {
        initialKeys[item.key] = item.value || '';
      });
      setEditedKeys(initialKeys);
    } catch (err: any) {
      // On error, still show default inputs
      const defaultKeys: ApiKey[] = [
        { key: 'leonardo_api_key', value: '', description: 'Leonardo.ai API Key for image generation' },
        { key: 'iconkit_api_key', value: '', description: 'IconKit.ai API Key for icon generation' },
      ];
      setApiKeys(defaultKeys);

      const initialKeys: Record<string, string> = {};
      defaultKeys.forEach((item: ApiKey) => {
        initialKeys[item.key] = '';
      });
      setEditedKeys(initialKeys);

      console.error('Error fetching API keys:', err.message);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: editedKeys }),
      });

      if (!response.ok) throw new Error('Failed to save settings');

      setSuccess('API keys saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
              <p className="mt-1 text-sm text-gray-500">Manage platform settings and integrations</p>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-6">
          {/* Integrations Card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">🔌 Integrations</h2>
              <p className="mt-1 text-sm text-gray-600">
                Manage API keys for external services
              </p>
            </div>

            <div className="px-6 py-6">
              {apiKeys.length > 0 && apiKeys[0].value === '' && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                  <strong>⚠️ Authentication Issue Detected</strong>
                  <p className="mt-2">
                    If you just logged in and see empty fields, you may need to clear your browser cookies and log in again.
                    This happens when switching between different Supabase instances.
                  </p>
                  <ol className="mt-2 ml-4 list-decimal space-y-1">
                    <li>Open DevTools (F12) → Application → Storage → Clear site data</li>
                    <li>Refresh the page</li>
                    <li>Log in again with your credentials</li>
                  </ol>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
                  {success}
                </div>
              )}

              <div className="space-y-6">
                {apiKeys.map((apiKey) => (
                  <div key={apiKey.key} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      {apiKey.description}
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="password"
                        value={editedKeys[apiKey.key] || ''}
                        onChange={(e) => setEditedKeys({ ...editedKeys, [apiKey.key]: e.target.value })}
                        placeholder="Enter API key"
                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.querySelector(`input[value="${editedKeys[apiKey.key] || ''}"]`) as HTMLInputElement;
                          if (input) {
                            input.type = input.type === 'password' ? 'text' : 'password';
                          }
                        }}
                        className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        title="Toggle visibility"
                      >
                        👁️
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Key name: <code className="bg-gray-100 px-2 py-1 rounded">{apiKey.key}</code>
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save API Keys'}
                </button>
              </div>
            </div>
          </div>

          {/* Statistics Card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">📊 Platform Statistics</h2>
              <p className="mt-1 text-sm text-gray-600">
                Overview of platform usage
              </p>
            </div>

            <div className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                  <div className="text-sm font-medium text-blue-900 mb-1">Total Users</div>
                  <div className="text-3xl font-bold text-blue-600">1</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                  <div className="text-sm font-medium text-purple-900 mb-1">Total Decks</div>
                  <div className="text-3xl font-bold text-purple-600">0</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                  <div className="text-sm font-medium text-green-900 mb-1">Active Today</div>
                  <div className="text-3xl font-bold text-green-600">1</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
