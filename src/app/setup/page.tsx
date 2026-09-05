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
  const { isAuthenticated, register } = useAuthStore();

  useEffect(() => {
    // Check if admin already exists
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
      } catch {
        // If API fails, allow setup
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
      setError('Le mot de passe doit contenir au moins 6 caractères');
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
          <p className="text-gray-500 mt-2">
            Creez le compte administrateur
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-yellow-800">
            <strong>Important:</strong> Ce compte aura un acces complet a toutes les donnees.
            Seul l&apos;administraur peut voir les details des locations (qui a loue quoi).
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nom d&apos;utilisateur"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Choisissez un nom d&apos;utilisateur"
          />
          <Input
            label="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Choisissez un mot de passe"
          />
          <Input
            label="Confirmer le mot de passe"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirmez le mot de passe"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" loading={loading}>
            Creer le compte administrateur
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
