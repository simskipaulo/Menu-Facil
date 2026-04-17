import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const restaurantLinks = [
  { to: "/admin/menu-items", label: "Cardápio" },
  { to: "/admin/categories", label: "Categorias" },
  { to: "/admin/tags", label: "Tags" },
  { to: "/admin/qrcode", label: "QR Code" },
];

const superLinks = [{ to: "/admin/restaurants", label: "Restaurantes" }];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const links = user?.role === "super_admin" ? superLinks : restaurantLinks;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 flex items-center gap-6 h-14">
        <span className="font-bold text-blue-600 mr-2">Menu Fácil</span>
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={`text-sm font-medium pb-1 border-b-2 ${
              pathname === l.to
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {l.label}
          </Link>
        ))}
        <button
          className="ml-auto text-sm text-gray-500 hover:text-gray-700"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          Sair
        </button>
      </nav>
      <main className="max-w-5xl mx-auto p-6">{children}</main>
    </div>
  );
}
