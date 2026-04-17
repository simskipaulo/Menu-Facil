# Backend — Menu Fácil

API REST construída com **FastAPI + PostgreSQL + SQLAlchemy 2.0**.

## Stack

- Python 3.12
- FastAPI 0.111 + Uvicorn
- SQLAlchemy 2.0 + Alembic (migrations)
- PostgreSQL (psycopg2-binary)
- python-jose (JWT) + passlib/bcrypt (senhas)
- qrcode + Pillow (geração de QR Code)
- pytest + httpx (testes)

## Estrutura

```
backend/
├── app/
│   ├── main.py          # App factory, CORS, routers
│   ├── config.py        # Settings via pydantic-settings
│   ├── database.py      # Engine + session + Base
│   ├── models/          # SQLAlchemy models
│   ├── schemas/         # Pydantic schemas
│   ├── routers/         # Endpoints por recurso
│   └── core/            # auth.py (JWT) + deps.py (injeção)
├── tests/
├── alembic/             # Migrations (criar após conectar ao banco)
├── requirements.txt
├── Dockerfile
└── railway.toml
```

## Configuração

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Edite `.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/menufacil
SECRET_KEY=gere-com-openssl-rand-hex-32
ACCESS_TOKEN_EXPIRE_MINUTES=10080
ALLOWED_ORIGINS=http://localhost:5173
```

## Banco de dados

```bash
# Criar migration inicial (requer banco ativo)
alembic revision --autogenerate -m "initial schema"
alembic upgrade head

# Criar super admin via Python
python -c "
from app.database import SessionLocal
from app.models import User, UserRole
from app.core.auth import hash_password
db = SessionLocal()
u = User(email='admin@menufacil.com', password_hash=hash_password('suasenha'), role=UserRole.super_admin)
db.add(u); db.commit(); print('Criado!')
"
```

## Executar

```bash
uvicorn app.main:app --reload
# API:    http://localhost:8000
# Docs:   http://localhost:8000/docs
# Health: http://localhost:8000/health
```

## Testes

```bash
# Defina o banco de testes
export TEST_DATABASE_URL=postgresql://user:password@localhost:5432/menufacil_test

pytest tests/ -v
```

## Endpoints principais

| Método | Rota | Acesso |
|--------|------|--------|
| POST | `/auth/login` | Público |
| GET | `/auth/me` | Autenticado |
| GET/POST | `/tenants/` | Super Admin |
| POST | `/tenants/{id}/users` | Super Admin |
| GET | `/tenants/{id}/qrcode` | Admin |
| GET/POST/PATCH/DELETE | `/categories/` | Admin do restaurante |
| GET/POST/DELETE | `/tags/` | Admin do restaurante |
| GET/POST/PATCH/DELETE | `/menu-items/` | Admin do restaurante |
| GET | `/public/{slug}` | Público (sem auth) |

## Deploy (Railway)

```bash
npm install -g @railway/cli
railway login
railway init
railway add --database postgresql
# Configure DATABASE_URL, SECRET_KEY, ALLOWED_ORIGINS no dashboard
railway up
```
