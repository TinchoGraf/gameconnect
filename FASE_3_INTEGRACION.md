# Integración de la Fase 3

Esta guía explica cómo aplicar la Fase 3 sobre tu proyecto de Fase 2.

## Cambios en esta fase

**Archivos NUEVOS** (no existían):

```
app/schemas/game_profile.py        ← schemas de GameProfile
app/routers/game_profiles.py       ← endpoints de perfiles de juego
tests/test_game_profiles.py        ← 22 tests nuevos
FASE_3_INTEGRACION.md              ← esta guía
```

**Archivos MODIFICADOS** (existían y cambiaron):

```
app/main.py                        ← incluye el nuevo router (versión 0.3.0)
app/models/game_profile.py         ← agregamos campo main_role
tests/conftest.py                  ← nueva fixture loaded_games
README.md                          ← marca Fase 3 como completa
```

## Cómo aplicarlo

### Paso 1: Cerrar el servidor

Si tenés `uvicorn` corriendo, parálo con `Ctrl+C`.

### Paso 2: Descomprimir y reemplazar

1. Cerrá VS Code completamente
2. Descomprimí el zip en una carpeta temporal cualquiera
3. Entrá a la carpeta `gameconnect/` del zip extraído
4. Seleccioná todo (Ctrl+A) y copiá (Ctrl+C)
5. Andá a `C:\dev\gameconnect`, pegá (Ctrl+V), y reemplazá todo lo que pregunte
6. Reabrí VS Code en `C:\dev\gameconnect`

### Paso 3: Regenerar la base de datos

**Esto es importante.** El modelo `GameProfile` ahora tiene un campo nuevo
(`main_role`). Como no tenemos migraciones (Alembic) configuradas todavía,
la forma más simple es borrar y regenerar la BD desde cero.

En la terminal de VS Code (con `(venv)` activo):

```powershell
# Borrar la BD vieja (vas a perder los usuarios de prueba que hayas creado)
Remove-Item .\gameconnect.db -Force -ErrorAction SilentlyContinue

# Volver a cargar los juegos iniciales
python -m app.seed.load_games
```

Deberías ver los 4 juegos creados de nuevo:

```
  ✓ Creado: League of Legends
  ✓ Creado: Counter Strike 2
  ✓ Creado: Dead by Daylight
  ✓ Creado: Rocket League

✅ Seed completado.
```

> 💡 **Por qué no me complico con migraciones todavía**: Alembic es la
> herramienta correcta para evolucionar el schema en producción sin perder
> datos. Pero acá no tenemos datos reales todavía, son todos de prueba.
> Borrar y regenerar es más rápido y didáctico. Lo configuraremos en una
> fase futura, cuando ya tengamos algo que valga la pena conservar.

### Paso 4: Levantar el servidor

```powershell
uvicorn app.main:app --reload
```

Abrí http://localhost:8000/docs. Tenés una nueva sección **game-profiles**
con 6 endpoints.

### Paso 5: Probar el flujo completo en Swagger

1. **Registrar** un usuario nuevo en `POST /auth/register`
2. **Autorizar** en el botón 🔓 Authorize con tu usuario/password
3. **Crear un perfil de LoL** en `POST /users/me/game-profiles`:
   ```json
   {
     "game_slug": "league-of-legends",
     "roles": ["Mid", "Top"],
     "main_role": "Mid",
     "server": "LAS",
     "rank": "Diamante II",
     "in_game_name": "Tincho#LAS1"
   }
   ```

4. **Probar la validación dinámica** mandando un rol inválido:
   ```json
   {
     "game_slug": "league-of-legends",
     "roles": ["Tank"],
     "main_role": "Tank",
     "server": "LAS"
   }
   ```
   Vas a recibir un 422 con el mensaje:
   `"Roles inválidos para League of Legends: ['Tank']. Roles permitidos: ['Top', 'Jungla', 'Mid', 'ADC', 'Support']"`

   👉 **Eso es validación dinámica funcionando.** La regla no está hardcodeada,
   se lee de la BD. Si mañana agregás un rol nuevo a LoL en el seed, todo
   se ajusta solo.

5. **Listar tus perfiles** en `GET /users/me/game-profiles`
6. **Ver tu perfil específico** en `GET /users/me/game-profiles/league-of-legends`
7. **Actualizar** parcialmente con `PUT /users/me/game-profiles/league-of-legends`:
   ```json
   { "rank": "Maestro" }
   ```
   Notá que solo cambia el rank, los demás campos quedan iguales.

8. **Ver el perfil público** de otro usuario (sin estar autenticado siquiera):
   `GET /users/{tu_username}/game-profiles`

### Paso 6: Correr los tests

```powershell
pytest -v
```

Esperamos **47 tests pasando** (25 de fases anteriores + 22 nuevos).

> 💡 Si querés ver solo los tests nuevos:
> ```powershell
> pytest tests/test_game_profiles.py -v
> ```

### Paso 7: Commit y push

```powershell
git add .
git commit -m "feat: fase 3 - perfiles de juego por usuario con validacion dinamica"
git push
```

## Qué aprendiste en esta fase

Conceptos que ya podés explicar:

1. **Validación dinámica vs estática**: las reglas dependen de datos en la BD,
   no son expresiones regulares hardcodeadas. Cambias el seed y la validación
   se ajusta sin tocar código.

2. **PATCH vs PUT (semántica de actualización)**: nuestro endpoint PUT acepta
   updates parciales gracias a `model_dump(exclude_unset=True)`. El usuario
   solo manda los campos que quiere cambiar.

3. **Tabla intermedia con datos propios**: `GameProfile` no es solo un join,
   guarda atributos propios (roles, rank, server). Es un patrón muy común
   cuando una relación M:N tiene metadata propia.

4. **Validación cross-field**: el validator `main_role_must_be_in_roles`
   compara dos campos del mismo schema. Pydantic los pasa al `@model_validator`
   solo después de validar individualmente cada uno.

5. **Endpoints públicos vs autenticados en el mismo router**: los endpoints
   `/users/me/*` requieren token; `/users/{username}/*` son públicos.
   Esto es típico de redes sociales: ver perfiles es público, modificarlos
   solo lo puede hacer el dueño.

6. **Status 204 No Content**: para deletes exitosos, devolvemos 204 (sin body).
   Es el estándar HTTP para operaciones que funcionaron pero no tienen nada
   que devolver.

## Próxima fase

**Fase 4: Sistema de búsquedas.** Vamos a permitir que los usuarios creen
"búsquedas" de partidas (LFG - Looking For Group) y otros usuarios se unan.
Incluye filtros por juego, modo (chill/tryhard), servidor y roles necesarios.
