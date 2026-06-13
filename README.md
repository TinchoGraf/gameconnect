# GameConnect

> Plataforma para conectar gamers según juegos, roles, servidores y reputación. Sistema anti-troll con doble confirmación de partidas y peso por confianza.

🎮 **Demo público**: https://gameconnect-lilac.vercel.app
📚 **API pública (Swagger)**: https://gameconnect-api.onrender.com/docs

> ⏱️ La primera carga del backend puede tardar 30-60 segundos. Render apaga el server tras 15 minutos sin tráfico (plan free) y lo vuelve a despertar cuando llega una request.

## Sobre el proyecto

Este es un proyecto de portfolio construido **públicamente**, documentando cada decisión técnica en Instagram: [@tinchograf.dev](https://instagram.com/tinchograf.dev).

GameConnect resuelve un problema real de la comunidad gamer: encontrar gente con la que jugar que tenga tus mismos objetivos (jugar para divertirse vs. jugar para subir de elo), comparta tu servidor y se ajuste a los roles que necesitás para tu equipo.

## Qué problema resuelve

Las herramientas que existen hoy (LFG de Discord, foros, etc.) no consideran:

- **Intención de juego**: ¿querés jugar relajado o tryhardear?
- **Compatibilidad de rol**: ¿necesito un support y un jungla, no cinco mids?
- **Servidor/región**: ping y horarios compatibles
- **Reputación verificada**: ¿este jugador es tóxico? ¿es puntual? ¿comunica bien?

## Stack técnico

### Backend

| Capa | Tecnología | Por qué |
|---|---|---|
| API | FastAPI (Python 3.12) | Async nativo, validación con Pydantic, docs OpenAPI automáticas |
| ORM | SQLAlchemy 2.0 | Estándar de la industria, soporta múltiples BDs |
| Base de datos | SQLite (dev) / PostgreSQL (prod) | Sin config para empezar, escalable después |
| Migraciones | Alembic | Schema versionado y reproducible |
| Auth | JWT (python-jose) | Stateless, escalable |
| Hashing | bcrypt (passlib) | Estándar para passwords |
| Server prod | gunicorn + uvicorn workers | Performance en producción |
| Testing | pytest | 90 tests cubriendo todos los flujos |

### Frontend

| Capa | Tecnología |
|---|---|
| Framework | React 19 + Vite |
| Routing | React Router v7 |
| Estilos | Tailwind CSS v4 |
| HTTP | axios con interceptor de JWT |
| State global | Context API (AuthContext) |

### Infraestructura

| Servicio | Plataforma |
|---|---|
| Backend + BD | Render (free tier) |
| Frontend | Vercel (free tier) |
| Repo | GitHub |

## Decisiones de diseño

### ¿Por qué un `GameProfile` separado por usuario y juego?

Un mismo jugador puede ser **mid en LAS** en League of Legends y **AWPer en SA** en Counter Strike. Modelarlo como tabla intermedia entre `User` y `Game` permite que cada perfil tenga roles, servidor y rango independientes, evitando duplicación y manteniendo integridad referencial.

### Sistema anti-troll: cinco barreras

1. **Doble confirmación**: solo podés calificar si ambos confirmaron que jugaron juntos.
2. **Ventana de tiempo**: las reviews se cierran a los 7 días post-partida (evita reviews-venganza tardías).
3. **Comentario obligatorio**: mínimo 30 caracteres, forza a explicar en vez de poner "ggez".
4. **Peso por trust score**: cada review tiene un `weight` basado en el `reviewer_trust_score` del autor. Reviewers con historial sospechoso pesan menos.
5. **Detección de outliers**: si una review se desvía mucho del consenso (con 5+ reviews previas), se marca como flageada y su peso se reduce.

### ¿Por qué SQLite primero y PostgreSQL después?

SQLite es un archivo. Cero configuración, cero servicios corriendo. Para desarrollo es perfecto. En producción cambiamos el `DATABASE_URL` y SQLAlchemy hace el resto sin tocar código de aplicación. Las migraciones de Alembic funcionan igual en ambos.

### ¿Por qué filtros de búsqueda en URL?

Las URLs de `/searches?game_slug=league-of-legends&server=LAS` son **shareable y reload-safe**. Refrescás la página y los filtros siguen. Compartís el link y el otro ve los mismos filtros aplicados. Mantener filtros solo en estado de React rompería ambas cosas.

### ¿Por qué Render + Vercel separados?

Render hostea el backend Python + la BD PostgreSQL gestionada. Vercel hostea el frontend estático con CDN global. La separación es estándar en proyectos modernos: cada plataforma optimizada para lo suyo, ambas con plan free generoso, deploy automático en cada push.

## Roadmap

### Backend — completo

- [x] **Fase 1**: Setup, modelos base, seed de juegos
- [x] **Fase 2**: Autenticación (registro, login, JWT)
- [x] **Fase 3**: Perfiles de juego por usuario
- [x] **Fase 4**: Sistema de búsquedas (crear, listar, unirse, gestionar)
- [x] **Fase 4.5**: Migraciones con Alembic
- [x] **Fase 5**: Confirmación de partidas y sistema de reviews anti-troll

### Frontend — completo

- [x] **F.1**: Setup React + Vite + Tailwind, listado de juegos
- [x] **F.2**: Auth completa con context global y rutas protegidas
- [x] **F.3**: CRUD de perfiles de juego con formularios dinámicos
- [x] **F.4**: Búsquedas con filtros sincronizados a URL y panel del creador
- [x] **F.5**: Reviews UI con star rating, perfiles públicos y desglose de reputación

### Deploy — completo

- [x] Backend en Render con PostgreSQL gestionado
- [x] Frontend en Vercel con CDN global
- [x] HTTPS automático, redeploy en cada push a `main`

### Próximos pasos (opcional)

- [ ] Notificaciones en tiempo real con WebSockets
- [ ] OAuth con Discord (login con cuenta de gaming)
- [ ] Paginación en listados grandes
- [ ] Modo dark/light togglable
- [ ] App mobile con React Native

## Juegos soportados

| Juego | Roles | Servidores |
|---|---|---|
| League of Legends | Top, Jungla, Mid, ADC, Support | LAS, LAN, NA, BR, EUW, EUNE, KR, JP, OCE, TR, RU |
| Counter Strike 2 | Entry Fragger, AWPer, IGL, Support, Lurker, Rifler | SA, NA-East, NA-West, EU-West, EU-East, Asia, Oceania |
| Dead by Daylight | Killer, Survivor | Americas, Europe, Asia |
| Rocket League | Striker, Midfielder, Goalkeeper, Flex | SAM, USE, USW, EU, ASIA, OCE, ME |

## Estructura del proyecto

gameconnect/

├── app/                       # Backend FastAPI

│   ├── main.py                # Entry point

│   ├── config.py              # Variables de entorno

│   ├── database.py            # Conexión SQLAlchemy

│   ├── models/                # Tablas (User, Game, Search, Review, etc.)

│   ├── schemas/               # Validación I/O (Pydantic)

│   ├── routers/               # Endpoints por recurso

│   ├── core/                  # Seguridad, JWT, lógica de reputación

│   └── seed/                  # Datos iniciales

├── tests/                     # 90 tests pasando

├── alembic/                   # Migraciones de BD

├── frontend/                  # Frontend React + Vite

│   ├── src/

│   │   ├── lib/               # Cliente axios, hooks, AuthContext

│   │   ├── components/        # Componentes reusables

│   │   └── pages/             # Páginas de la app

│   └── package.json

├── requirements.txt           # Dependencias Python

├── render.yaml                # Config de deploy en Render

└── README.md

## Cómo correr el proyecto localmente

### Requisitos

- Python 3.12
- Node.js 18+ y npm
- Git

### Backend

```bash
# Cloná el repo
git clone https://github.com/TinchoGraf/gameconnect.git
cd gameconnect

# Entorno virtual
python -m venv venv
source venv/bin/activate          # Linux/Mac
venv\Scripts\activate             # Windows

# Dependencias
pip install -r requirements.txt

# Variables de entorno
# Crea un archivo .env en la raíz con:
# DATABASE_URL=sqlite:///./gameconnect.db
# SECRET_KEY=tu-clave-secreta-cualquiera-larga
# ENVIRONMENT=development

# Inicializar BD
alembic upgrade head
python -m app.seed.load_games

# Levantar
uvicorn app.main:app --reload
```

Backend en http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install

# Variables de entorno
# Crea un archivo .env.local en frontend/ con:
# VITE_API_URL=http://localhost:8000

npm run dev
```

Frontend en http://localhost:5173

## Algunos números del proyecto

- 30+ endpoints REST
- 90 tests pasando
- 15+ páginas en el frontend
- 5 fases de backend + 5 fases de frontend
- Tiempo: aproximadamente un mes de desarrollo en sesiones cortas

## Autor

**Tincho** — [@tinchograf.dev en Instagram](https://instagram.com/tinchograf.dev) — Documenté todo el proceso de construcción, desde el primer modelo de la BD hasta el deploy final, con énfasis en las decisiones técnicas y los bugs encontrados en el camino.

## Licencia

MIT — Libre uso, atribución apreciada.