'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import FileUpload from '@/components/upload/FileUpload';
import Link from 'next/link';
import { ReferenceMaterial, formatFileSize, getFileCategory } from '@/types/reference';

export default function ReferenceMaterialsPage() {
  return (
    <ProtectedRoute>
      <ReferenceMaterialsContent />
    </ProtectedRoute>
  );
}

function ReferenceMaterialsContent() {
  const { user, signOut } = useAuth();
  const [materials, setMaterials] = useState<ReferenceMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    fetchMaterials();
  }, [filter]);

  const fetchMaterials = async () => {
    try {
      const url = filter === 'all'
        ? '/api/reference-materials'
        : `/api/reference-materials?fileType=${filter}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch materials');
      const data = await response.json();
      setMaterials(data);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteMaterial = async (id: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const response = await fetch(`/api/reference-materials/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      setMaterials(materials.filter(m => m.id !== id));
    } catch (error) {
      alert('Failed to delete file');
    }
  };

  const handleUploadComplete = () => {
    setShowUpload(false);
    fetchMaterials();
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'presentation': return '📊';
      case 'document': return '📄';
      case 'image': return '🖼️';
      case 'video': return '🎥';
      default: return '📁';
    }
  };

  const filteredMaterials = materials;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Reference Materials
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
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
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="mt-1 text-gray-600">
                Upload and manage reference materials for your pitch decks
              </p>
            </div>
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              {showUpload ? 'Hide Upload' : '+ Upload Files'}
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            {['all', 'presentation', 'image', 'document', 'video'].map(type => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 font-medium capitalize transition-colors ${
                  filter === type
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Upload Section */}
        {showUpload && (
          <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Upload New Files</h3>
            <FileUpload onUploadComplete={handleUploadComplete} />
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading materials...</p>
          </div>
        ) : filteredMaterials.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-300">
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No reference materials yet
            </h3>
            <p className="text-gray-600 mb-6">
              Upload your first files to get started
            </p>
            <button
              onClick={() => setShowUpload(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Upload Files
            </button>
          </div>
        ) : (
          /* Materials Grid */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredMaterials.map((material) => (
              <div
                key={material.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden group"
              >
                {/* Preview */}
                <div className="h-40 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                  {material.file_type === 'image' && material.storage_url ? (
                    <img
                      src={material.storage_url}
                      alt={material.file_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-6xl">
                      {getFileIcon(material.file_type)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-900 truncate mb-1">
                    {material.file_name}
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">
                    {formatFileSize(material.file_size)} • {new Date(material.created_at).toLocaleDateString()}
                  </p>

                  {/* Tags */}
                  {material.tags && material.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {material.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {material.storage_url && (
                      <a
                        href={material.storage_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors text-center"
                      >
                        View
                      </a>
                    )}
                    <button
                      onClick={() => deleteMaterial(material.id)}
                      className="px-3 py-2 bg-red-50 text-red-600 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors"
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
    </div>
  );
}
