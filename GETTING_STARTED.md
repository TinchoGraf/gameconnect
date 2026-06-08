# Primer arranque del proyecto

Esta guía es para la **primera vez** que corrés GameConnect en tu máquina.
Si ya lo configuraste antes, ignorala y usá el README.

## 1. Verificar que tenés Python

Abrí una terminal y ejecutá:

```bash
python --version
```

Tiene que decir `Python 3.11.x` o superior. Si no lo tenés o tenés una
versión más vieja, instalalo desde https://www.python.org/downloads/

> ⚠️ **En Windows**: durante la instalación, marcá la casilla
> "Add Python to PATH". Si no lo hiciste, reinstalá.

## 2. Verificar que tenés git

```bash
git --version
```

Si no aparece nada, instalalo desde https://git-scm.com/downloads

## 3. Abrir la carpeta del proyecto

Descomprimí el zip que te pasé (o cloná el repo cuando lo subas a GitHub),
y abrí una terminal **dentro** de la carpeta `gameconnect`.

Para verificar que estás en el lugar correcto:

```bash
# En Linux/Mac:
ls
# En Windows (PowerShell):
dir
```

Tenés que ver carpetas como `app`, `tests`, y archivos como `README.md`,
`requirements.txt`.

## 4. Crear el entorno virtual

Un "entorno virtual" es una caja aislada donde se instalan las dependencias
del proyecto. Esto evita que se mezclen con otras versiones de paquetes
que tengas en tu sistema.

```bash
python -m venv venv
```

Esto crea una carpeta `venv/`. **No la subas a GitHub** (ya está en `.gitignore`).

## 5. Activar el entorno virtual

Esto es algo que hay que hacer **cada vez que abrís una terminal nueva**
para trabajar en el proyecto.

**Linux/Mac:**
```bash
source venv/bin/activate
```

**Windows (PowerShell):**
```powershell
venv\Scripts\Activate.ps1
```

**Windows (CMD):**
```cmd
venv\Scripts\activate.bat
```

Cuando esté activado, vas a ver `(venv)` al principio de tu línea de comandos.

> ⚠️ **Si en Windows te da error de permisos** al activar, ejecutá una sola vez:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```
> Después intentá activar de nuevo.

## 6. Instalar las dependencias

Con el entorno virtual activado:

```bash
pip install -r requirements.txt
```

Esto puede tardar un par de minutos la primera vez. Va a descargar e instalar
FastAPI, SQLAlchemy y todas las librerías que usamos.

## 7. Configurar variables de entorno

```bash
# Linux/Mac:
cp .env.example .env

# Windows:
copy .env.example .env
```

Abrí el archivo `.env` con tu editor y reemplazá `SECRET_KEY` por una clave
real. Para generarla, ejecutá:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copiá lo que imprime y pegalo como valor de `SECRET_KEY` en `.env`.

## 8. Inicializar la base de datos

Esto crea las tablas usando las migraciones de Alembic.

```powershell
alembic upgrade head
```

Vas a ver mensajes tipo `INFO [alembic.runtime.migration] Running upgrade -> 86277245427b, initial schema`.

## 9. Cargar los juegos iniciales

```powershell
python -m app.seed.load_games
```

Si todo va bien, vas a ver:

```
Cargando juegos iniciales en la base de datos...

  ✓ Creado: League of Legends
  ✓ Creado: Counter Strike 2
  ✓ Creado: Dead by Daylight
  ✓ Creado: Rocket League

✅ Seed completado.
```

Esto creó un archivo `gameconnect.db` (la base de datos SQLite). Tampoco
hay que subirlo a GitHub.

## 9. Levantar el servidor

```bash
uvicorn app.main:app --reload
```

El flag `--reload` hace que el servidor se reinicie automáticamente cada
vez que modificás un archivo. Solo para desarrollo.

Si todo está bien, vas a ver:

```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

## 10. Probar que funciona

Abrí en el navegador:

- **http://localhost:8000/** → debería mostrar `{"service": "GameConnect API", "status": "ok", ...}`
- **http://localhost:8000/docs** → documentación interactiva (¡esto es Swagger, viene gratis con FastAPI!)
- **http://localhost:8000/games** → lista los 4 juegos que cargamos

En la página `/docs` podés probar cada endpoint directamente desde el navegador.

## 11. Correr los tests

En otra terminal (con el venv activado):

```bash
pytest
```

Tenés que ver algo como `2 passed`.

## 12. Configurar git y subir a GitHub

```bash
# 1. Inicializá el repo
git init

# 2. Agregá todos los archivos (el .gitignore filtra lo que no queremos)
git add .

# 3. Hacé el primer commit
git commit -m "feat: fase 1 - setup inicial con modelos y seed de juegos"

# 4. Creá el repo en GitHub desde https://github.com/new
#    (no marques "Initialize with README" porque ya lo tenemos)

# 5. Conectá tu repo local con el de GitHub
git remote add origin https://github.com/TU-USUARIO/gameconnect.git
git branch -M main
git push -u origin main
```

¡Listo! Ya tenés la base del proyecto subida.

## Problemas comunes

### "command not found: python"
En Mac probá con `python3` en vez de `python`.

### "ModuleNotFoundError: No module named 'app'"
Te olvidaste de activar el venv. Ejecutá el paso 5 de nuevo.

### "Address already in use" al levantar uvicorn
Hay otro servidor corriendo en el puerto 8000. Cerralo o usá otro puerto:
```bash
uvicorn app.main:app --reload --port 8001
```

### En Windows: `'.env' is not recognized`
Usá `copy` en vez de `cp`:
```cmd
copy .env.example .env
```
