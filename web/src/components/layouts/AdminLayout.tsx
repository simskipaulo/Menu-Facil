import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const restaurantLinks = [
  { to: "/admin/menu-items", label: "Cardápio" },
  { to: "/admin/categories", label: "Categorias" },
  { to: "/admin/qrcode", label: "QR Code" },
];

const superLinks = [{ to: "/admin/restaurants", label: "Restaurantes" }];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const links = user?.role === "super_admin" ? superLinks : restaurantLinks;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)" }}>
      <nav style={{ background: "linear-gradient(90deg, #1e3a8a 0%, #1d4ed8 100%)" }}
        className="px-6 flex items-center gap-1 h-14 shadow-lg">
        <span className="font-bold text-white text-lg tracking-tight mr-4 flex items-center gap-2">
          <img src="/logo.png" alt="" className="w-7 h-7 rounded-lg object-cover opacity-90" />
          Menu Fácil
        </span>
        <div className="flex items-center gap-1 flex-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                pathname === l.to
                  ? "bg-white/20 text-white"
                  : "text-blue-200 hover:text-white hover:bg-white/10"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-blue-200 text-xs">{user?.email}</span>
          <button
            className="text-sm text-blue-200 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-all"
            onClick={() => { logout(); navigate("/login"); }}
          >
            Sair
          </button>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto p-6">{children}</main>
    </div>
  );
}
