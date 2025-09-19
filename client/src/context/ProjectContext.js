/**
 * Project Context
 * Manages project state and operations
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const ProjectContext = createContext();

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

export const ProjectProvider = ({ children }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [components, setComponents] = useState([]);

  // Load user's projects on mount
  useEffect(() => {
    if (user) {
      loadProjects();
      loadComponents();
    }
  }, [user]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/projects');
      setProjects(response.data.data);
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const loadComponents = async () => {
    try {
      const response = await api.get('/components');
      setComponents(response.data.data);
    } catch (error) {
      console.error('Failed to load components:', error);
      toast.error('Failed to load components');
    }
  };

  const createProject = async (projectData) => {
    try {
      setLoading(true);
      const response = await api.post('/projects', projectData);
      const newProject = response.data.data;

      setProjects(prev => [newProject, ...prev]);
      setCurrentProject(newProject);

      toast.success('Project created successfully!');
      return { success: true, project: newProject };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to create project';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async (projectId, updates) => {
    try {
      setLoading(true);
      const response = await api.put(`/projects/${projectId}`, updates);
      const updatedProject = response.data.data;

      setProjects(prev =>
        prev.map(project =>
          project._id === projectId ? updatedProject : project
        )
      );

      if (currentProject?._id === projectId) {
        setCurrentProject(updatedProject);
      }

      toast.success('Project updated successfully!');
      return { success: true, project: updatedProject };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to update project';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (projectId) => {
    try {
      setLoading(true);
      await api.delete(`/projects/${projectId}`);

      setProjects(prev => prev.filter(project => project._id !== projectId));

      if (currentProject?._id === projectId) {
        setCurrentProject(null);
      }

      toast.success('Project deleted successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to delete project';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const loadProject = async (projectId) => {
    try {
      setLoading(true);
      const response = await api.get(`/projects/${projectId}`);
      const project = response.data.data;

      setCurrentProject(project);
      return { success: true, project };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to load project';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const updateCircuit = async (projectId, circuitData) => {
    try {
      const response = await api.put(`/projects/${projectId}/circuit`, {
        circuitData
      });

      const updatedProject = response.data.data;

      if (currentProject?._id === projectId) {
        setCurrentProject(updatedProject);
      }

      return { success: true, project: updatedProject };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to update circuit';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const updateCode = async (projectId, code) => {
    try {
      const response = await api.put(`/projects/${projectId}/code`, { code });

      const updatedProject = response.data.data;

      if (currentProject?._id === projectId) {
        setCurrentProject(updatedProject);
      }

      return { success: true, project: updatedProject };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to update code';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const duplicateProject = async (projectId, newName) => {
    try {
      const originalProject = projects.find(p => p._id === projectId);
      if (!originalProject) {
        throw new Error('Project not found');
      }

      const duplicatedData = {
        name: newName || `${originalProject.name} (Copy)`,
        description: originalProject.description,
        boardType: originalProject.boardType,
        codeLanguage: originalProject.codeLanguage,
        circuitData: originalProject.circuitData,
        code: originalProject.code
      };

      return await createProject(duplicatedData);
    } catch (error) {
      toast.error('Failed to duplicate project');
      return { success: false, error: error.message };
    }
  };

  const value = {
    projects,
    currentProject,
    components,
    loading,
    loadProjects,
    loadComponents,
    createProject,
    updateProject,
    deleteProject,
    loadProject,
    updateCircuit,
    updateCode,
    duplicateProject,
    setCurrentProject
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};