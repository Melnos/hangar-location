'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth';
import { Button, Input } from '@/components';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const { setUsername: setStoreUsername } = useAuthStore();

  const handleSetUsername = () => {
    if (username.trim()) {
      setStoreUsername(username.trim());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f5dc' }}>
      <div className="bg-[#f5f5dc] rounded-lg shadow-lg border border-gray-200 p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <img src="/icon-192.png" alt="Hangar Location" className="w-16 h-16 mx-auto mb-4 rounded-xl" />
          <h1 className="text-2xl font-bold text-gray-900">Hangar Location</h1>
          <p className="text-gray-500 mt-2">Entrez votre nom pour commencer</p>
        </div>

        <div className="space-y-4">
          <Input
            label="Votre nom"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Entrez votre nom"
          />
          <Button onClick={handleSetUsername} className="w-full">
            Commencer
          </Button>
        </div>
      </div>
    </div>
  );
}
