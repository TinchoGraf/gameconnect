# Integración de la Fase 2

Esta guía explica cómo aplicar la Fase 2 sobre tu proyecto existente.

## Cambios en esta fase

**Archivos NUEVOS** (no existían en Fase 1):

```
app/core/security.py            ← hashing bcrypt + JWT
app/core/dependencies.py        ← dependencia get_current_user
app/schemas/user.py             ← schemas de Usuario
app/schemas/token.py            ← schema del Token
app/routers/auth.py             ← /auth/register y /auth/login
app/routers/users.py            ← /users/me y /users/{username}
tests/conftest.py               ← fixtures de pytest
tests/test_auth.py              ← 22 tests nuevos
FASE_2_INTEGRACION.md           ← esta guía
```

**Archivos MODIFICADOS** (existían y cambiaron):

```
app/main.py                     ← incluye los nuevos routers
tests/test_main.py              ← adaptado a los fixtures
requirements.txt                ← agrega bcrypt==4.0.1
README.md                       ← marca Fase 2 como completa
```

## Cómo aplicarlo

### Opción A: descomprimir y sobreescribir (recomendado)

1. Cerrá VS Code completamente (para evitar conflictos de archivos abiertos)
2. Descomprimí el zip en una carpeta temporal cualquiera
3. Copiá todo el contenido de la carpeta `gameconnect/` que sale del zip
   **encima** de `C:\dev\gameconnect`, **reemplazando** los archivos que pregunte
4. Reabrí VS Code en `C:\dev\gameconnect`

> ⚠️ Tu `venv\`, `.env` y `gameconnect.db` NO están en el zip y se conservan
> en su lugar. Eso es lo que querés.

### Cómo verificar que se aplicó bien

En la terminal de VS Code:

```powershell
# Estos archivos NUEVOS deben existir ahora:
Test-Path .\app\core\security.py
Test-Path .\app\routers\auth.py
Test-Path .\tests\conftest.py
# Todos deben devolver True
```

```powershell
# main.py debe tener version 0.2.0:
Select-String -Path .\app\main.py -Pattern 'version='
# Debe mostrar: version="0.2.0"
```

```powershell
# requirements.txt debe tener bcrypt fijado:
Select-String -Path .\requirements.txt -Pattern 'bcrypt'
# Debe mostrar 2 líneas (passlib[bcrypt] y bcrypt==4.0.1)
```

## Después de aplicar

### 1. Activar el venv

```powershell
.\venv\Scripts\Activate.ps1
```

### 2. Instalar la nueva dependencia

```powershell
pip install -r requirements.txt
```

Esto va a instalar `bcrypt==4.0.1`. Las demás dependencias ya las tenías.

> 🐛 **Por qué fijamos bcrypt en 4.0.1**: las versiones 4.1+ tienen un
> bug de compatibilidad con `passlib==1.7.4`. Pinear la versión es la
> solución estándar hasta que passlib saque una versión nueva.

### 3. Levantar el servidor

```powershell
uvicorn app.main:app --reload
```

Andá a http://localhost:8000/docs y vas a ver tres secciones:
- **auth** → `/auth/register` y `/auth/login`
- **users** → `/users/me` y `/users/{username}`
- **games** → (ya las tenías)

### 4. Probar el flujo completo en Swagger

1. **Registrate**: expandí `POST /auth/register` → "Try it out" → enviá:
   ```json
   {
     "username": "leona",
     "email": "leona@test.com",
     "password": "MiPass123"
   }
   ```
   Deberías recibir un 201 con tus datos.

2. **Logueate**: expandí `POST /auth/login` → "Try it out".
   Acá hay una particularidad: Swagger muestra campos `username` y `password`
   (no JSON). Llenalos con lo que registraste. Vas a recibir:
   ```json
   {
     "access_token": "eyJhbGciOi...",
     "token_type": "bearer"
   }
   ```

3. **Autorizate en Swagger**: arriba a la derecha hay un botón
   **"Authorize" 🔓**. Hacé clic, pegá tu `access_token` (sin "Bearer "),
   y autorizá.

4. **Probá `/users/me`**: ahora autorizado, `GET /users/me` → "Try it out"
   → "Execute". Deberías ver tu propio perfil.

5. **Perfil público**: `GET /users/{username}` con tu username. Vas a ver
   el perfil sin el campo `email` (no se expone públicamente).

> 📸 **Screenshot perfecto para Instagram**: el botón Authorize de Swagger
> con el candado abierto, después de pegar el token. Muestra visualmente
> el flujo de autenticación de una API real.

### 5. Correr los tests

```powershell
pytest -v
```

Deberías ver **25 tests pasando**:
- `TestRegister` — 14 tests (registro + validaciones)
- `TestLogin` — 3 tests
- `TestProtectedEndpoint` — 4 tests
- `TestPublicProfile` — 2 tests
- `test_main` — 3 tests

### 6. Subir a GitHub

```powershell
git add .
git commit -m "feat: fase 2 - autenticacion con JWT, registro, login y perfil de usuario"
git push
```

## Qué aprendiste en esta fase

Cosas que ahora podés explicar en una entrevista técnica:

1. **bcrypt vs SHA-256 para passwords**: por qué se usa bcrypt (lento por
   diseño, salt automático) y no algoritmos rápidos como SHA-256.

2. **JWT stateless**: por qué no guardamos sesiones en BD. El token firmado
   ES la prueba de identidad — si la firma es válida, el usuario es quien
   dice ser, sin necesidad de consultar una tabla de sesiones.

3. **Mensaje genérico al fallar login**: por qué nunca decimos "usuario no
   existe" ni "password incorrecto" por separado. Permitiría enumerar
   usuarios válidos del sistema.

4. **Separación de schemas público/privado**: `UserOut` no expone el email,
   `UserPrivateOut` sí. Solo el dueño del perfil ve sus datos privados.

5. **Fixtures de pytest con BD en memoria**: aislamiento entre tests para
   que sean rápidos y reproducibles. Cada test arranca con BD limpia.

6. **OAuth2PasswordBearer**: por qué `/auth/login` usa form-data en vez
   de JSON. Es el estándar OAuth2 y hace que el botón "Authorize" de
   Swagger funcione sin configurar nada.

## Próxima fase

**Fase 3: Perfiles de juego por usuario.** Cada usuario va a poder asociar
su cuenta con uno o varios juegos, indicando roles, servidor y rango.
