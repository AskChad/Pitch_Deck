'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import Link from 'next/link';
import { uploadFilesToStorage } from '@/lib/supabase/storage';

export default function CreateWithAIPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [deckName, setDeckName] = useState('');
  const [content, setContent] = useState('');
  const [instructions, setInstructions] = useState('');
  const [websiteUrls, setWebsiteUrls] = useState(['']);
  const [files, setFiles] = useState<File[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

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
      const fileArray = Array.from(e.target.files);
      const MAX_SIZE = 1024 * 1024 * 1024; // 1GB (files uploaded to Supabase Storage, not through API)

      // Check file sizes
      const oversizedFiles = fileArray.filter(file => file.size > MAX_SIZE);

      if (oversizedFiles.length > 0) {
        const fileNames = oversizedFiles.map(f => f.name).join(', ');
        alert(`⚠️ The following files are too large (max 1GB each):\n\n${fileNames}\n\nPlease use smaller files or compress them.`);
        return;
      }

      // Warn about large files (over 100MB)
      const largeFiles = fileArray.filter(file => file.size > 100 * 1024 * 1024);
      if (largeFiles.length > 0) {
        console.warn('Large files detected:', largeFiles.map(f => `${f.name} (${(f.size / 1024 / 1024).toFixed(2)}MB)`));
      }

      setFiles(fileArray);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const updateProgress = (message: string, percent: number = 0) => {
    setProgress(message);
    setProgressPercent(percent);
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
    updateProgress('Preparing your request...', 5);

    try {
      // Upload files to Supabase Storage first (for large file support up to 1GB)
      let uploadedFiles: any[] = [];
      if (files.length > 0) {
        updateProgress(`Uploading ${files.length} file(s) to secure storage...`, 10);

        // Use user ID if logged in, otherwise use anonymous ID
        const uploadUserId = user?.id || `anonymous-${Date.now()}`;

        uploadedFiles = await uploadFilesToStorage(
          files,
          uploadUserId,
          (uploaded, total) => {
            const percent = 10 + (uploaded / total) * 10; // 10-20%
            updateProgress(`Uploading files... (${uploaded}/${total})`, percent);
          }
        );

        console.log('Files uploaded to storage:', uploadedFiles);
      }

      const formData = new FormData();
      formData.append('name', deckName);
      formData.append('content', content);
      formData.append('instructions', instructions);
      formData.append('useMultiPhase', 'true'); // Always use professional multi-phase generation

      // Add URLs
      const validUrls = websiteUrls.filter(url => url.trim());
      formData.append('urls', JSON.stringify(validUrls));

      // Send file paths instead of file content (bypasses API body size limits)
      if (uploadedFiles.length > 0) {
        formData.append('filePaths', JSON.stringify(uploadedFiles.map(f => ({
          fileName: f.fileName,
          filePath: f.filePath,
          publicUrl: f.publicUrl,
          size: f.size,
        }))));
      }

      // Simulate progressive updates to show activity
      updateProgress('Gathering reference materials...', 10);
      await new Promise(resolve => setTimeout(resolve, 500));

      updateProgress('Sending request to AI...', 15);
      await new Promise(resolve => setTimeout(resolve, 300));

      updateProgress('AI is analyzing your content...', 20);

      // Start the API call
      const startTime = Date.now();

      // Set up a progress simulator while waiting for response
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        if (elapsed < 5000) {
          updateProgress('Phase 1: Extracting brand assets from URLs...', 25);
        } else if (elapsed < 10000) {
          updateProgress('Phase 1: Analyzing content strategy...', 35);
        } else if (elapsed < 15000) {
          updateProgress('Phase 1: Planning slide messaging...', 40);
        } else if (elapsed < 20000) {
          updateProgress('Phase 2: Designing visual layouts...', 50);
        } else if (elapsed < 25000) {
          updateProgress('Phase 2: Creating detailed graphic prompts...', 60);
        } else if (elapsed < 30000) {
          updateProgress('Phase 3: Generating custom images...', 70);
        } else if (elapsed < 40000) {
          updateProgress('Phase 3: Creating infographics...', 80);
        } else if (elapsed < 50000) {
          updateProgress('Phase 4: Assembling final deck...', 90);
        } else {
          updateProgress('Almost done...', 95);
        }
      }, 2000);

      const response = await fetch('/api/ai/generate-deck', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        let errorMessage = 'Failed to generate deck';
        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } catch {
          // If response isn't JSON, try to get text
          const text = await response.text();
          errorMessage = text.substring(0, 200) || errorMessage;
        }
        throw new Error(errorMessage);
      }

      updateProgress('Saving your pitch deck...', 95);

      let data;
      try {
        data = await response.json();
      } catch (err) {
        throw new Error('Invalid response from server. Please try again.');
      }

      updateProgress('✓ Complete! Redirecting to editor...', 100);

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

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Only redirect if loading is complete and user is not authenticated
  if (!loading && !user) {
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
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-400 mx-auto mb-6"></div>
              <h2 className="text-2xl font-bold mb-2 text-white">✨ Creating Your Professional Deck</h2>
              <p className="text-gray-300 mb-4">{progress}</p>
              <div className="w-full bg-white/20 rounded-full h-3 mb-2">
                <div
                  className="bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <p className="text-sm font-semibold text-purple-300">{progressPercent}%</p>
              <p className="text-sm text-gray-400 mt-4">Running 4-phase professional generation...</p>
              <p className="text-xs text-gray-500 mt-2">This may take 1-2 minutes for best quality</p>
            </div>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl shadow-2xl p-8">
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-2 text-white">✨ Create Professional Pitch Decks with AI</h2>
              <p className="text-gray-300 mb-3">
                Our advanced AI system uses a 4-phase approach to create stunning, professional pitch decks with minimal text and maximum visual impact.
              </p>
              <div className="bg-purple-500/10 border border-purple-400/30 rounded-lg p-4 backdrop-blur-sm">
                <p className="text-sm text-purple-200 font-semibold mb-2">What makes this special:</p>
                <ul className="text-xs text-gray-300 space-y-1">
                  <li>• Extracts brand colors, logos, and images from your website URLs</li>
                  <li>• Learns from example pitch decks you upload</li>
                  <li>• Creates custom graphics and infographics for every slide</li>
                  <li>• Follows professional design principles for visual storytelling</li>
                </ul>
              </div>
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
                  🌐 Brand Website URLs (Recommended)
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
                  <strong>AI will extract:</strong> Brand colors, logos, product images, company info, and style
                </p>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  📄 Example Pitch Decks & Reference Documents (Optional)
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
                      PDF, DOC, DOCX, TXT, MD (max 1GB each)
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
                  <strong>Supported formats:</strong> Text files (.txt, .md, .csv) are fully parsed. PDFs can be uploaded but aren't parsed yet - please include key content in the description field above. <strong>Max file size:</strong> 1GB per file (uploaded to secure cloud storage).
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
