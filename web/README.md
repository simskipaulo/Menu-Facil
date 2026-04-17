# Web — Menu Fácil

Frontend web construído com **React 18 + Vite + TypeScript + TailwindCSS**.

## Stack

- React 18 + TypeScript
- Vite (bundler)
- TailwindCSS 3 (estilização)
- React Router v6 (roteamento)
- React Query v5 / TanStack Query (cache de dados)
- Axios (cliente HTTP)

## Estrutura

```
web/src/
├── api/
│   └── client.ts            # Axios com interceptor de auth
├── components/
│   ├── layouts/
│   │   └── AdminLayout.tsx  # Nav top com links por perfil
│   └── menu/
│       ├── CategoryChips.tsx
│       ├── TagBadge.tsx
│       └── MenuItemCard.tsx
├── hooks/
│   └── useAuth.ts           # Estado de auth + login/logout
├── pages/
│   ├── auth/LoginPage.tsx
│   ├── public/MenuPage.tsx  # Cardápio do cliente (sem auth)
│   └── admin/
│       ├── DashboardPage.tsx
│       ├── MenuItemsPage.tsx
│       ├── CategoriesPage.tsx
│       ├── TagsPage.tsx
│       ├── QRCodePage.tsx
│       └── super/RestaurantsPage.tsx
└── types/api.ts             # Interfaces TypeScript
```

## Configuração

```bash
npm install
cp .env.example .env
```

`.env`:

```env
VITE_API_URL=http://localhost:8000
```

## Executar

```bash
npm run dev
# http://localhost:5173
```

## Rotas

| Rota | Acesso |
|------|--------|
| `/login` | Público |
| `/menu/:slug` | Público — cardápio do cliente |
| `/admin/menu-items` | Admin do restaurante |
| `/admin/categories` | Admin do restaurante |
| `/admin/tags` | Admin do restaurante |
| `/admin/qrcode` | Admin do restaurante |
| `/admin/restaurants` | Super Admin |

## Build

```bash
npm run build
# Saída em dist/
```

## Deploy (Vercel)

```bash
npm install -g vercel
vercel
# Configure VITE_API_URL no dashboard do Vercel
```

O `vercel.json` já está configurado com rewrite para SPA.
