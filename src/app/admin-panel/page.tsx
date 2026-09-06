'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth';
import { Button, Input } from '@/components';
import { redirect } from 'next/navigation';
import { Activity, KeyRound, ShieldCheck, Trash2, UserPlus, Users } from 'lucide-react';

interface User {
  id: string;
  username: string;
  role: string;
  created_by: string | null;
  createdAt: string;
  lastLogin: string | null;
}

interface ActivityLog {
  id: string;
  user_id: string;
  username: string;
  action: string;
  details: string | null;
  timestamp: string;
}

export default function AdminPanelPage() {
  const { isAuthenticated, role, username: adminUsername, registerUser, updateAdminCredentials } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'activity' | 'settings'>('users');

  const [adminNewUsername, setAdminNewUsername] = useState('');
  const [adminNewPassword, setAdminNewPassword] = useState('');

  const handleDeleteUser = async (user: User) => {
    if (user.role === 'admin' || !window.confirm(`Supprimer l'utilisateur ${user.username} ?`)) return;
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${useAuthStore.getState().token}`,
        },
        body: JSON.stringify({ action: 'delete_user', userId: user.id, adminId: useAuthStore.getState().userId }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Erreur de suppression');
      setSuccess(`Utilisateur ${user.username} supprime`);
      await fetchUsers();
      await fetchActivity();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Erreur de suppression');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || role !== 'admin') {
      redirect('/admin');
      return;
    }
    fetchUsers();
    fetchActivity();
  }, [isAuthenticated, role]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_users' }),
      });
      const result = await response.json();
      if (result.success) {
        setUsers(result.users);
      }
    } catch {}
  };

  const fetchActivity = async () => {
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'activity_today' }),
      });
      const result = await response.json();
      if (result.success) {
        setActivityLogs(result.logs);
      }
    } catch {}
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    if (!newUsername.trim() || !newPassword.trim()) {
      setError('Veuillez remplir tous les champs');
      setLoading(false);
      return;
    }
    if (newPassword.length < 4) {
      setError('Le mot de passe doit contenir au moins 4 caracteres');
      setLoading(false);
      return;
    }
    const result = await registerUser(newUsername.trim(), newPassword);
    if (result.success) {
      setSuccess(`Utilisateur ${newUsername} cree avec succes`);
      setNewUsername('');
      setNewPassword('');
      fetchUsers();
    } else {
      setError(result.error || 'Erreur');
    }
    setLoading(false);
  };

  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    if (!adminNewUsername.trim() || !adminNewPassword.trim()) {
      setError('Veuillez remplir tous les champs');
      setLoading(false);
      return;
    }
    if (adminNewPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caracteres');
      setLoading(false);
      return;
    }
    const result = await updateAdminCredentials(adminNewUsername, adminNewPassword);
    if (result.success) {
      setSuccess('Identifiants admin mis a jour');
      setAdminNewUsername('');
      setAdminNewPassword('');
    } else {
      setError(result.error || 'Erreur');
    }
    setLoading(false);
  };

  if (!isAuthenticated || role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f5f5dc] p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 rounded-2xl bg-slate-950 p-5 text-white shadow-lg sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Administration</p>
              <h1 className="text-2xl font-bold sm:text-3xl">Centre de contrôle</h1>
              <p className="mt-2 text-sm text-slate-300">Gérez les accès, surveillez l’activité et protégez votre flotte.</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300"><ShieldCheck className="h-5 w-5 text-emerald-400" /> Connecté : {adminUsername}</div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {([['users', Users, 'Utilisateurs', `${users.length} comptes`], ['activity', Activity, 'Activité du jour', `${activityLogs.length} événements`], ['settings', KeyRound, 'Sécurité', 'Identifiants admin']] as const).map(([tab, Icon, label, detail]) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${activeTab === tab ? 'border-blue-600 bg-blue-600 text-white shadow-md' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300'}`}>
              <Icon className="h-5 w-5" /><span><span className="block font-semibold">{label}</span><span className={`text-xs ${activeTab === tab ? 'text-blue-100' : 'text-slate-500'}`}>{detail}</span></span>
            </button>
          ))}
        </div>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
        {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}

        {activeTab === 'users' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold"><UserPlus className="h-5 w-5 text-blue-600" />Ajouter un employé</h2>
            <form onSubmit={handleAddUser} className="mb-8 grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <Input label="Nom" placeholder="Nom d'utilisateur" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
              <Input label="Mot de passe" type="password" placeholder="Mot de passe" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <Button type="submit" loading={loading}>Ajouter</Button>
            </form>

            <h2 className="mb-4 text-xl font-semibold">Liste des utilisateurs ({users.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Nom</th>
                    <th className="text-left py-2">Role</th>
                    <th className="text-left py-2">Cree le</th>
                    <th className="text-left py-2">Derniere connexion</th>
                    <th className="py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b">
                      <td className="py-2">{user.username}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded text-xs ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                          {user.role === 'admin' ? 'Directeur' : 'Employe'}
                        </span>
                      </td>
                      <td className="py-2 text-sm text-gray-500">{new Date(user.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td className="py-2 text-sm text-gray-500">{user.lastLogin ? new Date(user.lastLogin).toLocaleString('fr-FR') : 'Jamais'}</td>
                      <td className="py-2 text-right"><button type="button" onClick={() => handleDeleteUser(user)} disabled={user.role === 'admin' || loading} title={user.role === 'admin' ? 'Le compte admin est protégé' : 'Supprimer cet utilisateur'} className="inline-flex rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"><Trash2 className="h-4 w-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Activite du jour</h2>
            {activityLogs.length === 0 ? (
              <p className="text-gray-500">Aucune activite aujourd\'hui</p>
            ) : (
              <div className="space-y-2">
                {activityLogs.map((log) => (
                  <div key={log.id} className="border-b py-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{log.username}</span>
                      <span className="text-sm text-gray-500">{new Date(log.timestamp).toLocaleTimeString('fr-FR')}</span>
                    </div>
                    <p className="text-sm text-gray-600">{log.action}{log.details ? `: ${log.details}` : ''}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Modifier les identifiants admin</h2>
            <form onSubmit={handleUpdateAdmin} className="space-y-4 max-w-md">
              <Input label="Nouveau nom d\'utilisateur" value={adminNewUsername} onChange={(e) => setAdminNewUsername(e.target.value)} placeholder="Nouveau nom" />
              <Input label="Nouveau mot de passe" type="password" value={adminNewPassword} onChange={(e) => setAdminNewPassword(e.target.value)} placeholder="Nouveau mot de passe" />
              <Button type="submit" loading={loading}>Mettre a jour</Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}