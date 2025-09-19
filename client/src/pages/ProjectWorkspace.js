/**
 * Project Workspace Page
 * Main workspace for editing projects with circuit designer and code editor
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Save,
  Play,
  Download,
  Share,
  Settings,
  Eye,
  Code,
  Zap,
  Cpu,
  Upload,
  RotateCcw
} from 'lucide-react';

import { useProject } from '../context/ProjectContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import CircuitDesigner from '../components/circuit/CircuitDesigner';
import CodeEditor from '../components/editor/CodeEditor';
import AIPanel from '../components/ai/AIPanel';
import SimulationPanel from '../components/simulation/SimulationPanel';

const ProjectWorkspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentProject, loadProject, updateProject, updateCircuit, updateCode, loading } = useProject();

  const [activeTab, setActiveTab] = useState('designer');
  const [isDirty, setIsDirty] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [showAIPanel, setShowAIPanel] = useState(false);

  // Load project on mount
  useEffect(() => {
    if (id) {
      loadProject(id);
    }
  }, [id, loadProject]);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !isDirty) return;

    const saveTimer = setTimeout(async () => {
      if (currentProject) {
        await handleSave();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearTimeout(saveTimer);
  }, [currentProject, isDirty, autoSave]);

  const handleSave = async () => {
    if (!currentProject) return;

    try {
      await updateProject(currentProject._id, {
        name: currentProject.name,
        description: currentProject.description,
        circuitData: currentProject.circuitData,
        code: currentProject.code
      });
      setIsDirty(false);
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const handleCircuitChange = async (circuitData) => {
    if (currentProject) {
      await updateCircuit(currentProject._id, circuitData);
      setIsDirty(true);
    }
  };

  const handleCodeChange = async (code) => {
    if (currentProject) {
      await updateCode(currentProject._id, code);
      setIsDirty(true);
    }
  };

  const handleExport = () => {
    if (!currentProject) return;

    const exportData = {
      name: currentProject.name,
      description: currentProject.description,
      circuitData: currentProject.circuitData,
      code: currentProject.code,
      boardType: currentProject.boardType,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject.name.replace(/\s+/g, '_')}_export.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRunSimulation = () => {
    setActiveTab('simulation');
    // Implementation for running simulation
  };

  const handleGenerateCode = () => {
    setShowAIPanel(true);
    setActiveTab('ai');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="large" message="Loading project..." />
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Project Not Found</h2>
          <p className="text-gray-600 mb-6">The project you're looking for doesn't exist or you don't have access to it.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'designer', label: 'Circuit Designer', icon: Zap },
    { id: 'editor', label: 'Code Editor', icon: Code },
    { id: 'simulation', label: 'Simulation', icon: Play },
    { id: 'ai', label: 'AI Assistant', icon: Cpu }
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">{currentProject.name}</h1>
            {isDirty && (
              <span className="text-sm text-orange-600 bg-orange-100 px-2 py-1 rounded">
                Unsaved changes
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Auto-save toggle */}
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={autoSave}
                onChange={(e) => setAutoSave(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span>Auto-save</span>
            </label>

            {/* Action buttons */}
            <button
              onClick={handleSave}
              disabled={!isDirty}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
            >
              <Save className="h-4 w-4" />
              <span>Save</span>
            </button>

            <button
              onClick={handleRunSimulation}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
            >
              <Play className="h-4 w-4" />
              <span>Run</span>
            </button>

            <button
              onClick={handleGenerateCode}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
            >
              <Cpu className="h-4 w-4" />
              <span>AI Generate</span>
            </button>

            <div className="border-l border-gray-300 h-6 mx-2"></div>

            <button
              onClick={handleExport}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>

            <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200">
              <Share className="h-4 w-4" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Project info */}
        <div className="mt-4 flex items-center space-x-6 text-sm text-gray-600">
          <span>Board: {currentProject.boardType || 'Arduino Uno'}</span>
          <span>Status: {currentProject.status || 'Draft'}</span>
          <span>Last saved: {new Date(currentProject.updatedAt).toLocaleString()}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'designer' && (
          <CircuitDesigner
            project={currentProject}
            onCircuitChange={handleCircuitChange}
          />
        )}

        {activeTab === 'editor' && (
          <CodeEditor
            code={currentProject.code || ''}
            onCodeChange={handleCodeChange}
            language="cpp"
            boardType={currentProject.boardType}
          />
        )}

        {activeTab === 'simulation' && (
          <SimulationPanel
            project={currentProject}
            onCodeUpdate={handleCodeChange}
          />
        )}

        {activeTab === 'ai' && (
          <AIPanel
            project={currentProject}
            onCodeGenerated={handleCodeChange}
            onCircuitGenerated={handleCircuitChange}
          />
        )}
      </div>

      {/* AI Panel Overlay */}
      {showAIPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl h-5/6 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
              <button
                onClick={() => setShowAIPanel(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <RotateCcw className="h-6 w-6" />
              </button>
            </div>
            <div className="h-full">
              <AIPanel
                project={currentProject}
                onCodeGenerated={handleCodeChange}
                onCircuitGenerated={handleCircuitChange}
                embedded={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectWorkspace;