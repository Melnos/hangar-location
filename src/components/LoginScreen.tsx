'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth';
import { Button, Input } from '@/components';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changeError, setChangeError] = useState('');

  const { login, isFirstLogin, changeCredentials } = useAuthStore();

  useEffect(() => {
    if (isFirstLogin) {
      setShowChangePassword(true);
    }
  }, [isFirstLogin]);

  const handleLogin = () => {
    setError('');
    const success = login(username, password);
    if (!success) {
      setError('Identifiants incorrects');
    }
  };

  const handleChangeCredentials = () => {
    setChangeError('');
    if (!newUsername.trim() || !newPassword.trim()) {
      setChangeError('Veuillez remplir tous les champs');
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangeError('Les mots de passe ne correspondent pas');
      return;
    }
    if (newPassword.length < 6) {
      setChangeError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    changeCredentials(newUsername, newPassword);
    setShowChangePassword(false);
    setUsername(newUsername);
    setPassword(newPassword);
  };

  if (showChangePassword && isFirstLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f5dc' }}>
        <div className="bg-[#f5f5dc] rounded-lg shadow-lg border border-gray-200 p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <img src="/icon-192.png" alt="Hangar Location" className="w-16 h-16 mx-auto mb-4 rounded-xl" />
            <h1 className="text-2xl font-bold text-gray-900">Hangar Location</h1>
            <p className="text-gray-500 mt-2">Première connexion - Créez vos identifiants</p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>Identifiants par défaut :</strong> Admin / admin123
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              Veuillez les changer pour votre sécurité.
            </p>
          </div>

          <div className="space-y-4">
            <Input
              label="Nouveau nom d'utilisateur"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Entrez un nom d'utilisateur"
            />
            <Input
              label="Nouveau mot de passe"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 caractères"
            />
            <Input
              label="Confirmer le mot de passe"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmez le mot de passe"
            />
            {changeError && <p className="text-sm text-red-600">{changeError}</p>}
            <Button onClick={handleChangeCredentials} className="w-full">
              Créer mes identifiants
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f5dc' }}>
      <div className="bg-[#f5f5dc] rounded-lg shadow-lg border border-gray-200 p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <img src="/icon-192.png" alt="Hangar Location" className="w-16 h-16 mx-auto mb-4 rounded-xl" />
          <h1 className="text-2xl font-bold text-gray-900">Hangar Location</h1>
          <p className="text-gray-500 mt-2">Connectez-vous pour continuer</p>
        </div>

        <div className="space-y-4">
          <Input
            label="Nom d'utilisateur"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Entrez votre nom d'utilisateur"
          />
          <Input
            label="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Entrez votre mot de passe"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button onClick={handleLogin} className="w-full">
            Se connecter
          </Button>
        </div>
      </div>
    </div>
  );
}
