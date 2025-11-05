'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import Link from 'next/link';

export default function CreateWithAIPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [deckName, setDeckName] = useState('');
  const [content, setContent] = useState('');
  const [instructions, setInstructions] = useState('');
  const [websiteUrls, setWebsiteUrls] = useState(['']);
  const [files, setFiles] = useState<File[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');

  const addUrlField = () => {
    setWebsiteUrls([...websiteUrls, '']);
  };

  const updateUrl = (index: number, value: string) => {
    const newUrls = [...websiteUrls];
    newUrls[index] = value;
    setWebsiteUrls(newUrls);
  };

  const removeUrl = (index: number) => {
    setWebsiteUrls(websiteUrls.filter((_, i) => i !== index));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (!deckName.trim()) {
      setError('Please enter a deck name');
      return;
    }

    if (!content.trim()) {
      setError('Please enter some content or description for your deck');
      return;
    }

    setGenerating(true);
    setError('');
    setProgress('Preparing your request...');

    try {
      const formData = new FormData();
      formData.append('name', deckName);
      formData.append('content', content);
      formData.append('instructions', instructions);

      // Add URLs
      const validUrls = websiteUrls.filter(url => url.trim());
      formData.append('urls', JSON.stringify(validUrls));

      // Add files
      files.forEach((file) => {
        formData.append('files', file);
      });

      setProgress('Analyzing your content...');

      const response = await fetch('/api/ai/generate-deck', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate deck');
      }

      setProgress('Creating your pitch deck...');
      const data = await response.json();

      setProgress('Complete! Redirecting to editor...');

      // Redirect to editor
      setTimeout(() => {
        router.push(`/editor/${data.id}`);
      }, 1000);

    } catch (err: any) {
      setError(err.message || 'Failed to generate deck');
      setGenerating(false);
      setProgress('');
    }
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-300 hover:text-white transition-colors">
              ← Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-white">Create Deck with AI</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {generating ? (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl shadow-2xl p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-400 mx-auto mb-6"></div>
              <h2 className="text-2xl font-bold mb-2 text-white">Generating Your Pitch Deck</h2>
              <p className="text-gray-300 mb-4">{progress}</p>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
              <p className="text-sm text-gray-400 mt-4">This may take 30-60 seconds...</p>
            </div>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl shadow-2xl p-8">
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-2 text-white">Let AI Create Your Pitch Deck</h2>
              <p className="text-gray-300">
                Provide your content, reference materials, and instructions. Our AI will analyze everything
                and generate a professional pitch deck tailored to your needs.
              </p>
            </div>

            <div className="space-y-6">
              {/* Deck Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Deck Name *
                </label>
                <input
                  type="text"
                  value={deckName}
                  onChange={(e) => setDeckName(e.target.value)}
                  placeholder="e.g., Series A Funding Pitch"
                  className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 backdrop-blur-sm"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Content & Description *
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Describe your product, company, or idea. Include key points you want to highlight..."
                  rows={8}
                  className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 backdrop-blur-sm"
                />
                <p className="mt-1 text-sm text-gray-400">
                  The more detail you provide, the better the AI can tailor your deck.
                </p>
              </div>

              {/* Custom Instructions */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Custom Instructions
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Add any specific instructions for the AI (e.g., tone, style, focus areas, target audience...)"
                  rows={4}
                  className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 backdrop-blur-sm"
                />
                <p className="mt-1 text-sm text-gray-400">
                  Optional: Guide the AI with specific requirements or preferences.
                </p>
              </div>

              {/* Website URLs */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Reference Website URLs
                </label>
                <div className="space-y-2">
                  {websiteUrls.map((url, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => updateUrl(index, e.target.value)}
                        placeholder="https://example.com"
                        className="flex-1 px-4 py-2 bg-white/10 border-2 border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 backdrop-blur-sm"
                      />
                      {websiteUrls.length > 1 && (
                        <button
                          onClick={() => removeUrl(index)}
                          className="px-4 py-2 text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={addUrlField}
                  className="mt-2 text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  + Add Another URL
                </button>
                <p className="mt-1 text-sm text-gray-400">
                  Add URLs to websites the AI should reference (company site, competitors, etc.)
                </p>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Reference Documents
                </label>
                <div className="border-2 border-dashed border-white/20 bg-white/5 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-white/10 transition-colors backdrop-blur-sm">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.txt,.md"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer inline-flex flex-col items-center"
                  >
                    <svg
                      className="w-12 h-12 text-gray-400 mb-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <span className="text-sm font-medium text-gray-200">
                      Click to upload files
                    </span>
                    <span className="text-xs text-gray-400 mt-1">
                      PDF, DOC, DOCX, TXT, MD
                    </span>
                  </label>
                </div>

                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <svg
                            className="w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-white">{file.name}</p>
                            <p className="text-xs text-gray-400">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-red-300 hover:text-red-200 transition-colors"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="mt-2 text-sm text-gray-400">
                  Upload documents the AI should reference (pitch decks, reports, briefs, etc.)
                </p>
              </div>

              {/* Generate Button */}
              <div className="pt-6 border-t border-white/10">
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-2xl"
                >
                  {generating ? 'Generating...' : '✨ Generate Pitch Deck with AI'}
                </button>
                <p className="text-center text-sm text-gray-400 mt-3">
                  Powered by Claude AI
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
