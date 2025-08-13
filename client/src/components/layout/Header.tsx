'use client';

import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import { avatarUrl } from '../../lib/upload';

export default function Header({ onOpenAuth }: { onOpenAuth: () => void }) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Patwua
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => (user ? navigate('/me') : onOpenAuth())}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="User menu"
          >
            {user?.avatar || user?.avatarUrl ? (
              <img
                src={avatarUrl(user.avatar || user.avatarUrl || '')}
                alt="profile"
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <User className="h-5 w-5" />
            )}
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </header>
  );
}
