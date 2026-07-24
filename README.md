This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Agente de Newsletters (Gmail API)

Este proyecto incluye un agente que busca correos con la palabra "unsubscribe" en el cuerpo y los mueve a la etiqueta `Newsletters` en Gmail.

### 1. Instalar dependencias

```bash
npm install
npm install googleapis
```

### 2. Crear credenciales OAuth en Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com/) y crea (o reutiliza) un proyecto.
2. Habilita la **Gmail API** (APIs & Services > Library).
3. Configura la pantalla de consentimiento OAuth (External o Internal según tu cuenta).
4. En **Credentials**, crea un **OAuth client ID** de tipo *Web application*.
5. Añade `http://localhost:3000/api/auth/callback` como Authorized redirect URI (ajusta el dominio si despliegas en otro lugar).
6. Copia el `Client ID` y `Client Secret`.

### 3. Configurar variables de entorno

Copia `.env.example` a `.env.local` y completa los valores:

```bash
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

### 4. Conectar y ejecutar

1. Arranca el servidor (`npm run dev`) y abre `http://localhost:3000`.
2. Haz clic en **Conectar con Gmail** y autoriza el acceso (scope `gmail.modify`).
3. Haz clic en **Ejecutar ahora** para procesar la bandeja de entrada.

El agente:
- Busca mensajes con `unsubscribe` (excluyendo los que ya tienen la etiqueta `Newsletters`).
- Verifica que la palabra aparezca realmente en el cuerpo del mensaje (no solo en el asunto o remitente).
- Crea la etiqueta `Newsletters` si no existe.
- Quita la etiqueta `INBOX` y añade `Newsletters` (en Gmail no hay carpetas reales, así que "mover" equivale a cambiar etiquetas).

Los tokens OAuth se guardan localmente en `.secrets/gmail-tokens.json` (excluido de git). Este enfoque es apto para uso local o en un servidor propio persistente; en despliegues serverless sin sistema de archivos persistente (p. ej. Vercel) habría que sustituirlo por almacenamiento externo (base de datos, KV, etc.).

> **Nota:** en este entorno de desarrollo no había `npm`/`node` disponibles para instalar `googleapis` ni ejecutar `next build`/`next dev`, por lo que el código no se pudo compilar ni probar en un navegador real. Ejecuta `npm install googleapis` y prueba el flujo completo en tu máquina antes de darlo por definitivo.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
