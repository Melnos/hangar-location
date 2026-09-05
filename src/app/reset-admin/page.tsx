'use client';

import { useState } from 'react';
import { Button, Input } from '@/components';
import { redirect } from 'next/navigation';

export default function ResetAdminPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [confirmPassword, setConfirmPassword] = useState('admin123');
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
        setSuccess('Admin cree ! Vous pouvez vous connecter avec ces identifiants.');
        setTimeout(() => redirect('/admin'), 2000);
      } else {
        setError(result.error || 'Erreur lors de la creation');
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
          <h1 className="text-2xl font-bold text-gray-900">Configuration Admin</h1>
          <p className="text-gray-500 mt-2">Identifiants par defaut</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-green-800">
            <strong>Identifiants par defaut:</strong><br/>
            Utilisateur: <code className="bg-green-100 px-1">admin</code><br/>
            Mot de passe: <code className="bg-green-100 px-1">admin123</code>
          </p>
        </div>

        <form onSubmit={handleReset} className="space-y-4">
          <Input label="Nom d&apos;utilisateur" value={username} onChange={(e) => setUsername(e.target.value)} />
          <Input label="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Input label="Confirmer le mot de passe" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
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