# Integración de la Fase 4.5: Alembic

Esta es una fase de **infraestructura**: no agrega features visibles al usuario,
pero cambia cómo evoluciona la base de datos a partir de ahora.

## Qué cambia

**Archivos nuevos**:
```
alembic.ini                              ← config principal de Alembic
alembic/env.py                           ← script que carga modelos y conecta a BD
alembic/script.py.mako                   ← plantilla para nuevas migraciones
alembic/README                           ← doc autogenerada (irrelevante)
alembic/versions/2026_..._initial_schema.py  ← la primera migración (el "punto cero")
FASE_4_5_INTEGRACION.md                  ← esta guía
```

**Archivos modificados**:
```
app/seed/load_games.py     ← le sacamos el create_all (ahora lo hace Alembic)
GETTING_STARTED.md         ← agregamos el paso "alembic upgrade head"
README.md                  ← marca Fase 4.5 como completa
```

## Cómo aplicarlo

### Paso 1: Cerrar el servidor

Como siempre: `Ctrl+C` en la terminal del servidor.

### Paso 2: Descomprimir y reemplazar

1. Cerrá VS Code completamente
2. Descomprimí el zip en una carpeta temporal
3. Entrá a la carpeta `gameconnect/` del zip extraído
4. Seleccioná todo (Ctrl+A) → Copiá (Ctrl+C)
5. Andá a `C:\dev\gameconnect`, pegá (Ctrl+V), reemplazá todo lo que pregunte
6. Reabrí VS Code

### Paso 3: Marcar tu BD existente como "ya migrada"

Acá hay algo importante: tu BD actual ya tiene **todas las tablas** porque
las creamos en fases anteriores con `Base.metadata.create_all()`. Esa BD está
estructuralmente igual a lo que la migración inicial generaría.

Si corriéramos `alembic upgrade head` ahora, Alembic intentaría **crear las
tablas de nuevo** y fallaría porque ya existen.

La solución estándar para este caso se llama **"stamping"**: le decimos a
Alembic "considerá que esta BD ya está en la última migración, no toques nada".

En la terminal de VS Code (con `(venv)` activo):

```powershell
alembic stamp head
```

Vas a ver algo así:

```
INFO  [alembic.runtime.migration] Context impl SQLiteImpl.
INFO  [alembic.runtime.migration] Will assume non-transactional DDL.
INFO  [alembic.runtime.migration] Running stamp_revision -> 86277245427b
```

Esto agregó una tabla nueva a tu BD llamada `alembic_version` que dice
"estamos en la migración 86277245427b". A partir de ahora Alembic sabe
qué hay y qué falta.

> 💡 **Si preferís empezar limpio**: borrá la BD y aplicá normal:
> ```powershell
> Remove-Item .\gameconnect.db -Force
> alembic upgrade head
> python -m app.seed.load_games
> ```
> Vas a perder los usuarios de prueba pero la BD queda igual de funcional.

### Paso 4: Verificar que todo sigue andando

```powershell
# Tests
pytest -v

# Servidor
uvicorn app.main:app --reload
```

Tenés que ver **72 tests pasando** y el servidor levantando normal.

### Paso 5: Commit

```powershell
git add .
git commit -m "feat: fase 4.5 - configurar alembic para migraciones"
git push
```

## El nuevo flujo de trabajo: cómo agregar un campo de aquí en adelante

A partir de ahora, **cada vez que cambies un modelo**, tenés que generar
una migración. Te paso el flujo paso a paso con un ejemplo ficticio:

**Escenario**: querés agregar un campo `discord_tag` al modelo User.

### 1. Cambiar el modelo

En `app/models/user.py`, agregás:

```python
discord_tag: Mapped[str | None] = mapped_column(String(50), nullable=True)
```

### 2. Generar la migración automática

```powershell
alembic revision --autogenerate -m "agregar discord_tag a users"
```

Alembic compara tus modelos con la BD y detecta el cambio:

```
INFO  [alembic.autogenerate.compare] Detected added column 'users.discord_tag'
Generating ...alembic/versions/2026_xx_xx-abc123_agregar_discord_tag_a_users.py ... done
```

### 3. Revisar el archivo generado (siempre)

Abrí el archivo nuevo en `alembic/versions/`. Tiene una función `upgrade()`
y una `downgrade()`. Asegurate de que la lógica sea correcta. Alembic acierta
el 95% de las veces, pero **siempre hay que mirar** — sobre todo si renombrás
columnas (que Alembic suele detectar como "borrar + crear" en lugar de "renombrar").

### 4. Aplicar la migración

```powershell
alembic upgrade head
```

Eso ejecuta el `upgrade()` y agrega la columna a tu BD. Sin perder datos.

### 5. Commitear modelo + migración juntos

```powershell
git add app/models/user.py alembic/versions/*.py
git commit -m "feat: agregar discord_tag al perfil de usuario"
```

**Importante**: el archivo de migración va al repo. Es lo que permite que
cualquiera que clone el proyecto reconstruya la BD ejecutando
`alembic upgrade head`.

## Comandos útiles de Alembic

```powershell
# Ver en qué migración estás parado
alembic current

# Ver el historial completo de migraciones
alembic history

# Volver una migración atrás (¡aplica el downgrade!)
alembic downgrade -1

# Volver a una migración específica
alembic downgrade 86277245427b

# Ver el SQL que se ejecutaría sin aplicarlo (útil para revisar)
alembic upgrade head --sql
```

## Qué aprendiste en esta fase

1. **Migraciones vs create_all**: por qué en producción nunca se "crean
   las tablas si no existen" sino que se aplican migraciones controladas.

2. **Stamping**: cómo "adoptar" una BD existente sin recrearla.

3. **Autogenerate**: Alembic compara modelos vs BD y detecta diferencias
   automáticamente. Es magia, pero hay que revisar lo que genera.

4. **Reversibilidad**: cada migración tiene upgrade y downgrade. Si algo
   sale mal en producción, podés volver atrás.

5. **El versionado de schema**: la BD también es código. Va al repo, tiene
   historial, y todos los entornos (dev, staging, prod) corren las mismas
   migraciones en el mismo orden.

## Próxima fase

**Fase 5: Confirmación de partidas y sistema de reviews.** Ahora sí, con
Alembic en su lugar, podés agregar y modificar campos de manera segura.
La fase de reviews va a tocar varias tablas (Review, Participation,
posibles ajustes a User) y todo va a estar trackeado con migraciones.
