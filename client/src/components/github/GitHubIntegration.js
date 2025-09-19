/**
 * GitHub Integration Component
 * Connect GitHub account and push projects to repositories
 */

import React, { useState, useEffect } from 'react';
import {
  Github,
  Upload,
  Plus,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  GitBranch,
  Star,
  GitFork,
  Eye,
  Users,
  Code,
  Settings,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

const GitHubIntegration = ({ project, onGitHubPush }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateRepo, setShowCreateRepo] = useState(false);
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoDescription, setNewRepoDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [pushMessage, setPushMessage] = useState('');
  const [pushHistory, setPushHistory] = useState([]);

  // Check GitHub connection status on mount
  useEffect(() => {
    checkGitHubConnection();
    if (project?.githubPushHistory) {
      setPushHistory(project.githubPushHistory);
    }
  }, [project]);

  const checkGitHubConnection = async () => {
    try {
      const response = await fetch('/api/github/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.data);
        setIsConnected(true);
        await loadRepositories();
      }
    } catch (error) {
      console.error('Failed to check GitHub connection:', error);
    }
  };

  const loadRepositories = async () => {
    try {
      const response = await fetch('/api/github/repositories', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRepositories(data.data);
      }
    } catch (error) {
      console.error('Failed to load repositories:', error);
      toast.error('Failed to load GitHub repositories');
    }
  };

  const connectGitHub = async () => {
    try {
      setLoading(true);

      // Get OAuth URL
      const response = await fetch('/api/github/oauth-url', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const oauthUrl = data.data.url;

        // Open GitHub OAuth in popup
        const popup = window.open(
          oauthUrl,
          'github-oauth',
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );

        // Listen for OAuth callback
        const handleMessage = async (event) => {
          if (event.origin !== window.location.origin) return;

          if (event.data.type === 'GITHUB_OAUTH_SUCCESS') {
            popup.close();
            window.removeEventListener('message', handleMessage);

            // Complete the connection
            await completeGitHubConnection(event.data.code);
          }
        };

        window.addEventListener('message', handleMessage);
      }
    } catch (error) {
      console.error('Failed to connect GitHub:', error);
      toast.error('Failed to connect GitHub');
    } finally {
      setLoading(false);
    }
  };

  const completeGitHubConnection = async (code) => {
    try {
      const response = await fetch('/api/github/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ code })
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.data.profile);
        setIsConnected(true);
        await loadRepositories();
        toast.success('GitHub connected successfully!');
      } else {
        throw new Error('Failed to connect GitHub');
      }
    } catch (error) {
      console.error('Failed to complete GitHub connection:', error);
      toast.error('Failed to complete GitHub connection');
    }
  };

  const createRepository = async () => {
    if (!newRepoName.trim()) {
      toast.error('Repository name is required');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/github/repositories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: newRepoName.trim(),
          description: newRepoDescription.trim(),
          private: isPrivate
        })
      });

      if (response.ok) {
        const data = await response.json();
        setRepositories(prev => [data.data, ...prev]);
        setShowCreateRepo(false);
        setNewRepoName('');
        setNewRepoDescription('');
        setSelectedRepo(data.data.name);
        toast.success('Repository created successfully!');
      } else if (response.status === 409) {
        toast.error('Repository with this name already exists');
      } else {
        throw new Error('Failed to create repository');
      }
    } catch (error) {
      console.error('Failed to create repository:', error);
      toast.error('Failed to create repository');
    } finally {
      setLoading(false);
    }
  };

  const pushToGitHub = async () => {
    if (!selectedRepo) {
      toast.error('Please select a repository');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/github/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          projectId: project._id,
          repository: selectedRepo,
          message: pushMessage || `Update project: ${project.name}`,
          createRepo: false
        })
      });

      if (response.ok) {
        const data = await response.json();

        // Update push history
        const newPush = {
          commit: data.data.commit.sha,
          message: data.data.commit.message,
          timestamp: new Date(),
          repository: data.data.repository.full_name
        };
        setPushHistory(prev => [newPush, ...prev]);

        // Notify parent component
        if (onGitHubPush) {
          onGitHubPush(data.data);
        }

        toast.success('Project pushed to GitHub successfully!');

        // Open repository in new tab
        window.open(data.data.repository.html_url, '_blank');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to push to GitHub');
      }
    } catch (error) {
      console.error('Failed to push to GitHub:', error);
      toast.error('Failed to push to GitHub');
    } finally {
      setLoading(false);
    }
  };

  const disconnectGitHub = async () => {
    try {
      const response = await fetch('/api/github/disconnect', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setIsConnected(false);
        setUserProfile(null);
        setRepositories([]);
        setPushHistory([]);
        toast.success('GitHub disconnected successfully');
      }
    } catch (error) {
      console.error('Failed to disconnect GitHub:', error);
      toast.error('Failed to disconnect GitHub');
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center">
          <Github className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Connect GitHub Account
          </h3>
          <p className="text-gray-600 mb-6">
            Push your projects to GitHub repositories and collaborate with others
          </p>

          <button
            onClick={connectGitHub}
            disabled={loading}
            className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="h-5 w-5 animate-spin" />
            ) : (
              <Github className="h-5 w-5" />
            )}
            {loading ? 'Connecting...' : 'Connect GitHub'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden">
              <img
                src={userProfile.avatar_url}
                alt={userProfile.login}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{userProfile.name || userProfile.login}</h3>
              <p className="text-sm text-gray-600">@{userProfile.login}</p>
            </div>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>

          <button
            onClick={disconnectGitHub}
            className="text-gray-400 hover:text-red-500"
            title="Disconnect GitHub"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Push to GitHub */}
      <div className="p-6 border-b border-gray-200">
        <h4 className="font-medium text-gray-900 mb-4">Push Project to GitHub</h4>

        <div className="space-y-4">
          {/* Repository Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Repository
            </label>
            <div className="flex gap-2">
              <select
                value={selectedRepo}
                onChange={(e) => setSelectedRepo(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose repository...</option>
                {repositories.map(repo => (
                  <option key={repo.id} value={repo.name}>
                    {repo.name} {repo.private ? '(Private)' : '(Public)'}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowCreateRepo(true)}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center gap-1"
                title="Create new repository"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Commit Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commit Message
            </label>
            <input
              type="text"
              value={pushMessage}
              onChange={(e) => setPushMessage(e.target.value)}
              placeholder={`Update project: ${project?.name || 'Embedded Project'}`}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Push Button */}
          <button
            onClick={pushToGitHub}
            disabled={!selectedRepo || loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
          >
            {loading ? (
              <RefreshCw className="h-5 w-5 animate-spin" />
            ) : (
              <Upload className="h-5 w-5" />
            )}
            {loading ? 'Pushing...' : 'Push to GitHub'}
          </button>
        </div>
      </div>

      {/* Push History */}
      {pushHistory.length > 0 && (
        <div className="p-6">
          <h4 className="font-medium text-gray-900 mb-4">Push History</h4>
          <div className="space-y-3">
            {pushHistory.slice(0, 5).map((push, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {push.message}
                  </p>
                  <p className="text-xs text-gray-600">
                    {new Date(push.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                    {push.commit.substring(0, 7)}
                  </code>
                  <button
                    onClick={() => window.open(`https://github.com/${push.repository}/commit/${push.commit}`, '_blank')}
                    className="text-blue-600 hover:text-blue-800"
                    title="View on GitHub"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Repository Modal */}
      {showCreateRepo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Repository</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Repository Name
                </label>
                <input
                  type="text"
                  value={newRepoName}
                  onChange={(e) => setNewRepoName(e.target.value)}
                  placeholder="my-embedded-project"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={newRepoDescription}
                  onChange={(e) => setNewRepoDescription(e.target.value)}
                  placeholder="AI-generated embedded systems project"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="private"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="private" className="ml-2 text-sm text-gray-700">
                  Make repository private
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreateRepo(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createRepository}
                  disabled={!newRepoName.trim() || loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {loading ? 'Creating...' : 'Create Repository'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GitHubIntegration;