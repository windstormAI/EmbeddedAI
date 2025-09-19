/**
 * Sidebar Component
 * Navigation sidebar with menu items
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  FolderOpen,
  Cpu,
  Bot,
  Settings,
  HelpCircle,
  X,
  Zap,
  Code,
  Play
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: Home,
      description: 'Overview and recent projects'
    },
    {
      name: 'Projects',
      path: '/projects',
      icon: FolderOpen,
      description: 'Manage your embedded projects'
    },
    {
      name: 'Circuit Designer',
      path: '/designer',
      icon: Zap,
      description: 'Design circuits visually'
    },
    {
      name: 'Code Editor',
      path: '/editor',
      icon: Code,
      description: 'Write and edit Arduino code'
    },
    {
      name: 'Simulator',
      path: '/simulator',
      icon: Play,
      description: 'Test circuits virtually'
    },
    {
      name: 'Components',
      path: '/components',
      icon: Cpu,
      description: 'Browse component library'
    },
    {
      name: 'AI Assistant',
      path: '/ai',
      icon: Bot,
      description: 'Get AI-powered help'
    }
  ];

  const bottomMenuItems = [
    {
      name: 'Settings',
      path: '/settings',
      icon: Settings,
      description: 'Configure your preferences'
    },
    {
      name: 'Help',
      path: '/help',
      icon: HelpCircle,
      description: 'Documentation and support'
    }
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:inset-0
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">EP</span>
              </div>
              <span className="text-lg font-bold text-gray-900">Embedded</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 md:hidden"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {/* Main menu items */}
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => onClose()}
                    className={`
                      group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150
                      ${active
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <Icon className={`
                      mr-3 h-5 w-5 transition-colors duration-150
                      ${active ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-600'}
                    `} />
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500 hidden lg:block">
                        {item.description}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-6"></div>

            {/* Bottom menu items */}
            <div className="space-y-1">
              {bottomMenuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => onClose()}
                    className={`
                      group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150
                      ${active
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <Icon className={`
                      mr-3 h-5 w-5 transition-colors duration-150
                      ${active ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-600'}
                    `} />
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500 hidden lg:block">
                        {item.description}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              <div>Embedded Platform v1.0.0</div>
              <div className="mt-1">© 2024 Your Company</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;