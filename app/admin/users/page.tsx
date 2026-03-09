// app/admin/users/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

// Define types
interface AdminUser {
  id: number;
  user_id: string;
  email: string;
  role: 'super_admin' | 'admin' | 'manager' | 'viewer';
  permissions: {
    dogs: boolean;
    products: boolean;
    sales: boolean;
    expenses: boolean;
    users: boolean;
    reports: boolean;
  };
  last_login?: string;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state for new user
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'viewer' as const,
    permissions: {
      dogs: false,
      products: false,
      sales: false,
      expenses: false,
      users: false,
      reports: true
    }
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('admin_roles')
      .select('*')
      .order('created_at', { ascending: false });
    
    setUsers((data as AdminUser[]) || []);
    setLoading(false);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true
      });

      if (authError) throw authError;

      // Add to admin_roles table
      const { error: roleError } = await supabase
        .from('admin_roles')
        .insert([{
          user_id: authData.user.id,
          email: formData.email,
          role: formData.role,
          permissions: formData.permissions
        }]);

      if (roleError) throw roleError;

      alert('User created successfully!');
      setShowAddModal(false);
      fetchUsers();
    } catch (error: any) {
      alert('Error creating user: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (user: AdminUser) => {
    setLoading(true);

    const { error } = await supabase
      .from('admin_roles')
      .update({
        role: user.role,
        permissions: user.permissions
      })
      .eq('id', user.id);

    if (error) {
      alert('Error updating user: ' + error.message);
    } else {
      alert('User updated successfully!');
      setEditingUser(null);
      fetchUsers();
    }
    setLoading(false);
  };

  const handleDeleteUser = async (userId: number, email: string) => {
    if (!confirm(`Are you sure you want to delete user: ${email}?`)) return;

    setLoading(true);

    // Get the user record first to get the auth user_id
    const user = users.find(u => u.id === userId);
    
    if (!user) return;

    // Delete from admin_roles first
    const { error: roleError } = await supabase
      .from('admin_roles')
      .delete()
      .eq('id', userId);

    if (roleError) {
      alert('Error deleting user: ' + roleError.message);
    } else {
      // Optionally delete from auth.users (requires admin API)
      alert('User removed from admin access');
      fetchUsers();
    }
    setLoading(false);
  };

  const getRoleBadgeColor = (role: string) => {
    switch(role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'manager': return 'bg-green-100 text-green-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && users.length === 0) return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">👥 User Management</h1>
            <p className="text-gray-500 text-sm mt-1">Manage admin users and their permissions</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 flex items-center gap-2"
          >
            <span>➕</span> Add New User
          </button>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <input
            type="text"
            placeholder="Search users by email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Role</th>
                  <th className="p-3 text-left">Permissions</th>
                  <th className="p-3 text-left">Last Login</th>
                  <th className="p-3 text-left">Created</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-t hover:bg-gray-50">
                    {editingUser?.id === user.id ? (
                      // Edit mode
                      <td colSpan={6} className="p-4">
                        <div className="space-y-3">
                          <p className="font-medium">{user.email}</p>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">Role</label>
                              <select
                                value={editingUser.role}
                                onChange={(e) => setEditingUser({
                                  ...editingUser,
                                  role: e.target.value as any
                                })}
                                className="w-full p-2 border rounded"
                              >
                                <option value="super_admin">Super Admin</option>
                                <option value="admin">Admin</option>
                                <option value="manager">Manager</option>
                                <option value="viewer">Viewer</option>
                              </select>
                            </div>
                            <div className="col-span-2">
                              <label className="block text-sm font-medium mb-2">Permissions</label>
                              <div className="grid grid-cols-2 gap-2">
                                {Object.entries(editingUser.permissions).map(([key, value]) => (
                                  <label key={key} className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={value}
                                      onChange={(e) => setEditingUser({
                                        ...editingUser,
                                        permissions: {
                                          ...editingUser.permissions,
                                          [key]: e.target.checked
                                        }
                                      })}
                                      className="rounded"
                                    />
                                    <span className="capitalize">{key}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateUser(editingUser)}
                              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingUser(null)}
                              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </td>
                    ) : (
                      // View mode
                      <>
                        <td className="p-3 font-medium">{user.email}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(user.permissions).map(([key, value]) => (
                              value && (
                                <span key={key} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                  {key}
                                </span>
                              )
                            ))}
                          </div>
                        </td>
                        <td className="p-3 text-sm text-gray-500">
                          {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="p-3 text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingUser(user)}
                              className="text-blue-600 hover:underline text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id, user.email)}
                              className="text-red-600 hover:underline text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No users found</p>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Add New User</h2>
            
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block font-medium mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Temporary Password *</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full p-2 border rounded"
                />
                <p className="text-xs text-gray-500 mt-1">User will be asked to change on first login</p>
              </div>

              <div>
                <label className="block font-medium mb-1">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                  className="w-full p-2 border rounded"
                >
                  <option value="viewer">Viewer (Read-only)</option>
                  <option value="manager">Manager (Limited edit)</option>
                  <option value="admin">Admin (Full access except users)</option>
                  <option value="super_admin">Super Admin (Full access)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-2">Permissions</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(formData.permissions).map(([key, value]) => (
                    <label key={key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setFormData({
                          ...formData,
                          permissions: {
                            ...formData.permissions,
                            [key]: e.target.checked
                          }
                        })}
                        className="rounded"
                      />
                      <span className="capitalize">{key}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-black text-white py-2 rounded hover:bg-gray-800"
                >
                  Create User
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}