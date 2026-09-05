'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth';
import { Button, Input } from '@/components';
import { redirect } from 'next/navigation';

export default function SetupPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const { isAuthenticated, role, register } = useAuthStore();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'check' }),
        });
        const result = await response.json();
        if (result.hasAdmin) {
          redirect('/admin');
        }
      } catch {}
      setChecking(false);
    };
    checkAdmin();
  }, []);

  useEffect(() => {
    if (isAuthenticated && role === 'admin') {
      redirect('/dashboard');
    }
  }, [isAuthenticated, role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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
    const result = await register(username.trim(), password);
    if (!result.success) {
      setError(result.error || 'Erreur lors de la creation du compte');
    }
    setLoading(false);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f5dc' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verification...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f5dc' }}>
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <img src="/icon-192.png" alt="Hangar Location" className="w-16 h-16 mx-auto mb-4 rounded-xl" />
          <h1 className="text-2xl font-bold text-gray-900">Configuration Initiale</h1>
          <p className="text-gray-500 mt-2">Creer le compte administrateur (Directeur)</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800">
            <strong>Admin (Directeur):</strong> Peut voir les activites, gerer les utilisateurs, modifier les identifiants et acceder a toutes les fonctionnalites.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nom d&apos;utilisateur" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Nom d\'utilisateur admin" />
          <Input label="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe" />
          <Input label="Confirmer le mot de passe" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirmer" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" loading={loading}>Creer le compte admin</Button>
        </form>
        <div className="mt-4 text-center">
          <a href="/" className="text-sm text-gray-500 hover:text-gray-700">Retour au site public</a>
        </div>
      </div>
    </div>
  );
}