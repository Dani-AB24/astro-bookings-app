# Programación Inteligente
Documentación para el curso de programación inteligente

Domina las nuevas primitivas de programación con IA para desarrollos más productivos y de calidad; 
Pasa del Vibe Coding a la Spec-Driven Development.

---

## Sample project : Astro-Bookings
API mínima en TypeScript y Express .

- **Ejemplo de proyecto**: [Astro-Bookings-Demo](https://github.com/Programacion-Inteligente/activity-bookings-express)

---

## Exercise project : Astro-Bookings-Client
Aplicación cliente para interactuar con la API de Astro-Bookings.
En cualquier lenguaje/framework de elección (e.g., React, Vue, Angular, o una CLI en Python/Node.js). 
Incluso una aplicación de consola o web en Java o C#.

- [Exercise project : Astro-Bookings-Client](./astrobookings-cli.briefing.md)

Por supuesto, puedes desarrollarlo con cualquier herramienta de IA que te guste.
- VSCode + GitHub Copilot
- Cursor
- ClaudeCode
- Antigravity
- etc.

---

## Código en este repositorio

- [`api/`](./api/README.md): API de reservas en TypeScript y Express, basada en el proyecto de ejemplo.
- [`web/`](./web/README.md): cliente web en React, TypeScript y Vite que consume la API.

---

## Instalación

### Requisitos

- [Node.js](https://nodejs.org/) 20.19 o superior (o 22.12+), con npm.
- Git.

`api/` y `web/` son proyectos npm independientes: no hay `package.json` en la raíz, así que cada uno instala sus propias dependencias.

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/Dani-AB24/astro-bookings-app.git
cd astro-bookings-app

# 2. Instalar la API
cd api && npm install && cd ..

# 3. Instalar el cliente web
cd web && npm install

# 4. (Opcional) Descargar el navegador para los tests e2e del cliente, una vez por máquina
npx playwright install chromium
cd ..
```

Los tests e2e del cliente arrancan el servidor de pruebas de la API, así que instala `api/` aunque solo trabajes en el cliente.

### Arrancar la aplicación

En dos terminales:

```bash
# Terminal 1: la API en http://localhost:3000
cd api
npm run dev

# Terminal 2: el cliente en http://localhost:5173
cd web
npm run dev
```

Abre http://localhost:5173 e inicia sesión con la cuenta de demostración, o crea una nueva en **Register**:

- Email: `admin@astrobookings.example`
- Contraseña: `admin-demo-password`

Para usar otro puerto, arranca la API con `PORT` y el cliente con `VITE_API_URL` apuntando a ella, por ejemplo `PORT=4000 npm run dev` y `VITE_API_URL=http://localhost:4000 npm run dev`.

### Comprobar la instalación

```bash
cd api && npm test    # tests de la API (no necesitan navegador)
cd ../web && npm test # tests e2e del cliente con Playwright
```

La API guarda los datos en `api/db/*.json`, que git ignora, y parte de `api/db/seed/`. Para volver a los datos iniciales, borra esos ficheros `*.json` (no la carpeta `seed/`). Más detalles en [`api/README.md`](./api/README.md) y [`web/README.md`](./web/README.md).

---

- **Author**: [Alberto Basalo](https://albertobasalo.dev)
- **Ai Code Academy en Español**: [AI code Academy](https://aicode.academy)
- **Socials**:
  - [X](https://x.com/albertobasalo)
  - [LinkedIn](https://www.linkedin.com/in/albertobasalo/)
  - [GitHub](https://github.com/albertobasalo)


