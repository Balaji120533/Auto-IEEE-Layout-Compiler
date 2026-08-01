import { Suspense } from 'react';
import LoginForm from './LoginForm';

export const metadata = { title: 'Sign in — Auto-IEEE Compiler' };

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
