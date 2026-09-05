'use client';

import { useState } from 'react';
import { Button, Input } from '@/components';
import { redirect } from 'next/navigation';

export default function ResetAdminPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!username.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs');
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_admin', username: username.trim(), password }),
      });
      const result = await response.json();
      if (result.success) {
        setSuccess('Admin reinitialise avec succes ! Redirection vers la connexion...');
        setTimeout(() => redirect('/admin'), 2000);
      } else {
        setError(result.error || 'Erreur lors de la reinitialisation');
      }
    } catch {
      setError('Erreur de connexion au serveur');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f5dc' }}>
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <img src="/icon-192.png" alt="Hangar Location" className="w-16 h-16 mx-auto mb-4 rounded-xl" />
          <h1 className="text-2xl font-bold text-gray-900">Reinitialisation Admin</h1>
          <p className="text-gray-500 mt-2">Creez un nouveau compte administrateur</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-yellow-800">
            <strong>Information:</strong> Si un admin existe deja, il sera remplace par ce nouveau compte.
          </p>
        </div>

        <form onSubmit={handleReset} className="space-y-4">
          <Input label="Nom d&apos;utilisateur" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Entrez un nom" />
          <Input label="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 6 caracteres" />
          <Input label="Confirmer le mot de passe" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirmez" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}
          <Button type="submit" className="w-full" loading={loading}>Creer le compte admin</Button>
        </form>

        <div className="mt-4 text-center">
          <a href="/" className="text-sm text-gray-500 hover:text-gray-700">Retour au site public</a>
        </div>
      </div>
    </div>
  );
}