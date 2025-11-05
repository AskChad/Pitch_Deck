'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Deck {
  id: string;
  name: string;
  description: string;
  brand_url: string;
  slides: any[];
  created_at: string;
  updated_at: string;
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user, signOut } = useAuth();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewDeckModal, setShowNewDeckModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchDecks();
  }, []);

  const fetchDecks = async () => {
    try {
      const response = await fetch('/api/decks');
      if (!response.ok) throw new Error('Failed to fetch decks');
      const data = await response.json();
      setDecks(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDeck = async (id: string) => {
    if (!confirm('Are you sure you want to delete this deck?')) return;

    try {
      const response = await fetch(`/api/decks/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete deck');

      setDecks(decks.filter(deck => deck.id !== id));
    } catch (err: any) {
      alert('Failed to delete deck: ' + err.message);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                AI Pitch Deck Creator
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/reference-materials"
                className="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
              >
                📁 Reference Materials
              </Link>
              {(user as any)?.user_metadata?.is_admin && (
                <Link
                  href="/admin"
                  className="px-4 py-2 text-sm font-semibold text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors flex items-center gap-2"
                >
                  ⚙️ Admin
                </Link>
              )}
              <span className="text-sm text-gray-300">
                {user?.email}
              </span>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-white">My Pitch Decks</h2>
              <p className="mt-1 text-gray-300">
                Create and manage your presentation decks
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/create-ai"
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Create with AI
              </Link>
              <button
                onClick={() => setShowNewDeckModal(true)}
                className="px-6 py-3 bg-white/10 text-white border-2 border-white/20 rounded-lg font-semibold hover:bg-white/20 transition-colors flex items-center gap-2 backdrop-blur-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Deck
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
            <p className="mt-4 text-gray-300">Loading your decks...</p>
          </div>
        ) : decks.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12 bg-white/5 backdrop-blur-sm rounded-2xl border-2 border-dashed border-white/20">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No pitch decks yet
            </h3>
            <p className="text-gray-300 mb-6">
              Create your first pitch deck to get started
            </p>
            <button
              onClick={() => setShowNewDeckModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-colors shadow-lg"
            >
              Create Your First Deck
            </button>
          </div>
        ) : (
          /* Decks Grid */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {decks.map((deck) => (
              <div
                key={deck.id}
                className="bg-white/10 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-2xl transition-shadow border border-white/20 overflow-hidden group"
              >
                {/* Deck Preview */}
                <div className="h-40 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📊</div>
                    <div className="text-sm text-gray-600">
                      {deck.slides?.length || 0} slides
                    </div>
                  </div>
                </div>

                {/* Deck Info */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-2 truncate">
                    {deck.name}
                  </h3>
                  {deck.description && (
                    <p className="text-sm text-gray-300 mb-4 line-clamp-2">
                      {deck.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                    <span>Updated {formatDate(deck.updated_at)}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Link
                      href={`/editor/${deck.id}`}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors text-center"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/present/${deck.id}`}
                      className="px-4 py-2 bg-white/20 text-white text-sm font-medium rounded-lg hover:bg-white/30 transition-colors backdrop-blur-sm"
                    >
                      Present
                    </Link>
                    <button
                      onClick={() => handleDeleteDeck(deck.id)}
                      className="px-4 py-2 bg-red-500/20 text-red-300 text-sm font-medium rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* New Deck Modal */}
      {showNewDeckModal && (
        <NewDeckModal
          onClose={() => setShowNewDeckModal(false)}
          onCreated={(deck) => {
            setDecks([deck, ...decks]);
            setShowNewDeckModal(false);
            router.push(`/editor/${deck.id}`);
          }}
        />
      )}
    </div>
  );
}

function NewDeckModal({ onClose, onCreated }: { onClose: () => void; onCreated: (deck: Deck) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [brandUrl, setBrandUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, brandUrl }),
      });

      if (!response.ok) throw new Error('Failed to create deck');

      const deck = await response.json();
      onCreated(deck);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 border border-white/20 rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Create New Deck</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-200 mb-2">
              Deck Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 backdrop-blur-sm"
              placeholder="My Startup Pitch"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-200 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 backdrop-blur-sm"
              placeholder="Brief description of your pitch deck..."
            />
          </div>

          <div>
            <label htmlFor="brandUrl" className="block text-sm font-medium text-gray-200 mb-2">
              Brand Website URL (optional)
            </label>
            <input
              id="brandUrl"
              type="url"
              value={brandUrl}
              onChange={(e) => setBrandUrl(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 backdrop-blur-sm"
              placeholder="https://example.com"
            />
            <p className="mt-1 text-xs text-gray-400">
              We'll extract brand colors and assets from this URL
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-white/20 text-gray-300 rounded-lg font-semibold hover:bg-white/10 transition-colors backdrop-blur-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Deck'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
