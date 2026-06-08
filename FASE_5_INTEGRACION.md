# Integración de la Fase 5

Esta es la fase que **cierra el MVP**. Después de esto, GameConnect es una
app funcionalmente completa: usuarios pueden registrarse, armar perfiles,
crear/unirse a búsquedas, jugar y calificarse mutuamente con un sistema
anti-troll que pondera por confianza.

## Cambios en esta fase

**Archivos NUEVOS**:

```
app/core/reputation.py             ← lógica de cálculo de reputación y trust
app/schemas/review.py              ← schemas de Review
app/routers/reviews.py             ← endpoints de reviews
tests/test_reviews.py              ← 12 tests nuevos
FASE_5_INTEGRACION.md              ← esta guía
```

**Archivos MODIFICADOS**:

```
app/main.py                        ← registra el router de reviews (v0.5.0)
app/routers/searches.py            ← agrega endpoint /confirm-played
README.md                          ← marca Fase 5 como completa
```

> 🎯 **Nota importante**: en esta fase NO hay migraciones de Alembic porque
> los modelos no cambiaron (el modelo Review ya tenía todos los campos
> necesarios desde Fase 1). Solo agregamos lógica de aplicación.

## Cómo aplicarlo

### Paso 1: Cerrar el servidor

`Ctrl+C` en la terminal del servidor.

### Paso 2: Descomprimir y reemplazar

1. Cerrá VS Code completamente
2. Descomprimí el zip en una carpeta temporal
3. Entrá a la carpeta `gameconnect/` del zip
4. Seleccioná todo (Ctrl+A) → Copiá (Ctrl+C)
5. Andá a `C:\dev\gameconnect`, pegá (Ctrl+V), reemplazá todo lo que pregunte
6. Reabrí VS Code

### Paso 3: Verificar que no se necesita migración

Con `(venv)` activo:

```powershell
alembic check
```

Debería decir `No new upgrade operations detected`. Si dice otra cosa, avisame.

### Paso 4: Probar el flujo completo

Esta fase tiene el flujo más largo de todo el proyecto. Vamos a recorrerlo
paso a paso con dos usuarios. Asumiendo que tu BD tiene los usuarios
`tincho` y `juan` con perfiles de LoL en LAS (de la integración de Fase 4):

```powershell
uvicorn app.main:app --reload
```

Andá a http://localhost:8000/docs.

#### 1. Crear y completar una búsqueda

Como **tincho** (Authorize), crear una búsqueda:

```json
POST /searches
{
  "game_slug": "league-of-legends",
  "title": "Test review",
  "mode": "ranked-solo",
  "server": "LAS",
  "roles_needed": ["Jungla"],
  "max_players": 5,
  "join_mode": "manual"
}
```

Anotá el `id` que devuelve.

#### 2. Juan se une

Como **juan**, unirse:

```json
POST /searches/{id}/join
{ "role": "Jungla" }
```

#### 3. Tincho acepta a Juan

Necesitás el user_id de Juan. Lo sacás de:

```
GET /searches/{id}/participations
```

Después:

```
POST /searches/{id}/participations/{juan_id}/accept
```

#### 4. Tincho arranca y completa

```
POST /searches/{id}/start
POST /searches/{id}/complete
```

#### 5. Ambos confirman que jugaron 🆕

Esto es lo nuevo de Fase 5:

Como **tincho**:
```
POST /searches/{id}/confirm-played
```

Como **juan**:
```
POST /searches/{id}/confirm-played
```

#### 6. Ver reviews pendientes 🆕

Como **tincho**:
```
GET /users/me/pending-reviews
```

Vas a ver que Juan está pendiente de review.

#### 7. Tincho califica a Juan 🆕

```json
POST /reviews
{
  "reviewed_user_id": {juan_id},
  "search_id": {search_id},
  "communication": 5,
  "attitude": 4,
  "skill": 5,
  "reliability": 5,
  "comment": "Muy buena jungla, comunicó todos los timers y siempre estuvo atento al map awareness.",
  "would_play_again": true
}
```

#### 8. Verificar que la reputación se actualizó 🆕

```
GET /users/juan
```

Mirá los campos `reputation_score` y `reviews_received_count`. Deberían ser
4.75 y 1.

#### 9. Probar las validaciones (deben fallar todas)

- Calificarte a vos mismo → 422 ✘
- Calificar antes de la doble confirmación → 422 ✘
- Comentario de menos de 30 caracteres → 422 ✘
- Notas fuera de 1-5 → 422 ✘
- Calificar dos veces a la misma persona en la misma búsqueda → 409 ✘

### Paso 5: Correr los tests

```powershell
pytest -v
```

Esperamos **84 tests pasando** (72 anteriores + 12 nuevos).

> 💡 Si querés solo los nuevos:
> ```powershell
> pytest tests/test_reviews.py -v
> ```

### Paso 6: Commit y push

```powershell
git add .
git commit -m "feat: fase 5 - sistema de reviews con anti-troll, doble confirmacion y peso por trust score"
git push
```

## Qué aprendiste en esta fase

1. **Doble confirmación como barrera anti-troll** — ningún sistema unilateral
   evita reviews fantasma. Que las dos partes confirmen es lo mínimo.

2. **Snapshot semantics** — el `weight` de la review se calcula al crearla.
   Si después el autor pierde confianza, las reviews ya hechas mantienen
   su peso original. Preserva el historial.

3. **Ventanas de tiempo en operaciones humanas** — 7 días post-completed
   es una decisión de producto basada en cuándo se acuerda alguien de una
   partida sin que sea venganza.

4. **Cálculo de outliers** — para detectar reviews sospechosas necesitamos
   un baseline (mínimo de reviews previas), no podemos flagear desde la
   primera review.

5. **Promedio ponderado vs simple** — la reputación es un promedio ponderado
   por `weight`, no un promedio simple. Una review de un troll y otra de
   alguien confiable no valen lo mismo.

6. **Separación de cálculos en módulos** — toda la lógica numérica está en
   `app/core/reputation.py`. El router solo orquesta. Esto facilita testear
   las funciones de cálculo de forma aislada.

## Estado del proyecto

🎉 **MVP completo.** Tenés un backend funcional al 100%:

- 7 entidades modeladas (User, Game, GameProfile, Search, Participation, Review, +alembic_version)
- 30+ endpoints REST documentados automáticamente
- 84 tests cubriendo todos los flujos críticos
- Validaciones cruzadas entre 4 recursos
- Sistema anti-troll con doble confirmación, ventana de tiempo, comentarios obligatorios, peso por confianza y detección de outliers
- Migraciones de BD listas para evolucionar el schema sin perder datos

## Próximas fases (a tu elección)

Llegaste al MVP funcional. Lo que sigue es **decisión tuya**, según hacia
dónde quieras llevar el portfolio:

- **Fase 6: Frontend web** — armar una UI mínima con HTMX o React que use
  tu API. Hace al portfolio más vistoso para no-técnicos.

- **Fase 7: Deploy a producción** — subir tu API a Railway, Render o Fly.io
  para que cualquiera pueda probarla en un link público. Cierra el círculo
  para reclutadores.

- **Mejoras del backend** — paginación, búsqueda full-text, websockets para
  notificaciones en tiempo real, OAuth con Discord/Google, etc.

Cuando definas, seguimos.
