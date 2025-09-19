/**
 * Component Library Page
 * Browse and manage electronic components for circuit design
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Zap } from 'lucide-react';
import AdvancedComponentLibrary from '../components/circuit/AdvancedComponentLibrary';

const ComponentLibrary = () => {
  const handleComponentSelect = (component) => {
    // Handle component selection - could navigate to component details or add to project
    console.log('Selected component:', component);
  };

  const handleComponentDrag = (component) => {
    // Handle component drag - could be used for drag and drop into circuit designer
    console.log('Dragging component:', component);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </Link>
            <div className="h-6 w-px bg-gray-300"></div>
            <div className="flex items-center space-x-2">
              <Zap className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Component Library</h1>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Browse and select components for your projects
          </div>
        </div>
      </div>

      {/* Component Library Content */}
      <div className="flex-1">
        <AdvancedComponentLibrary
          onComponentSelect={handleComponentSelect}
          onComponentDrag={handleComponentDrag}
        />
      </div>
    </div>
  );
};

export default ComponentLibrary;