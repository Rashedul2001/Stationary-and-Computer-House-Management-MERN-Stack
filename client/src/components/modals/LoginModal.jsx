import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { authClient } from '@/lib/authClient';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LoginModal({ open, onOpenChange }) {
  const { t } = useTranslation();
  const { refetchSession } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await authClient.signIn.email({
        email: email.trim(),
        password,
      });
      if (error) {
        toast.error(error.message || 'Invalid email or password');
        return;
      }
      await refetchSession();
      toast.success(t('auth.loginSuccess'));
      setPassword('');
      onOpenChange(false);
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.post('/api/auth/request-password-reset', {
        email: email.trim(),
        redirectTo: `${window.location.origin}/reset-password`,
      });
      toast.success(t('auth.resetSent'));
      setMode('login');
    } catch (err) {
      toast.error(err.message || 'Failed to request password reset');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (next) => {
    if (!next) setMode('login');
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'login' ? t('auth.loginTitle') : t('auth.resetTitle')}</DialogTitle>
          <DialogDescription>
            {mode === 'login' ? t('auth.loginSubtitle') : t('auth.resetSubtitle')}
          </DialogDescription>
        </DialogHeader>

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="login-email">{t('auth.email')}</Label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="login-password">{t('auth.password')}</Label>
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <DialogFooter className="sm:justify-between items-center pt-1">
              <button
                type="button"
                onClick={() => setMode('forgot')}
                className="text-xs font-medium text-primary hover:underline cursor-pointer"
              >
                {t('auth.forgotPassword')}
              </button>
              <Button type="submit" disabled={loading}>
                {loading ? '...' : t('nav.login')}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={handleForgot} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="forgot-email">{t('auth.email')}</Label>
              <Input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />
            </div>

            <DialogFooter className="sm:justify-between items-center pt-1">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline cursor-pointer"
              >
                {t('auth.backToLogin')}
              </button>
              <Button type="submit" disabled={loading}>
                {loading ? '...' : t('auth.sendResetLink')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
