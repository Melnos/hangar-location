'use client';

import { useParams } from 'next/navigation';
import VehiculeDetailPage from './VehiculeDetail';

export default function VehiculeDetailWrapper() {
  const params = useParams();
  return <VehiculeDetailPage params={{ id: params.id as string }} />;
}
