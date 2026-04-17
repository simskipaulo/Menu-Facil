import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";

const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const MenuPage = lazy(() => import("./pages/public/MenuPage"));
const CategoriesPage = lazy(() => import("./pages/admin/CategoriesPage"));
const QRCodePage = lazy(() => import("./pages/admin/QRCodePage"));
const MenuItemsPage = lazy(() => import("./pages/admin/MenuItemsPage"));
const RestaurantsPage = lazy(() => import("./pages/admin/super/RestaurantsPage"));

const qc = new QueryClient();

function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen text-gray-400">
      Carregando...
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/menu/:slug" element={<MenuPage />} />
            <Route path="/admin/categories" element={<CategoriesPage />} />
            <Route path="/admin/qrcode" element={<QRCodePage />} />
            <Route path="/admin/menu-items" element={<MenuItemsPage />} />
            <Route path="/admin/restaurants" element={<RestaurantsPage />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
