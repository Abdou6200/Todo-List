'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

interface Todo {
  id: number;
  title: string;
  description: string;
  category_id: number | null;
  category_name?: string;
  due_date?: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: number;
  name: string;
}

export default function TodosPage() {
  const { user, token, logout, isLoading } = useAuth();
  const router = useRouter();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !token) {
      router.push('/');
    }
  }, [token, isLoading, router]);

  // Fetch todos
  useEffect(() => {
    if (token) {
      fetchTodos();
      fetchCategories();
    }
  }, [token]);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/todos', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch todos');
      }

      const data = await response.json();
      setTodos(data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load todos');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();
      setCategories(data);
    } catch (err: any) {
      console.error('Failed to load categories:', err);
    }
  };

  const createCategory = async () => {
    if (!newCategory.trim()) {
      setError('Category name cannot be empty');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newCategory.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create category');
      }

      const category = await response.json();
      setCategories([...categories, category]);
      setNewCategory('');
      setShowNewCategoryInput(false);
      setSelectedCategoryId(category.id);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setError('Title cannot be empty');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          category_id: selectedCategoryId,
          due_date: newDueDate || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create todo');
      }

      const newTodo = await response.json();
      setTodos([newTodo, ...todos]);
      setNewTitle('');
      setNewDescription('');
      setNewDueDate('');
      setSelectedCategoryId(null);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to create todo');
    } finally {
      setLoading(false);
    }
  };

  const updateTodo = async (id: number, updates: Partial<Todo>) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update todo');
      }

      setTodos(todos.map(todo => todo.id === id ? { ...todo, ...updates } : todo));
      setEditingId(null);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to update todo');
    }
  };

  const deleteTodo = async (id: number) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete todo');
      }

      setTodos(todos.filter(todo => todo.id !== id));
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to delete todo');
    }
  };

  const toggleTodo = (id: number) => {
    const todo = todos.find(t => t.id === id);
    if (todo) {
      updateTodo(id, { completed: !todo.completed });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 pt-8 px-2">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">My Todos</h1>
            <p className="text-gray-700 mt-2 font-medium">Welcome, <span className="text-blue-600 font-bold">{user?.name}</span>!</p>
          </div>
          <button
            onClick={() => {
              logout();
              router.push('/');
            }}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg transition duration-200 shadow-md"
          >
            Logout
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 text-red-800 rounded-lg font-medium">
            {error}
          </div>
        )}

        {/* Add Todo Form */}
        <form onSubmit={addTodo} className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Add New Todo</h2>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Title</label>
              <input
                type="text"
                placeholder="Enter todo title..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Description</label>
              <textarea
                placeholder="Enter description (optional)..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition duration-200"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Category</label>
              <div className="space-y-3">
                <select
                  value={selectedCategoryId || ''}
                  onChange={(e) => setSelectedCategoryId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition duration-200"
                >
                  <option value="">Select a category (optional)</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewCategoryInput(!showNewCategoryInput)}
                  className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                >
                  {showNewCategoryInput ? 'Cancel' : '+ Create new category'}
                </button>
                {showNewCategoryInput && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter category name..."
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition duration-200"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          createCategory();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={createCategory}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition duration-200"
                    >
                      Create
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Due Date (optional)</label>
              <input
                type="datetime-local"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition duration-200"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 px-4 rounded-lg transition duration-200 shadow-md"
            >
              {loading ? 'Adding...' : 'Add Todo'}
            </button>
          </div>
        </form>

        {/* Todos List */}
        <div className="space-y-4">
          {todos.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center border-2 border-gray-100">
              <p className="text-gray-600 text-lg font-medium">No todos yet. Create one above!</p>
            </div>
          ) : (
            todos.map((todo) => (
              <div
                key={todo.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg p-6 flex items-start gap-4 border-2 border-gray-100 transition duration-200"
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id)}
                  className="mt-1 w-6 h-6 text-blue-600 rounded cursor-pointer flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3
                    className={`text-lg font-bold ${
                      todo.completed
                        ? 'line-through text-gray-400'
                        : 'text-gray-900'
                    }`}
                  >
                    {todo.title}
                  </h3>
                  {todo.category_name && (
                    <p className="text-xs font-semibold text-blue-600 mt-1 inline-block bg-blue-50 px-2 py-1 rounded">
                      {todo.category_name}
                    </p>
                  )}
                  {todo.due_date && (
                    <div className="mt-2 text-xs font-semibold">
                      <span className={`inline-block px-2 py-1 rounded ${
                        new Date(todo.due_date) < new Date() && !todo.completed
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        Due: {new Date(todo.due_date).toLocaleDateString()} at {new Date(todo.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                  {todo.description && (
                    <p
                      className={`mt-2 text-sm ${
                        todo.completed
                          ? 'line-through text-gray-400'
                          : 'text-gray-700'
                      }`}
                    >
                      {todo.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-3 font-medium">
                    {new Date(todo.created_at).toLocaleDateString()} at {new Date(todo.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200 shadow-md flex-shrink-0"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
