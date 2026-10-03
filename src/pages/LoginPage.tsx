import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import { Input } from '../components/ui/Input.tsx';
import { Button } from '../components/ui/Button.tsx';
import { useToast } from '../hooks/useToast.tsx';

export default function LoginPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [email, setEmail] = useState('admin@awn.sa');
  const [password, setPassword] = useState('••••••••');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem('auth_token', 'demo_token_awn');
      localStorage.setItem('isAuthenticated', 'true');
      setLoading(false);
      showToast({
        title: 'Logged in successfully',
        description: 'Welcome to AWN Enterprise Portal.',
        variant: 'success',
      });
      navigate('/service/dashboard');
    }, 300);
  };

  return (
    <div className="min-h-screen bg-awn-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-awn-surface border border-awn-border rounded-xl p-8 space-y-6 shadow-sm">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-lg bg-awn-primary text-awn-on-primary font-bold text-lg flex items-center justify-center mx-auto">
            ع
          </div>
          <h1 className="text-xl font-bold text-awn-text-primary tracking-tight">AWN Portal Login</h1>
          <p className="text-xs text-awn-text-secondary">Sign in to access your AWN service & asset management workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full"
            loading={loading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}
