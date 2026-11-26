import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  FaBars,
  FaBoxes,
  FaChartLine,
  FaCog,
  FaGraduationCap,
  FaHome,
  FaSignOutAlt,
  FaTools,
  FaUserCircle,
  FaUserGraduate,
  FaUsers,
} from 'react-icons/fa';
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
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { ThemeToggle } from '@/components/common/ThemeToggle';

export function AdminLayout() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navLinks = [
    { to: '/admin', label: t('admin.sidebar.dashboard'), icon: FaChartLine, end: true },
    { to: '/admin/products', label: t('admin.sidebar.products'), icon: FaBoxes },
    { to: '/admin/services', label: t('admin.sidebar.services'), icon: FaTools },
    { to: '/admin/courses', label: t('admin.sidebar.courses'), icon: FaGraduationCap },
    { to: '/admin/students', label: t('admin.sidebar.students'), icon: FaUserGraduate },
    { to: '/admin/users', label: t('admin.sidebar.users'), icon: FaUsers },
    { to: '/admin/settings', label: t('admin.sidebar.settings'), icon: FaCog },
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

  const renderLinks = (onClick) => (
    <nav className="flex flex-col gap-1 p-3">
      {navLinks.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClick}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-fg)]'
                  : 'text-[var(--sidebar-foreground)] hover:bg-secondary'
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-[var(--sidebar)]">
        <div className="flex h-16 items-center border-b border-border px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoImg} alt="LIKPH" className="h-10 w-auto object-contain rounded bg-white px-1.5 py-0.5" />
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto">{renderLinks()}</div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-2 border-b border-border bg-card/95 backdrop-blur px-3 sm:px-6">
          <div className="flex items-center gap-2">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9" aria-label="Open sidebar">
                  <FaBars className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 bg-[var(--sidebar)]">
                <div className="flex h-16 items-center border-b border-border px-4">
                  <img src={logoImg} alt="LIKPH" className="h-9 w-auto object-contain rounded bg-white px-1.5 py-0.5" />
                </div>
                {renderLinks(() => setSidebarOpen(false))}
              </SheetContent>
            </Sheet>
            <span className="font-semibold text-sm sm:text-base truncate">{t('nav.ownerPanel')}</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <LanguageSwitcher />
            <ThemeToggle />

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
                      <p className="text-sm font-semibold truncate">{user?.name}</p>
                      <Badge variant="default" className="text-[10px] px-2 py-0">
                        {t('nav.roleAdmin')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/')}>
                  <FaHome className="h-4 w-4 text-primary" />
                  <span>{t('nav.homepage')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-[var(--status-danger)]">
                  <FaSignOutAlt className="h-4 w-4" />
                  <span>{t('nav.logout')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
