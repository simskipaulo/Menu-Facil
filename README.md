# Menu Fácil

Plataforma SaaS multi-tenant de cardápio virtual com QR Code. Cada restaurante recebe uma URL pública única — o cliente escaneia o QR e vê o cardápio no navegador, sem precisar de app ou login.

## Visão geral

| Camada | Tecnologia | Finalidade |
|--------|-----------|-----------|
| `backend/` | FastAPI + PostgreSQL | API REST, autenticação JWT, multi-tenancy |
| `web/` | React + Vite + TailwindCSS | Painel admin web + cardápio público |
| `mobile/` | Expo (React Native) | Painel admin mobile |

## Perfis de acesso

- **Super Admin** — cria e gerencia restaurantes, cria admins
- **Admin do Restaurante** — gerencia categorias, tags, pratos e QR code do seu restaurante
- **Cliente** — acessa o cardápio público via QR code, sem login

## Fluxo básico

1. Super Admin cria um restaurante com slug único (ex: `pizzaria-joao`)
2. Super Admin cria um usuário admin para o restaurante
3. Admin do restaurante cadastra categorias, tags e pratos
4. Admin gera o QR Code e imprime/coloca na mesa
5. Cliente escaneia → abre `https://seudominio.com/menu/pizzaria-joao` → vê o cardápio com filtros

## Deploy

| Serviço | Plataforma |
|---------|-----------|
| Backend + PostgreSQL | Railway |
| Frontend web | Vercel |
| App mobile | EAS Build (Expo) |

## Início rápido

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # preencha as variáveis
alembic upgrade head
uvicorn app.main:app --reload

# Web
cd web
npm install
cp .env.example .env  # VITE_API_URL=http://localhost:8000
npm run dev

# Mobile
cd mobile
npm install
npx expo start
```

Consulte o README de cada pasta para instruções detalhadas.
