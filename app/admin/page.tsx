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
  const [prompts, setPrompts] = useState<Record<string, string>>({
    claude_system_prompt: '',
    leonardo_generation_prompt: '',
    iconkit_generation_prompt: '',
  });

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
          { key: 'claude_api_key', value: '', description: 'Anthropic Claude API Key for AI content generation' },
          { key: 'openai_api_key', value: '', description: 'OpenAI API Key for DALL-E 3 image generation (Recommended - Best Quality)' },
          { key: 'leonardo_api_key', value: '', description: 'Leonardo.ai API Key for image generation (Alternative)' },
          { key: 'iconkit_api_key', value: '', description: 'IconKit.ai API Key for icon generation (Alternative)' },
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

      // Separate API keys from prompts
      const keys = data.filter((item: ApiKey) =>
        item.key.endsWith('_api_key')
      );
      const promptSettings = data.filter((item: ApiKey) =>
        item.key.includes('_prompt')
      );

      setApiKeys(keys);

      // Initialize edited keys
      const initialKeys: Record<string, string> = {};
      keys.forEach((item: ApiKey) => {
        initialKeys[item.key] = item.value || '';
      });
      setEditedKeys(initialKeys);

      // Initialize prompts
      const initialPrompts: Record<string, string> = {
        claude_system_prompt: '',
        leonardo_generation_prompt: '',
        iconkit_generation_prompt: '',
      };
      promptSettings.forEach((item: ApiKey) => {
        initialPrompts[item.key] = item.value || '';
      });
      setPrompts(initialPrompts);
    } catch (err: any) {
      // On error, still show default inputs
      const defaultKeys: ApiKey[] = [
        { key: 'claude_api_key', value: '', description: 'Anthropic Claude API Key for AI content generation' },
        { key: 'openai_api_key', value: '', description: 'OpenAI API Key for DALL-E 3 image generation (Recommended - Best Quality)' },
        { key: 'leonardo_api_key', value: '', description: 'Leonardo.ai API Key for image generation (Alternative)' },
        { key: 'iconkit_api_key', value: '', description: 'IconKit.ai API Key for icon generation (Alternative)' },
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
      // Combine API keys and prompts
      const allSettings = { ...editedKeys, ...prompts };

      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: allSettings }),
      });

      if (!response.ok) throw new Error('Failed to save settings');

      setSuccess('Settings saved successfully!');
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-lg shadow-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
              <p className="mt-1 text-sm text-gray-300">Manage platform settings and integrations</p>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-white/10 text-gray-200 rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm"
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
          <div className="bg-white/10 backdrop-blur-sm rounded-xl shadow-2xl overflow-hidden border border-white/20">
            <div className="px-6 py-5 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">🔌 Integrations</h2>
              <p className="mt-1 text-sm text-gray-300">
                Manage API keys for external services
              </p>
            </div>

            <div className="px-6 py-6">
              {apiKeys.length > 0 && apiKeys[0].value === '' && (
                <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-200 text-sm backdrop-blur-sm">
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
                <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200 text-sm">
                  {success}
                </div>
              )}

              <div className="space-y-6">
                {apiKeys.map((apiKey) => (
                  <div key={apiKey.key} className="border-b border-white/10 pb-6 last:border-0 last:pb-0">
                    <label className="block text-sm font-semibold text-gray-200 mb-2">
                      {apiKey.description}
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="password"
                        value={editedKeys[apiKey.key] || ''}
                        onChange={(e) => setEditedKeys({ ...editedKeys, [apiKey.key]: e.target.value })}
                        placeholder="Enter API key"
                        className="flex-1 px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 backdrop-blur-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.querySelector(`input[value="${editedKeys[apiKey.key] || ''}"]`) as HTMLInputElement;
                          if (input) {
                            input.type = input.type === 'password' ? 'text' : 'password';
                          }
                        }}
                        className="px-4 py-2 border-2 border-white/20 bg-white/10 rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm text-white"
                        title="Toggle visibility"
                      >
                        👁️
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-gray-400">
                      Key name: <code className="bg-white/10 px-2 py-1 rounded text-gray-300">{apiKey.key}</code>
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

          {/* AI Settings Card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl shadow-2xl overflow-hidden border border-white/20">
            <div className="px-6 py-5 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">🤖 AI Settings</h2>
              <p className="mt-1 text-sm text-gray-300">
                Configure AI prompt instructions for each service
              </p>
            </div>

            <div className="px-6 py-6">
              <div className="space-y-8">
                {/* Claude System Prompt */}
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-2">
                    Claude System Prompt
                  </label>
                  <p className="text-xs text-gray-400 mb-3">
                    System-level instructions for Claude AI when generating pitch decks. This defines the AI's behavior and expertise.
                  </p>
                  <textarea
                    value={prompts.claude_system_prompt}
                    onChange={(e) => setPrompts({ ...prompts, claude_system_prompt: e.target.value })}
                    rows={12}
                    placeholder="You are an expert pitch deck creator and storyteller. Your mission is to transform ideas into compelling visual narratives.

CORE PRINCIPLES:
- Storytelling First: Every deck tells a story - make it memorable and engaging
- Visual Over Text: Minimize text, maximize impact. Use graphics, data visualizations, and imagery
- Audience-Centric: Tailor tone and content to the target audience

STRUCTURE FLEXIBILITY:
- If user provides a specific structure or outline, FOLLOW IT EXACTLY
- If no structure provided, use: Title/Hook, Problem, Solution, Market, Product, Traction, Team, Ask

CONTENT GUIDELINES:
- Headlines: Bold, memorable (5-10 words max)
- Body Text: Bullet points only, 3-5 per slide, each under 10 words
- Data: Use specific numbers, percentages, growth metrics
- Graphics: Suggest charts, diagrams, icons, or images for EVERY slide"
                    className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm resize-vertical text-white placeholder-gray-400 backdrop-blur-sm"
                  />
                </div>

                {/* Leonardo Generation Prompt */}
                <div className="pt-6 border-t border-white/10">
                  <label className="block text-sm font-semibold text-gray-200 mb-2">
                    Leonardo.ai Generation Prompt Template
                  </label>
                  <p className="text-xs text-gray-400 mb-3">
                    Template for generating images with Leonardo.ai. Use placeholders like {'{description}'} for dynamic content.
                  </p>
                  <textarea
                    value={prompts.leonardo_generation_prompt}
                    onChange={(e) => setPrompts({ ...prompts, leonardo_generation_prompt: e.target.value })}
                    rows={6}
                    placeholder="Create a professional, high-quality image: {description}. Style: modern, clean, business-appropriate..."
                    className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm resize-vertical text-white placeholder-gray-400 backdrop-blur-sm"
                  />
                </div>

                {/* IconKit Generation Prompt */}
                <div className="pt-6 border-t border-white/10">
                  <label className="block text-sm font-semibold text-gray-200 mb-2">
                    IconKit.ai Generation Prompt Template
                  </label>
                  <p className="text-xs text-gray-400 mb-3">
                    Template for generating icons with IconKit.ai. Use placeholders like {'{concept}'} for dynamic content.
                  </p>
                  <textarea
                    value={prompts.iconkit_generation_prompt}
                    onChange={(e) => setPrompts({ ...prompts, iconkit_generation_prompt: e.target.value })}
                    rows={6}
                    placeholder="Generate a clean, professional icon representing: {concept}. Style: minimalist, vector, single color..."
                    className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm resize-vertical text-white placeholder-gray-400 backdrop-blur-sm"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save AI Settings'}
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
