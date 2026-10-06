import { Suspense } from 'react';
import LoginForm from './LoginForm';

export const metadata = { title: 'Sign in — Scribe' };

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
