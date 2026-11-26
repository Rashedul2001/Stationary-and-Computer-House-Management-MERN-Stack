import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/common/Navbar';
import { Footer } from '@/components/common/Footer';
import { FloatingPosMenu } from '@/components/common/FloatingPosMenu';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { LandingPage } from '@/pages/LandingPage';
import { ProductsPage } from '@/pages/ProductsPage';
import { ServicesPage } from '@/pages/ServicesPage';
import { CoursesPage } from '@/pages/CoursesPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminProductsPage } from '@/pages/admin/AdminProductsPage';
import { AdminServicesPage } from '@/pages/admin/AdminServicesPage';
import { AdminCoursesPage } from '@/pages/admin/AdminCoursesPage';
import { AdminStudentsPage } from '@/pages/admin/AdminStudentsPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { AdminSiteSettingsPage } from '@/pages/admin/AdminSiteSettingsPage';

function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <FloatingPosMenu />
    </div>
  );
}

function AdminRoute() {
  const { isPending, isAuthenticated, isAdmin } = useAuth();
  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }
  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/" replace />;
  }
  return <AdminLayout />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      <Route path="/admin" element={<AdminRoute />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="services" element={<AdminServicesPage />} />
        <Route path="courses" element={<AdminCoursesPage />} />
        <Route path="students" element={<AdminStudentsPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="settings" element={<AdminSiteSettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
