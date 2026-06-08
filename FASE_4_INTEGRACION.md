# Integración de la Fase 4

Esta guía explica cómo aplicar la Fase 4 sobre tu proyecto de Fase 3.

## Cambios en esta fase

**Archivos NUEVOS**:

```
app/schemas/search.py              ← schemas de Search
app/schemas/participation.py       ← schemas de Participation
app/routers/searches.py            ← endpoints de búsquedas
tests/test_searches.py             ← 25 tests nuevos
FASE_4_INTEGRACION.md              ← esta guía
```

**Archivos MODIFICADOS**:

```
app/main.py                        ← incluye el nuevo router (versión 0.4.0)
app/models/search.py               ← agregamos campo join_mode
tests/conftest.py                  ← nuevos fixtures multi-usuario
README.md                          ← marca Fase 4 como completa
```

## Cómo aplicarlo

### Paso 1: Cerrar el servidor

Si tenés `uvicorn` corriendo, parálo con `Ctrl+C`.

### Paso 2: Descomprimir y reemplazar

1. Cerrá VS Code completamente
2. Descomprimí el zip en una carpeta temporal cualquiera
3. Entrá a la carpeta `gameconnect/` del zip extraído
4. Seleccioná todo (Ctrl+A) y copiá (Ctrl+C)
5. Andá a `C:\dev\gameconnect`, pegá (Ctrl+V), reemplazá todo lo que pregunte
6. Reabrí VS Code en `C:\dev\gameconnect`

### Paso 3: Regenerar la base de datos

Igual que en Fase 3: agregamos un campo nuevo (`join_mode`) al modelo Search,
así que hay que regenerar el schema. Con `(venv)` activo:

```powershell
Remove-Item .\gameconnect.db -Force -ErrorAction SilentlyContinue
python -m app.seed.load_games
```

### Paso 4: Levantar el servidor

```powershell
uvicorn app.main:app --reload
```

Abrí http://localhost:8000/docs. Tenés una nueva sección **searches**
con 11 endpoints.

## Cómo probar el flujo completo

Esta fase requiere **dos usuarios** para ver todo en acción. Te paso un guión.

### Setup: dos usuarios con perfiles

1. Registrá usuario A: `tincho` / `tincho@test.com` / `MiPass123`
2. Registrá usuario B: `juan` / `juan@test.com` / `MiPass123`
3. Logueate como **tincho** (Authorize en Swagger)
4. Creá perfil de LoL para tincho:
   ```json
   POST /users/me/game-profiles
   {
     "game_slug": "league-of-legends",
     "roles": ["Mid", "Top"],
     "main_role": "Mid",
     "server": "LAS"
   }
   ```
5. Deslogueate (botón Logout en Authorize) y logueate como **juan**
6. Creá perfil para juan:
   ```json
   POST /users/me/game-profiles
   {
     "game_slug": "league-of-legends",
     "roles": ["Jungla", "Support"],
     "main_role": "Jungla",
     "server": "LAS"
   }
   ```

### Flujo de búsqueda - modo manual

1. Logueate como **tincho** otra vez
2. Crear búsqueda:
   ```json
   POST /searches
   {
     "game_slug": "league-of-legends",
     "title": "Buscamos jungla y supp",
     "mode": "ranked-solo",
     "server": "LAS",
     "roles_needed": ["Jungla", "Support"],
     "max_players": 5,
     "join_mode": "manual"
   }
   ```
   Anotá el `id` que te devuelve.

3. Ver que aparece en la lista:
   ```
   GET /searches
   ```

4. Logueate como **juan** y unite:
   ```json
   POST /searches/{id}/join
   { "role": "Jungla" }
   ```
   La respuesta va a tener `"status": "pending"`. Como es modo manual,
   queda esperando aprobación.

5. Logueate de nuevo como **tincho** y aceptá a juan:
   ```
   POST /searches/{id}/participations/{user_id_de_juan}/accept
   ```

6. Ver el cambio:
   ```
   GET /searches/{id}/participations
   ```
   Vas a ver dos participaciones, ambas en `accepted`.

7. Como tincho (creador), iniciar y completar:
   ```
   POST /searches/{id}/start
   POST /searches/{id}/complete
   ```

### Probar validaciones (deben fallar)

- Crear búsqueda en server `NA` con perfil en `LAS` → 422 ✘
- Crear búsqueda de un juego donde no tenés perfil → 422 ✘
- Unirse con `role: "Mid"` si tu perfil no incluye Mid → 422 ✘
- Editar la búsqueda como un usuario que no es el creador → 403 ✘

## Correr los tests

```powershell
pytest -v
```

Esperamos **72 tests pasando** (47 anteriores + 25 nuevos).

## Commit y push

```powershell
git add .
git commit -m "feat: fase 4 - sistema de busquedas con join modes y validaciones cruzadas"
git push
```

## Qué aprendiste en esta fase

1. **Máquina de estados** — Search tiene un ciclo de vida: open → full →
   in_progress → completed. Las transiciones permitidas están explícitamente
   codificadas (no podés completar sin pasar por in_progress).

2. **Validación cruzada entre recursos** — Para unirse a una búsqueda,
   validamos contra el GameProfile del usuario (otro recurso). Eso es lo
   que hace que la app sea "coherente": las reglas no son solo locales,
   sino que cruzan entidades.

3. **Roles y permisos** — algunos endpoints requieren ser el creador. El
   helper `_require_creator` devuelve 403 Forbidden. Es la diferencia entre
   401 (no autenticado) y 403 (autenticado pero sin permiso).

4. **Patrón de "soft delete" con estado** — al cancelar una búsqueda no la
   borramos, solo le cambiamos el estado a "cancelled". Mantiene el historial.

5. **Auto-acceptación condicional** — el `join_mode` cambia la lógica
   completa del endpoint join. Una sola variable que controla todo el flow.

6. **Snapshot del estado al crear** — el creador entra automáticamente
   como participante aceptado al crear la búsqueda. Si no lo hiciéramos,
   habría que tratar al creador como caso especial en mil lugares.

## Próxima fase

**Fase 5: Confirmación de partidas y reviews.** Cuando la búsqueda está
en estado `completed`, los participantes podrán confirmar que jugaron y
calificarse mutuamente con las 4 categorías que diseñamos en Fase 1
(comunicación, actitud, skill, confiabilidad).
