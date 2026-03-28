// app/admin/users/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

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
    settings: boolean;
  };
  status: 'active' | 'inactive' | 'suspended';
  last_login?: string;
  created_at: string;
  updated_at?: string;
  created_by?: string;
}

interface AuditLog {
  id: number;
  user_id: string;
  action: string;
  details: string;
  ip_address?: string;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state for new user
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'viewer' as const,
    status: 'active' as const,
    permissions: {
      dogs: false,
      products: false,
      sales: false,
      expenses: false,
      users: false,
      reports: true,
      settings: false
    }
  });

  // Get current user from session
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
    fetchAuditLogs();
  }, []);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_roles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsers((data as AdminUser[]) || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      alert('Error loading users: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setAuditLogs((data as AuditLog[]) || []);
    } catch (error: any) {
      console.error('Error fetching audit logs:', error);
    }
  };

  const logAudit = async (action: string, details: string) => {
    try {
      await supabase.from('audit_logs').insert([{
        user_id: currentUser?.id,
        action,
        details,
        ip_address: await fetchIP()
      }]);
    } catch (error) {
      console.error('Error logging audit:', error);
    }
  };

  const fetchIP = async () => {
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const contentType = response.headers.get("content-type");
      let data;
      
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const textError = await response.text();
        throw new Error(`Server error: ${textError.substring(0, 100)}`);
      }

      if (!response.ok) throw new Error(data.error || 'Failed to create user');

      await logAudit('user_created', `Created user: ${formData.email} with role: ${formData.role}`);
      
      alert('✅ User created successfully!');
      setShowAddModal(false);
      setFormData({
        email: '',
        password: '',
        role: 'viewer',
        status: 'active',
        permissions: {
          dogs: false,
          products: false,
          sales: false,
          expenses: false,
          users: false,
          reports: true,
          settings: false
        }
      });
      fetchUsers();
      
    } catch (error: any) {
      console.error('Error creating user:', error);
      alert('Error creating user: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('admin_roles')
        .update({
          role: editingUser.role,
          permissions: editingUser.permissions,
          status: editingUser.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      await logAudit('user_updated', `Updated user: ${editingUser.email} - Role: ${editingUser.role}, Status: ${editingUser.status}`);
      
      alert('✅ User updated successfully!');
      setEditingUser(null);
      fetchUsers();
      
    } catch (error: any) {
      console.error('Error updating user:', error);
      alert('Error updating user: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    if (selectedUser.email === currentUser?.email) {
      alert('You cannot delete your own account!');
      return;
    }
    
    if (!confirm(`⚠️ Are you sure you want to permanently delete user: ${selectedUser.email}? This action cannot be undone.`)) return;

    setSubmitting(true);

    try {
      const response = await fetch('/api/admin/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.user_id,
          adminRoleId: selectedUser.id
        }),
      });

      const contentType = response.headers.get("content-type");
      let data;
      
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const textError = await response.text();
        throw new Error(`Server error: ${textError.substring(0, 100)}`);
      }

      if (!response.ok) throw new Error(data.error || 'Failed to delete user');

      await logAudit('user_deleted', `Deleted user: ${selectedUser.email}`);
      
      alert('✅ User deleted successfully!');
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers();
      
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert('Error deleting user: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetPassword = async (user: AdminUser) => {
    if (!confirm(`Send password reset email to ${user.email}?`)) return;
    
    setSubmitting(true);
    try {
      const response = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Failed to send reset email');

      await logAudit('password_reset', `Sent password reset to: ${user.email}`);
      
      alert(`✅ Password reset email sent to ${user.email}`);
      
    } catch (error: any) {
      console.error('Error resetting password:', error);
      alert('Error sending reset email: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch(role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'manager': return 'bg-green-100 text-green-800 border-green-200';
      case 'viewer': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'active':
        return <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">🟢 Active</span>;
      case 'inactive':
        return <span className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">🟡 Inactive</span>;
      case 'suspended':
        return <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">🔴 Suspended</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    superAdmin: users.filter(u => u.role === 'super_admin').length,
    admin: users.filter(u => u.role === 'admin').length,
    manager: users.filter(u => u.role === 'manager').length,
    viewer: users.filter(u => u.role === 'viewer').length
  };

  if (loading && users.length === 0) return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="animate-pulse text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-500">Loading users...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">👥 User Management</h1>
            <p className="text-gray-600 text-sm mt-1">Manage admin users, roles, and permissions</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAuditModal(true)}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-md transition-all"
            >
              <span>📋</span> Audit Logs
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-md transition-all transform hover:scale-105"
            >
              <span className="text-lg">➕</span> Add New User
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm text-center">
            <p className="text-xs text-gray-500">Total Users</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm text-center border-l-4 border-green-500">
            <p className="text-xs text-gray-500">Active</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm text-center border-l-4 border-purple-500">
            <p className="text-xs text-gray-500">Super Admin</p>
            <p className="text-2xl font-bold text-purple-600">{stats.superAdmin}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm text-center border-l-4 border-blue-500">
            <p className="text-xs text-gray-500">Admin</p>
            <p className="text-2xl font-bold text-blue-600">{stats.admin}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm text-center border-l-4 border-green-500">
            <p className="text-xs text-gray-500">Manager</p>
            <p className="text-2xl font-bold text-green-600">{stats.manager}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm text-center border-l-4 border-gray-500">
            <p className="text-xs text-gray-500">Viewer</p>
            <p className="text-2xl font-bold text-gray-600">{stats.viewer}</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Search users by email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="viewer">Viewer</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 text-left text-sm font-semibold text-gray-600">User</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-600">Role</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-600">Permissions</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-600">Status</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-600">Last Login</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-600">Created</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-t hover:bg-gray-50 transition">
                    {editingUser?.id === user.id ? (
                      // Edit Mode
                      <td colSpan={7} className="p-4 bg-blue-50">
                        <div className="space-y-4">
                          <p className="font-bold text-gray-900">{user.email}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <div>
                              <label className="block text-sm font-medium mb-1">Status</label>
                              <select
                                value={editingUser.status}
                                onChange={(e) => setEditingUser({
                                  ...editingUser,
                                  status: e.target.value as any
                                })}
                                className="w-full p-2 border rounded"
                              >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="suspended">Suspended</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Permissions</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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
                                  <span className="text-sm capitalize">{key}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={handleUpdateUser}
                              disabled={submitting}
                              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                            >
                              {submitting ? 'Saving...' : 'Save Changes'}
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
                      // View Mode
                      <>
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-gray-900">{user.email}</p>
                            <p className="text-xs text-gray-500">{user.user_id?.slice(0, 8)}...</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(user.role)}`}>
                            {user.role.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(user.permissions).map(([key, value]) => (
                              value && (
                                <span key={key} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                  {key}
                                </span>
                              )
                            ))}
                          </div>
                        </td>
                        <td className="p-4">
                          {getStatusBadge(user.status)}
                        </td>
                        <td className="p-4 text-sm text-gray-500">
                          {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                        </td>
                        <td className="p-4 text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => setEditingUser(user)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => resetPassword(user)}
                              className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
                            >
                              Reset PW
                            </button>
                            {user.email !== currentUser?.email && (
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowDeleteModal(true);
                                }}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                              >
                                Delete
                              </button>
                            )}
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
              <button
                onClick={() => setShowAddModal(true)}
                className="text-blue-600 hover:underline mt-2 inline-block"
              >
                Add your first user →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2">Add New User</h2>
              <p className="text-gray-600 mb-4">Create a new admin account</p>
              
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="user@example.com"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">Temporary Password *</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Min 6 characters"
                  />
                  <p className="text-xs text-gray-500 mt-1">User will be asked to change on first login</p>
                </div>

                <div>
                  <label className="block font-medium mb-1">Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="viewer">Viewer (Read-only)</option>
                    <option value="manager">Manager (Limited edit)</option>
                    <option value="admin">Admin (Full access except users)</option>
                    <option value="super_admin">Super Admin (Full access)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium mb-2">Permissions</label>
                  <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
                    {Object.entries(formData.permissions).map(([key, value]) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer">
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
                          disabled={formData.role === 'viewer' && key !== 'reports'}
                        />
                        <span className="capitalize text-sm">{key}</span>
                      </label>
                    ))}
                  </div>
                  {formData.role === 'viewer' && (
                    <p className="text-xs text-gray-500 mt-2">Viewers only have read access to reports by default.</p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 transition"
                  >
                    {submitting ? 'Creating...' : 'Create User'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2 text-red-600">Delete User</h2>
              <p className="text-gray-600 mb-4">Are you sure you want to delete this user?</p>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Role:</strong> {selectedUser.role}</p>
                <p><strong>Status:</strong> {selectedUser.status}</p>
              </div>
              
              <div className="bg-red-50 p-3 rounded-lg mb-4">
                <p className="text-sm text-red-800">
                  ⚠️ This action cannot be undone. The user will be permanently removed.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteUser}
                  disabled={submitting}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700 disabled:opacity-50"
                >
                  {submitting ? 'Deleting...' : 'Yes, Delete User'}
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Logs Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">📋 Audit Logs</h2>
                <button
                  onClick={() => setShowAuditModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>
              <p className="text-gray-500 text-sm mt-1">Recent user activity and system changes</p>
            </div>
            <div className="overflow-y-auto max-h-[60vh] p-4">
              {auditLogs.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No audit logs found</p>
              ) : (
                <div className="space-y-3">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{log.action.replace('_', ' ').toUpperCase()}</p>
                          <p className="text-xs text-gray-600 mt-1">{log.details}</p>
                        </div>
                        <p className="text-xs text-gray-400">
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                      {log.ip_address && (
                        <p className="text-xs text-gray-400 mt-2">IP: {log.ip_address}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={() => setShowAuditModal(false)}
                className="w-full py-2 bg-gray-200 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}