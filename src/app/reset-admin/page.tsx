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
  const [step, setStep] = useState<'check' | 'reset'>('check');
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);

  const checkAdmin = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check' }),
      });
      const result = await response.json();
      setHasAdmin(result.hasAdmin);
      if (result.hasAdmin) {
        setStep('reset');
      } else {
        redirect('/setup');
      }
    } catch {
      setError('Erreur de connexion au serveur');
    }
    setLoading(false);
  };

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
        setSuccess('Admin reinitialise avec succes ! Vous pouvez maintenant vous connecter.');
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
          <p className="text-gray-500 mt-2">Reinitialiser le mot de passe administrateur</p>
        </div>

        {step === 'check' && (
          <div className="text-center">
            <p className="mb-4">Verification de l&apos;etat du compte admin...</p>
            <Button onClick={checkAdmin} loading={loading}>Verifier</Button>
          </div>
        )}

        {step === 'reset' && (
          <>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Attention:</strong> Cette action va remplacer le compte admin existant.
                L&apos;ancien admin ne sera plus accessible.
              </p>
            </div>
            <form onSubmit={handleReset} className="space-y-4">
              <Input label="Nouveau nom d&apos;utilisateur" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Nom admin" />
              <Input label="Nouveau mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe" />
              <Input label="Confirmer le mot de passe" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirmer" />
              {error && <p className="text-sm text-red-600">{error}</p>}
              {success && <p className="text-sm text-green-600">{success}</p>}
              <Button type="submit" className="w-full" loading={loading}>Reinitialiser</Button>
            </form>
          </>
        )}

        <div className="mt-4 text-center">
          <a href="/" className="text-sm text-gray-500 hover:text-gray-700">Retour au site public</a>
        </div>
      </div>
    </div>
  );
}