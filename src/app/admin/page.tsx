'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth';
import { Button, Input } from '@/components';
import { redirect } from 'next/navigation';

export default function AdminPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const { isAuthenticated, login } = useAuthStore();

  useEffect(() => {
    // Check if admin exists, if not redirect to setup
    const checkAdmin = async () => {
      try {
        const response = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'check' }),
        });
        const result = await response.json();
        if (!result.hasAdmin) {
          redirect('/setup');
        }
      } catch {
        // If API fails, continue
      } finally {
        setChecking(false);
      }
    };
    checkAdmin();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      redirect('/dashboard');
    }
  }, [isAuthenticated]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs');
      setLoading(false);
      return;
    }

    const result = await login(username.trim(), password);

    if (!result.success) {
      setError(result.error || 'Erreur de connexion');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f5dc' }}>
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <img src="/icon-192.png" alt="Hangar Location" className="w-16 h-16 mx-auto mb-4 rounded-xl" />
          <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
          <p className="text-gray-500 mt-2">
            Acces reserve a l&apos;administrateur
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nom d&apos;utilisateur"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Entrez votre nom d&apos;utilisateur"
          />
          <Input
            label="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Entrez votre mot de passe"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" loading={loading}>
            Se connecter
          </Button>
        </form>

        <div className="mt-4 text-center">
          <a href="/" className="text-sm text-gray-500 hover:text-gray-700">
            Retour au site public
          </a>
        </div>
      </div>
    </div>
  );
}
