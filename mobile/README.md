# Mobile — Menu Fácil

App mobile de gerenciamento construído com **Expo + React Native + TypeScript**.

## Stack

- Expo SDK (React Native)
- Expo Router (navegação por arquivos)
- expo-secure-store (armazenamento seguro do token JWT)
- React Query v5 / TanStack Query
- Axios

## Estrutura

```
mobile/
├── app/
│   ├── _layout.tsx              # Root layout + QueryClientProvider
│   ├── index.tsx                # Redirect: login ou admin
│   ├── (auth)/
│   │   └── login.tsx            # Tela de login
│   └── (admin)/
│       ├── _layout.tsx          # Tab navigator
│       ├── menu-items/
│       │   ├── index.tsx        # Lista de pratos
│       │   └── [id].tsx         # Criar / editar prato
│       ├── categories/
│       │   └── index.tsx        # Lista de categorias
│       └── qrcode.tsx           # Gerador de QR Code
├── constants/
│   └── api.ts                   # API_URL via variável de ambiente
├── hooks/
│   └── useAuth.ts               # Auth com SecureStore
└── utils/
    └── auth.ts                  # authHeaders() helper
```

## Configuração

```bash
npm install
cp .env.example .env
```

`.env`:

```env
EXPO_PUBLIC_API_URL=http://localhost:8000
```

> Em dispositivo físico, substitua `localhost` pelo IP da sua máquina na rede local (ex: `192.168.1.10:8000`).

## Executar

```bash
npx expo start
```

Escaneie o QR code com o app **Expo Go** (Android ou iOS).

## Funcionalidades

- Login com JWT (token armazenado com segurança no SecureStore)
- Listagem, criação e edição de pratos
- Gerenciamento de categorias
- Geração e visualização do QR Code do cardápio

## Build (EAS)

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview   # APK para testes
eas build --platform android --profile production
eas build --platform ios --profile production
```

Configure `EXPO_PUBLIC_API_URL` nas variáveis de ambiente do EAS antes do build de produção.
