# TODO — Mejoras pendientes

Lista de mejoras identificadas durante el desarrollo que están conscientemente
postergadas. Cada una tiene una estimación honesta y una nota sobre por qué
no es bloqueante.

## UX / UI

### Mensaje de error claro cuando el username tiene caracteres inválidos
**Estimación**: 5 minutos
**Severidad**: alta (afecta a todo usuario que intente registrarse con espacio)

Hoy: si el username tiene un espacio, el backend devuelve
`String should match pattern '^[a-zA-Z0-9_-]+$'` — un mensaje técnico que un
usuario no entiende. El frontend lo muestra tal cual.

Solución: en el schema `UserCreate` agregar un `field_validator` con un
mensaje claro tipo "El username solo puede contener letras, números, guiones
y guiones bajos. No se permiten espacios."

### Header con menú hamburguesa en mobile
**Estimación**: 20 minutos
**Severidad**: media (la app es usable, pero se ve apretada)

Hoy: el Header tiene 5-6 links en fila horizontal. En pantallas chicas no
entran y al hacer scroll horizontal aparecen "espacios en blanco" (que en
realidad son links fuera del viewport).

Solución: usar Tailwind con clases `hidden md:flex` para ocultar la barra
horizontal en mobile, mostrar un icono de menú hamburguesa, y desplegar un
menú vertical al hacer click.

### Atributos `autoComplete` en inputs de password
**Estimación**: 5 minutos
**Severidad**: baja (no rompe nada, solo es una sugerencia del navegador)

Hoy: el navegador advierte en consola que falta `autoComplete="current-password"`
en los inputs de login y `autoComplete="new-password"` en los de registro.
Esto mejora la integración con password managers como Bitwarden.

## Funcionalidad

### Página 404 personalizada
**Estimación**: 5 minutos
**Severidad**: muy baja

Ya creamos `NotFoundPage.jsx` pero nunca la enchufamos a la ruta `*`. Hay
que agregar al final del `<Routes>` en `App.jsx`:
`<Route path="*" element={<NotFoundPage />} />`

### Loading states con skeletons
**Estimación**: 1-2 horas
**Severidad**: baja

Hoy los estados de loading son texto simple ("Cargando..."). Más profesional
sería mostrar skeletons grises con la forma de los componentes que van a
aparecer.

## Performance / Backend

### Cachear la lista de juegos
**Estimación**: 30 minutos
**Severidad**: baja

`GET /games` se llama muchas veces (cada vez que carga un dropdown de
formulario) y nunca cambia. Se puede cachear en memoria del backend o
agregar headers HTTP `Cache-Control: max-age=3600`.

### Paginación en listados grandes
**Estimación**: 2-3 horas
**Severidad**: baja para MVP, alta para producción real

`/searches` y `/users/me/pending-reviews` devuelven todos los resultados sin
paginar. Con muchos usuarios esto se vuelve lento. Implementar `limit` y
`offset` (o cursor-based pagination).

## Producto / Features nuevas

- Notificaciones en tiempo real con WebSockets cuando algo le pasa a tu búsqueda
- OAuth con Discord (un click en lugar de email + password)
- Sistema de amigos / bloquear usuarios
- Estadísticas en el perfil (partidas jugadas, % de "volvería a jugar", etc.)
- Modo dark/light toggleable
- App mobile con React Native
- Soporte para más juegos (Valorant, Overwatch, Apex Legends)