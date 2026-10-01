import { Suspense } from 'react';
import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  return <div className="py-12 sm:py-20"><Suspense fallback={<div className="skeleton mx-auto h-96 max-w-md" />}><LoginForm /></Suspense></div>;
}
