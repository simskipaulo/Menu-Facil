import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const restaurantLinks = [
  { to: "/admin/menu-items", label: "Cardápio", icon: "restaurant" },
  { to: "/admin/categories", label: "Categorias", icon: "grid" },
  { to: "/admin/qrcode", label: "QR Code", icon: "qrcode" },
];

const superLinks = [{ to: "/admin/restaurants", label: "Restaurantes", icon: "building" }];

const pageTitles: Record<string, string> = {
  "/admin/menu-items": "Cardápio",
  "/admin/categories": "Categorias",
  "/admin/qrcode": "QR Code",
  "/admin/restaurants": "Restaurantes",
};

function SvgIcon({ name, className }: { name: string; className?: string }) {
  const icons: Record<string, JSX.Element> = {
    restaurant: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className ?? "w-5 h-5"}>
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
      </svg>
    ),
    grid: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className ?? "w-5 h-5"}>
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    qrcode: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className ?? "w-5 h-5"}>
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
        <path d="M14 14h2v2h-2z" /><path d="M18 14h3" /><path d="M14 18h2" /><path d="M18 18h3v3" /><path d="M20 21h1" />
      </svg>
    ),
    building: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className ?? "w-5 h-5"}>
        <path d="M3 21h18" /><rect x="4" y="3" width="16" height="18" rx="1" /><path d="M9 21V12h6v9" /><path d="M9 7h1" /><path d="M14 7h1" /><path d="M9 11h1" /><path d="M14 11h1" />
      </svg>
    ),
    logout: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className ?? "w-4 h-4"}>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    ),
  };
  return icons[name] ?? null;
}

function SidebarLink({ to, label, icon, active }: { to: string; label: string; icon: string; active: boolean }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
        active
          ? "bg-brand-50 text-brand-700 font-semibold"
          : "text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50"
      }`}
    >
      <span className={active ? "text-brand-600" : "text-neutral-400"}>
        <SvgIcon name={icon} />
      </span>
      {label}
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-600" />}
    </Link>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const links = user?.role === "super_admin" ? superLinks : restaurantLinks;
  const pageTitle = pageTitles[pathname] ?? "Admin";
  const initials = user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="flex h-screen bg-neutral-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-white border-r border-neutral-100 shadow-sidebar flex flex-col h-screen sticky top-0 z-30">
        {/* Brand */}
        <div className="h-16 flex items-center px-5 border-b border-neutral-100 flex-shrink-0">
          <img src="/logo.png" alt="Menu Fácil" className="w-8 h-8 rounded-xl object-cover" />
          <div className="ml-3">
            <p className="text-sm font-bold text-neutral-900 leading-tight">Menu Fácil</p>
            <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">Admin</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {links.map((l) => (
            <SidebarLink key={l.to} to={l.to} label={l.label} icon={l.icon} active={pathname === l.to} />
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-neutral-100 p-3 flex-shrink-0">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-neutral-700 truncate">{user?.email}</p>
              <p className="text-[10px] text-neutral-400 capitalize">
                {user?.role === "super_admin" ? "Super Admin" : "Admin"}
              </p>
            </div>
            <button
              onClick={() => { logout(); navigate("/login"); }}
              title="Sair"
              className="text-neutral-400 hover:text-danger-500 transition-colors p-1.5 rounded-lg hover:bg-danger-50"
            >
              <SvgIcon name="logout" />
            </button>
          </div>
        </div>
      </aside>

      {/* Right side */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="h-16 bg-white border-b border-neutral-100 flex items-center px-6 flex-shrink-0">
          <h1 className="text-base font-semibold text-neutral-800">{pageTitle}</h1>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
