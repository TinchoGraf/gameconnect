# GameConnect

> Plataforma social para conectar jugadores de videojuegos según afinidades, regiones, servidores y estilo de juego.

GameConnect resuelve un problema real de la comunidad gamer: encontrar gente con la que jugar que tenga tus mismos objetivos (jugar para divertirse vs. jugar para subir de elo), comparta tu servidor y se ajuste a los roles que necesitás para tu equipo.

## Estado del proyecto

🚧 **En desarrollo activo** - Fase 4.5: Alembic configurado, listo para Fase 5

Este proyecto se construye públicamente, documentando cada decisión técnica. Seguí el progreso en Instagram: [@tu_usuario](#) *(próximamente)*

## Qué problema resuelve

Las herramientas que existen hoy (LFG de Discord, foros, etc.) no consideran:

- **Intención de juego**: ¿querés jugar relajado o tryhardear?
- **Compatibilidad de rol**: ¿necesito un support y un jungla, no cinco mids?
- **Servidor/región**: ping y horarios compatibles
- **Reputación verificada**: ¿este jugador es tóxico? ¿es puntual? ¿comunica bien?

## Stack técnico

| Capa | Tecnología | Por qué |
|---|---|---|
| Backend | FastAPI (Python 3.11+) | Async nativo, validación automática con Pydantic, docs OpenAPI gratis |
| ORM | SQLAlchemy 2.0 | Estándar de la industria, soporta múltiples bases de datos |
| Base de datos | SQLite (dev) / PostgreSQL (prod) | Sin configuración para empezar, escalable después |
| Migraciones | Alembic | Control de versiones del esquema de BD |
| Auth | JWT (python-jose) | Stateless, escalable, estándar en APIs modernas |
| Hashing | bcrypt (passlib) | Industria estándar para passwords |
| Testing | pytest | Soporte de async, fixtures potentes |

## Decisiones de diseño

### ¿Por qué un `GameProfile` separado por usuario y juego?

Un mismo jugador puede ser **mid en LAS** en League of Legends y **AWPer en SA** en Counter Strike. Modelarlo como tabla intermedia entre `User` y `Game` permite que cada perfil tenga roles, servidor y rango independientes, evitando duplicación y manteniendo la integridad referencial.

### ¿Por qué reviews bloqueadas hasta confirmación de partida?

La primera barrera anti-troll: solo podés calificar a alguien si **ambos confirmaron** que jugaron juntos. Esto elimina reviews fantasma de cuentas creadas solo para difamar.

### ¿Por qué SQLite primero y PostgreSQL después?

SQLite es un archivo. Cero configuración, cero servicios corriendo. Para desarrollo es perfecto. Cuando despleguemos a producción cambiamos el `DATABASE_URL` en `.env` y SQLAlchemy hace el resto sin tocar el código de la aplicación.

## Roadmap

- [x] **Fase 1**: Setup del proyecto, modelos base, seed de juegos
- [x] **Fase 2**: Autenticación (registro, login, JWT)
- [x] **Fase 3**: Perfiles de juego por usuario
- [x] **Fase 4**: Sistema de búsquedas (crear, listar, unirse)
- [x] **Fase 4.5**: Migraciones de base de datos con Alembic
- [ ] **Fase 5**: Confirmación de partidas y reviews
- [ ] **Fase 5**: Confirmación de partidas y reviews
- [ ] **Fase 6**: Sistema de reputación con anti-troll ponderado
- [ ] **Fase 7**: Frontend web responsive
- [ ] **Fase 8**: Deploy a producción

## Juegos soportados (Fase 1)

| Juego | Roles | Servidores |
|---|---|---|
| League of Legends | Top, Jungla, Mid, ADC, Support | LAS, LAN, NA, EUW, EUNE, KR, BR |
| Counter Strike 2 | Entry Fragger, AWPer, IGL, Support, Lurker | SA, NA, EU, Asia |
| Dead by Daylight | Killer, Survivor | Americas, Europe, Asia |
| Rocket League | Striker, Midfielder, Goalkeeper, Flex | SAM, USE, USW, EU, ASIA |

## Cómo correr el proyecto

### Requisitos

- Python 3.11 o superior
- Git

### Instalación

```bash
# 1. Cloná el repo
git clone https://github.com/tu-usuario/gameconnect.git
cd gameconnect

# 2. Creá un entorno virtual
python -m venv venv

# 3. Activalo
# En Linux/Mac:
source venv/bin/activate
# En Windows:
venv\Scripts\activate

# 4. Instalá las dependencias
pip install -r requirements.txt

# 5. Copiá las variables de entorno
cp .env.example .env

# 6. Inicializá la base de datos
alembic upgrade head

# 7. Cargá los juegos iniciales
python -m app.seed.load_games

# 8. Arrancá el servidor
uvicorn app.main:app --reload
```

Abrí http://localhost:8000/docs para ver la documentación interactiva de la API.

## Estructura del proyecto

```
gameconnect/
├── app/
│   ├── main.py              # Entry point de FastAPI
│   ├── config.py            # Variables de entorno
│   ├── database.py          # Conexión y sesión de BD
│   ├── models/              # Tablas (SQLAlchemy)
│   ├── schemas/             # Validación I/O (Pydantic)
│   ├── routers/             # Endpoints por recurso
│   ├── core/                # Seguridad, JWT, dependencias
│   └── seed/                # Datos iniciales
├── tests/                   # Tests unitarios e integración
├── alembic/                 # Migraciones de BD
├── requirements.txt
└── README.md
```

## Licencia

MIT - Libre uso, atribución apreciada.

## Autor

Construido como proyecto de portfolio. Documentado en Instagram a medida que se desarrolla.
