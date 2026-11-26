import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FaBars, FaSignOutAlt, FaUserCircle, FaUserShield } from 'react-icons/fa';
import logoImg from '@/assets/logo.png';
import { useAuth } from '@/hooks/useAuth';
import { authClient } from '@/lib/authClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { LoginModal } from '../modals/LoginModal';

export function Navbar() {
  const { t } = useTranslation();
  const { user, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [loginOpen, setLoginOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { to: '/', label: t('nav.home') },
    { to: '/products', label: t('nav.products') },
    { to: '/services', label: t('nav.services') },
    { to: '/courses', label: t('nav.courses') },
  ];

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      toast.success(t('auth.logoutSuccess'));
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Logout failed');
    }
  };

  return (
    <>
      <header className="no-print sticky top-0 z-40 w-full border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:px-6">
          {/* Left: Mobile Menu + Logo */}
          <div className="flex items-center gap-2 min-w-0">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 shrink-0" aria-label="Open menu">
                  <FaBars className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 flex flex-col gap-4 pt-10">
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 pb-2 border-b border-border">
                  <img src={logoImg} alt="LIKPH Logo" className="h-9 w-auto object-contain rounded" />
                </Link>
                <nav className="flex flex-col gap-1">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/'}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-fg)]'
                            : 'text-foreground hover:bg-secondary'
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>

            <Link to="/" className="flex items-center gap-2 shrink-0">
              <img
                src={logoImg}
                alt="LIKPH"
                className="h-9 sm:h-11 w-auto max-w-[130px] sm:max-w-[175px] object-contain rounded bg-white px-1.5 py-0.5"
              />
            </Link>
          </div>

          {/* Center: Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-secondary'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right: Language, Theme, Auth */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <LanguageSwitcher />
            <ThemeToggle />

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9 rounded-full overflow-hidden p-0">
                    {user?.image ? (
                      <img src={user.image} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                      <FaUserCircle className="h-5 w-5 text-primary" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
                        <Badge variant={isAdmin ? 'default' : 'secondary'} className="text-[10px] px-2 py-0">
                          {isAdmin ? t('nav.roleAdmin') : t('nav.roleAssistant')}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <FaUserShield className="h-4 w-4 text-primary" />
                      <span>{t('nav.ownerPanel')}</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleLogout} className="text-[var(--status-danger)]">
                    <FaSignOutAlt className="h-4 w-4" />
                    <span>{t('nav.logout')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" onClick={() => setLoginOpen(true)} className="h-9 px-3 text-xs sm:text-sm">
                {t('nav.login')}
              </Button>
            )}
          </div>
        </div>
      </header>

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </>
  );
}
