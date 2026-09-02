'use client';

import { useParams } from 'next/navigation';
import ModifierVehiculePage from './ModifierVehicule';

export default function ModifierVehiculeWrapper() {
  const params = useParams();
  return <ModifierVehiculePage params={{ id: params.id as string }} />;
}
