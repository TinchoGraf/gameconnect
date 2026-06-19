# Graph Report - .  (2026-06-18)

## Corpus Check
- Corpus is ~39,125 words - fits in a single context window. You may not need a graph.

## Summary
- 753 nodes · 1450 edges · 71 communities (42 shown, 29 thin omitted)
- Extraction: 86% EXTRACTED · 14% INFERRED · 0% AMBIGUOUS · INFERRED: 197 edges (avg confidence: 0.62)
- Token cost: 0 input · 21,983 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Domain Models & Reputation Core|Domain Models & Reputation Core]]
- [[_COMMUNITY_Search Lifecycle API|Search Lifecycle API]]
- [[_COMMUNITY_Search Endpoint Tests|Search Endpoint Tests]]
- [[_COMMUNITY_Game Profile API|Game Profile API]]
- [[_COMMUNITY_Game Profile Tests|Game Profile Tests]]
- [[_COMMUNITY_Auth Tests & Fixtures|Auth Tests & Fixtures]]
- [[_COMMUNITY_Review & Reputation Tests|Review & Reputation Tests]]
- [[_COMMUNITY_Frontend Dependencies|Frontend Dependencies]]
- [[_COMMUNITY_Frontend App Shell & Auth|Frontend App Shell & Auth]]
- [[_COMMUNITY_GameSearch Pages & Components|Game/Search Pages & Components]]
- [[_COMMUNITY_Games Catalog & Seeding|Games Catalog & Seeding]]
- [[_COMMUNITY_Auth & Security Core|Auth & Security Core]]
- [[_COMMUNITY_Search Listing & Filters UI|Search Listing & Filters UI]]
- [[_COMMUNITY_App Config & Wiring|App Config & Wiring]]
- [[_COMMUNITY_Search Detail Actions|Search Detail Actions]]
- [[_COMMUNITY_Game Profile CRUD Flow|Game Profile CRUD Flow]]
- [[_COMMUNITY_Shared Pytest Fixtures|Shared Pytest Fixtures]]
- [[_COMMUNITY_User Profile API|User Profile API]]
- [[_COMMUNITY_Phase 3-4 Design Docs|Phase 3-4 Design Docs]]
- [[_COMMUNITY_Shared Hook Refresh Pattern|Shared Hook Refresh Pattern]]
- [[_COMMUNITY_Review Writing UI|Review Writing UI]]
- [[_COMMUNITY_Setup & Deploy Docs|Setup & Deploy Docs]]
- [[_COMMUNITY_Auth Dependency Wiring|Auth Dependency Wiring]]
- [[_COMMUNITY_User Schema Validation|User Schema Validation]]
- [[_COMMUNITY_Phase 5 Anti-Troll Docs|Phase 5 Anti-Troll Docs]]
- [[_COMMUNITY_Initial Schema Migration|Initial Schema Migration]]
- [[_COMMUNITY_Phase 2 Auth Docs|Phase 2 Auth Docs]]
- [[_COMMUNITY_Phase 4.5 Migration Docs|Phase 4.5 Migration Docs]]
- [[_COMMUNITY_Render Deploy Config|Render Deploy Config]]
- [[_COMMUNITY_App Settings Config|App Settings Config]]
- [[_COMMUNITY_Review & Register Validation|Review & Register Validation]]
- [[_COMMUNITY_Search-Profile Server Matching|Search-Profile Server Matching]]
- [[_COMMUNITY_Project README|Project README]]
- [[_COMMUNITY_Search Participant Components|Search Participant Components]]
- [[_COMMUNITY_SPA Routing Config|SPA Routing Config]]
- [[_COMMUNITY_App Entrypoint (main.py)|App Entrypoint (main.py)]]
- [[_COMMUNITY_Password Hashing Utils|Password Hashing Utils]]
- [[_COMMUNITY_Logout Flow|Logout Flow]]
- [[_COMMUNITY_Frontend Entry HTML|Frontend Entry HTML]]
- [[_COMMUNITY_TODO Caching & Pagination|TODO: Caching & Pagination]]
- [[_COMMUNITY_Hero Banner Image|Hero Banner Image]]
- [[_COMMUNITY_Vite Logo Asset|Vite Logo Asset]]
- [[_COMMUNITY_Graphify Claude Config|Graphify Claude Config]]
- [[_COMMUNITY_Claude Local Permissions|Claude Local Permissions]]
- [[_COMMUNITY_Claude Hook Grep|Claude Hook: Grep]]
- [[_COMMUNITY_Claude Hook ReadGlob|Claude Hook: Read/Glob]]
- [[_COMMUNITY_Review Date Formatter|Review Date Formatter]]
- [[_COMMUNITY_Favicon Icon|Favicon Icon]]
- [[_COMMUNITY_Icon Sprite Sheet|Icon Sprite Sheet]]
- [[_COMMUNITY_Dependency email-validator|Dependency: email-validator]]
- [[_COMMUNITY_Dependency httpx|Dependency: httpx]]
- [[_COMMUNITY_Dependency psycopg2|Dependency: psycopg2]]
- [[_COMMUNITY_Dependency pydantic|Dependency: pydantic]]
- [[_COMMUNITY_Dependency pydantic-settings|Dependency: pydantic-settings]]
- [[_COMMUNITY_Dependency python-jose|Dependency: python-jose]]
- [[_COMMUNITY_Dependency python-multipart|Dependency: python-multipart]]
- [[_COMMUNITY_Test 404 Game|Test: 404 Game]]
- [[_COMMUNITY_Test List Games|Test: List Games]]
- [[_COMMUNITY_Test Root Endpoint|Test: Root Endpoint]]
- [[_COMMUNITY_TODO Autocomplete Attrs|TODO: Autocomplete Attrs]]
- [[_COMMUNITY_TODO Future Features|TODO: Future Features]]
- [[_COMMUNITY_TODO Loading Skeletons|TODO: Loading Skeletons]]
- [[_COMMUNITY_TODO Mobile Menu|TODO: Mobile Menu]]

## God Nodes (most connected - your core abstractions)
1. `User` - 55 edges
2. `Game` - 36 edges
3. `Participation` - 32 edges
4. `Search` - 30 edges
5. `api` - 30 edges
6. `_base_search_payload()` - 28 edges
7. `GameProfile` - 26 edges
8. `Session` - 26 edges
9. `Review` - 23 edges
10. `SearchStatus` - 23 edges

## Surprising Connections (you probably didn't know these)
- `TestSearchLifecycle` --conceptually_related_to--> `Search state machine`  [INFERRED]
  tests/test_searches.py → FASE_4_INTEGRACION.md
- `TestLogin` --conceptually_related_to--> `OAuth2PasswordBearer login flow`  [INFERRED]
  tests/test_auth.py → FASE_2_INTEGRACION.md
- `TestCreateGameProfile` --conceptually_related_to--> `Dynamic vs static validation`  [INFERRED]
  tests/test_game_profiles.py → FASE_3_INTEGRACION.md
- `completed_search_with_two_players fixture` --conceptually_related_to--> `Double confirmation anti-troll barrier`  [INFERRED]
  tests/test_reviews.py → FASE_5_INTEGRACION.md
- `TestReputationCalculation` --conceptually_related_to--> `app/core/reputation.py`  [INFERRED]
  tests/test_reviews.py → FASE_5_INTEGRACION.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **JWT authentication flow (security + dependencies + config)** — security_create_access_token, security_decode_access_token, dependencies_get_current_user, dependencies_oauth2_scheme, config_settings_instance [INFERRED 0.85]
- **Reputation/trust recalculation pipeline driven by Review records** — reputation_should_flag_as_outlier, reputation_calculate_weight, reputation_recalculate_user_reputation, reputation_recalculate_reviewer_trust, models_review_review, models_user_user [INFERRED 0.85]
- **Core relational domain models built on SQLAlchemy Base** — models_user_user, models_game_game, models_game_profile_gameprofile, models_search_search, models_participation_participation, models_review_review, database_base [EXTRACTED 1.00]
- **Per-router duplicated game-slug-to-404 + dynamic validation pattern** — routers_game_profiles__get_game_by_slug_or_404, routers_searches__get_game_by_slug_or_404, routers_game_profiles__validate_against_game, routers_searches__validate_against_game [INFERRED 0.85]
- **Review eligibility validation chain (search completed, double confirmation, time window, no duplicate)** — routers_reviews__validate_can_review, routers_searches_confirm_played, routers_searches_complete_search, concept_anti_troll_review_safeguards [INFERRED 0.85]
- **Search join/accept/reject/full lifecycle pattern** — routers_searches_join_search, routers_searches_accept_participation, routers_searches_reject_participation, routers_searches__count_accepted [EXTRACTED 1.00]
- **Search participation/management UI flow** — components_searchcard, components_participationslist, components_participantcard, lib_usesearch, lib_usesearchdetail [INFERRED 0.85]
- **Authentication flow: token storage, context, and protected routing** — lib_authcontext_authprovider, lib_authcontext_useauth, components_protectedroute, components_header, lib_api_api [EXTRACTED 1.00]
- **Custom data-fetching hook pattern shared across lib hooks** — lib_usegames, lib_usemygameprofiles, lib_usemysearches, lib_usependingreviews, lib_usepublicuser, lib_usesearch, lib_usesearchdetail, lib_usesearches [INFERRED 0.85]
- **GameProfile CRUD flow across pages** — pages_creategameprofilepage_creategameprofilepage, pages_editgameprofilepage_editgameprofilepage, pages_gameprofilespage_gameprofilespage [INFERRED 0.85]
- **Post-game review pipeline: confirm played -> pending reviews -> write review** — pages_searchdetailpage_handleconfirmplayed, pages_pendingreviewspage_pendingreviewspage, pages_writereviewpage_writereviewpage [INFERRED 0.85]
- **Search lifecycle state machine (open -> full -> in_progress -> completed/cancelled)** — pages_searchdetailpage_handlestart, pages_searchdetailpage_handlecomplete, pages_searchdetailpage_handlecancel, pages_searchdetailpage_handleconfirmplayed [INFERRED 0.85]
- **Anti-troll review pipeline (double confirmation, time window, weighting, outlier detection)** — fase_5_integracion_double_confirmation, fase_5_integracion_snapshot_weight, fase_5_integracion_outlier_detection, readme_anti_troll_system, fase_5_integracion_reputation_py [INFERRED 0.85]
- **Search-to-review end-to-end flow across phases** — fase_4_integracion_state_machine, fase_4_integracion_searches_router, fase_5_integracion_confirm_played_endpoint, fase_5_integracion_reviews_router, tests_test_reviews_completedsearchwithtwoplayers [INFERRED 0.85]
- **Render deploy pipeline (build, migrate, seed, start)** — render_gameconnect_api, render_build_command, render_start_command, getting_started_alembic_upgrade_head, getting_started_load_games_seed [EXTRACTED 1.00]

## Communities (71 total, 29 thin omitted)

### Community 0 - "Domain Models & Reputation Core"
Cohesion: 0.05
Nodes (88): Configuración del entorno de migraciones de Alembic.  Personalizado para usar: -, Modo offline: genera SQL sin conectarse a la BD.     Útil para revisar el SQL qu, Modo online: se conecta a la BD y aplica las migraciones., run_migrations_offline(), run_migrations_online(), Configuración central de la aplicación.  Lee las variables de entorno desde .env, Session, User (+80 more)

### Community 1 - "Search Lifecycle API"
Cohesion: 0.08
Nodes (63): Session, User, BaseModel, _count_accepted, _get_game_by_slug_or_404 (searches), _get_search_or_404, _require_creator, _to_search_out (+55 more)

### Community 2 - "Search Endpoint Tests"
Cohesion: 0.06
Nodes (20): _base_search_payload(), _base_search_payload (searches), Tests de la Fase 4: sistema de búsquedas.  Cubrimos: - Crear búsqueda (con perfi, Si el usuario no tiene perfil de LoL, no se puede unir., Segundo usuario tiene perfil en NA pero la búsqueda es en LAS., Segundo usuario juega Jungla/Support pero pide rol Mid., Usuario sin búsquedas creadas ni participaciones devuelve listas vacías., Las búsquedas que creé aparecen en 'created'. (+12 more)

### Community 3 - "Game Profile API"
Cohesion: 0.09
Nodes (37): Session, User, Dynamic per-game validation pattern, _get_game_by_slug_or_404 (game_profiles), _get_my_profile_or_404, _validate_against_game (game_profiles), create_my_game_profile(), delete_my_game_profile() (+29 more)

### Community 4 - "Game Profile Tests"
Cohesion: 0.05
Nodes (18): loaded_games fixture, second_user_headers fixture, SECOND_USER_PAYLOAD constant, second_user_with_lol_profile fixture, Tests de la Fase 3: perfiles de juego.  Cubrimos: - Crear perfil exitoso - Valid, Un usuario sí puede tener perfiles en varios juegos distintos., PUT solo cambia los campos enviados, deja el resto intacto., Cambiar solo main_role a algo que NO está en los roles actuales debe fallar. (+10 more)

### Community 5 - "Auth Tests & Fixtures"
Cohesion: 0.06
Nodes (19): app/routers/auth.py, OAuth2PasswordBearer login flow, auth_headers fixture, auth_token fixture, client(), db_session fixture, registered_user fixture, user_with_lol_profile fixture (+11 more)

### Community 6 - "Review & Reputation Tests"
Cohesion: 0.10
Nodes (17): app/core/reputation.py, _base_search_payload(), _base_search_payload (reviews), completed_search_with_two_players(), completed_search_with_two_players fixture, Tests del sistema de reviews (Fase 5).  Cubrimos: - Crear review exitoso (con fl, No se puede confirmar si la búsqueda no está completed., Si la partida está completed pero falta la doble confirmación,         no se pue (+9 more)

### Community 7 - "Frontend Dependencies"
Cohesion: 0.07
Nodes (26): dependencies, axios, react, react-dom, react-router-dom, devDependencies, eslint, @eslint/js (+18 more)

### Community 8 - "Frontend App Shell & Auth"
Cohesion: 0.17
Nodes (15): ProtectedRoute(), AuthContext, AuthProvider(), useAuth(), GamesPage.fetchGames, GamesPage(), HomePage(), LoginPage.handleChange (+7 more)

### Community 9 - "Game/Search Pages & Components"
Cohesion: 0.23
Nodes (6): GameCard(), GameProfileCard(), Header(), useGames(), useMyGameProfiles(), useSearchDetail()

### Community 10 - "Games Catalog & Seeding"
Cohesion: 0.14
Nodes (15): Session, Session, get_game(), list_games(), Endpoints relacionados a juegos.  En la Fase 1 solo necesitamos listar los juego, Devuelve todos los juegos soportados por la plataforma., Devuelve el detalle de un juego por su slug (ej: 'league-of-legends')., GameOut (+7 more)

### Community 11 - "Auth & Security Core"
Cohesion: 0.16
Nodes (15): Session, create_access_token(), hash_password(), Módulo de seguridad.  Centraliza todas las operaciones criptográficas de la app:, Convierte un password en texto plano en su hash bcrypt seguro., Compara un password en texto plano contra su hash.     Devuelve True si coincide, Crea un token JWT firmado.      El "subject" (sub) es el identificador del usuar, verify_password() (+7 more)

### Community 12 - "Search Listing & Filters UI"
Cohesion: 0.19
Nodes (12): SearchCard(), URL query params as filter state pattern, useMySearches(), useSearches(), CreateSearchPage(), CreateSearchPage.handleGameChange, CreateSearchPage.toggleRoleNeeded, MySearchesPage() (+4 more)

### Community 13 - "App Config & Wiring"
Cohesion: 0.15
Nodes (17): cors_origins_list property, secret_key_required_in_production validator, Settings class, settings (Settings instance), engine (create_engine), get_db, SessionLocal (sessionmaker), get_current_user (+9 more)

### Community 14 - "Search Detail Actions"
Cohesion: 0.16
Nodes (14): Double-confirmation post-game review flow (7-day window), usePendingReviews(), PendingReviewsPage.formatDate, PendingReviewsPage(), SearchDetailPage.handleAccept, SearchDetailPage.handleCancel, SearchDetailPage.handleComplete, SearchDetailPage.handleConfirmPlayed (+6 more)

### Community 15 - "Game Profile CRUD Flow"
Cohesion: 0.19
Nodes (14): POST /users/me/game-profiles (backend endpoint), PUT /users/me/game-profiles/{slug} (backend endpoint), CreateGameProfilePage.availableGames (useMemo), CreateGameProfilePage(), CreateGameProfilePage.handleGameChange, CreateGameProfilePage.handleSubmit, CreateGameProfilePage.toggleRole, EditGameProfilePage() (+6 more)

### Community 16 - "Shared Pytest Fixtures"
Cohesion: 0.14
Nodes (9): loaded_games(), Fixtures compartidas de pytest., Carga juegos para los tests., Usuario autenticado con perfil de LoL ya creado en LAS., Segundo usuario autenticado con perfil de LoL en LAS., Registra y loguea un segundo usuario distinto. Devuelve headers de auth., second_user_headers(), second_user_with_lol_profile() (+1 more)

### Community 17 - "User Profile API"
Cohesion: 0.21
Nodes (11): Session, User, Endpoints relacionados a usuarios.  - GET /users/me → datos del usuario logueado, Devuelve el perfil completo del usuario autenticado.      Incluye datos privados, Devuelve el perfil público de un usuario por su username.      No requiere auten, read_my_profile(), read_user_by_username(), Representación pública de un usuario.     Lo que cualquier persona puede ver. (+3 more)

### Community 18 - "Phase 3-4 Design Docs"
Cohesion: 0.18
Nodes (12): Decision to defer Alembic to a later phase, Dynamic vs static validation, Fase 3: Perfiles de juego por usuario, app/schemas/game_profile.py, app/routers/game_profiles.py, Fase 4: Sistema de búsquedas (LFG), app/schemas/participation.py, _require_creator permission helper (+4 more)

### Community 19 - "Shared Hook Refresh Pattern"
Cohesion: 0.17
Nodes (12): api, AuthContext.loadCurrentUser, AuthContext.loadUserFromToken, AuthContext.refresh, useGames.fetchGames, useMyGameProfiles.refresh, useMySearches.refresh, usePendingReviews.refresh (+4 more)

### Community 20 - "Review Writing UI"
Cohesion: 0.24
Nodes (6): ReviewCard(), StarRating(), usePublicUser(), WriteReviewPage.averagePreview, WriteReviewPage.fetchContext, WriteReviewPage()

### Community 21 - "Setup & Deploy Docs"
Cohesion: 0.22
Nodes (11): alembic upgrade head command, python -m app.seed.load_games command, Primer arranque del proyecto (getting started guide), uvicorn app.main:app --reload command, Python virtual environment (venv) setup, FastAPI backend stack, Render buildCommand (pip install, alembic upgrade head, seed load_games), alembic==1.13.3 (+3 more)

### Community 22 - "Auth Dependency Wiring"
Cohesion: 0.22
Nodes (9): Session, User, get_db(), Dependencia de FastAPI: provee una sesión de BD al endpoint     y se asegura de, get_current_user(), Dependencias compartidas de FastAPI.  Las "dependencias" son funciones que FastA, Extrae al usuario actual desde el token JWT.      Pasos:     1. FastAPI ya extra, decode_access_token() (+1 more)

### Community 23 - "User Schema Validation"
Cohesion: 0.24
Nodes (8): Schemas Pydantic para el recurso User.  Separamos en varios schemas según el cas, Valida que el password cumpla las reglas de complejidad.     Se llama desde los, Datos enviados por el cliente al registrarse., Datos enviados por el cliente al hacer login., UserCreate, UserLogin, validate_password, _validate_password_complexity()

### Community 24 - "Phase 5 Anti-Troll Docs"
Cohesion: 0.28
Nodes (9): /searches/{id}/confirm-played endpoint, Double confirmation anti-troll barrier, Fase 5: Confirmación de partidas y reviews anti-troll, Outlier detection for reviews, app/schemas/review.py, app/routers/reviews.py, Snapshot semantics for review weight, Anti-troll system (5 barriers) (+1 more)

### Community 25 - "Initial Schema Migration"
Cohesion: 0.54
Nodes (8): downgrade (initial schema migration), game_profiles table, games table, participations table, reviews table, searches table, upgrade (initial schema migration), users table

### Community 26 - "Phase 2 Auth Docs"
Cohesion: 0.25
Nodes (8): bcrypt==4.0.1 pin, app/core/dependencies.py (get_current_user), Fase 2: Autenticación, app/core/security.py, app/routers/users.py, bcrypt==4.0.1, passlib[bcrypt]==1.7.4, TODO: clear username validation error message

### Community 27 - "Phase 4.5 Migration Docs"
Cohesion: 0.29
Nodes (7): alembic/env.py, alembic.ini, Fase 4.5: Alembic migrations infrastructure, alembic/versions/initial_schema migration, app/seed/load_games.py (modified, create_all removed), Alembic stamping technique, SQLite-first then PostgreSQL decision

### Community 28 - "Render Deploy Config"
Cohesion: 0.33
Nodes (7): Render + Vercel split infrastructure decision, CORS_ORIGINS placeholder env var, gameconnect-api (Render web service), gameconnect-db (Render managed PostgreSQL), Render startCommand (gunicorn + UvicornWorker), gunicorn==23.0.0, uvicorn[standard]==0.32.0

### Community 29 - "App Settings Config"
Cohesion: 0.33
Nodes (4): Si el entorno es producción, no permitimos que la SECRET_KEY         sea el valo, Convierte CORS_ORIGINS de string CSV a lista., Settings, BaseSettings

### Community 30 - "Review & Register Validation"
Cohesion: 0.40
Nodes (5): POST /reviews (backend endpoint), RegisterPage.handleSubmit, RegisterPage.validatePasswordOrFail, WriteReviewPage.handleSubmit, WriteReviewPage.validate

### Community 31 - "Search-Profile Server Matching"
Cohesion: 0.40
Nodes (5): POST /searches (backend endpoint), Search server must match creator's GameProfile server, CreateSearchPage.handleSubmit, CreateSearchPage.myProfileForGame (useMemo), SearchDetailPage.myProfileForGame (useMemo)

### Community 32 - "Project README"
Cohesion: 0.40
Nodes (5): React + Vite template, GameConnect project, React 19 + Vite frontend stack, Project roadmap (backend/frontend/deploy phases), URL-based search filters decision

### Community 37 - "Password Hashing Utils"
Cohesion: 0.67
Nodes (3): hash_password, pwd_context (CryptContext bcrypt), verify_password

## Ambiguous Edges - Review These
- `list_my_pending_reviews()` → `PendingReviewOut`  [AMBIGUOUS]
  app/routers/reviews.py · relation: shares_data_with
- `run_migrations_offline` → `settings (imported in env.py)`  [AMBIGUOUS]
  alembic/env.py · relation: shares_data_with
- `EditGameProfilePage.fetchProfile` → `PUT /users/me/game-profiles/{slug} (backend endpoint)`  [AMBIGUOUS]
  frontend/src/pages/EditGameProfilePage.jsx · relation: references
- `Fase 5: Confirmación de partidas y reviews anti-troll` → `TODO: wire up custom 404 page route`  [AMBIGUOUS]
  TODO.md · relation: conceptually_related_to

## Knowledge Gaps
- **122 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+117 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **29 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `list_my_pending_reviews()` and `PendingReviewOut`?**
  _Edge tagged AMBIGUOUS (relation: shares_data_with) - confidence is low._
- **What is the exact relationship between `run_migrations_offline` and `settings (imported in env.py)`?**
  _Edge tagged AMBIGUOUS (relation: shares_data_with) - confidence is low._
- **What is the exact relationship between `EditGameProfilePage.fetchProfile` and `PUT /users/me/game-profiles/{slug} (backend endpoint)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `Fase 5: Confirmación de partidas y reviews anti-troll` and `TODO: wire up custom 404 page route`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `client()` connect `Auth Tests & Fixtures` to `Shared Pytest Fixtures`?**
  _High betweenness centrality (0.255) - this node is a cross-community bridge._
- **Why does `registered_user fixture` connect `Auth Tests & Fixtures` to `Game Profile Tests`?**
  _High betweenness centrality (0.240) - this node is a cross-community bridge._
- **Why does `user_with_lol_profile fixture` connect `Auth Tests & Fixtures` to `Search Endpoint Tests`, `Game Profile Tests`, `Review & Reputation Tests`?**
  _High betweenness centrality (0.123) - this node is a cross-community bridge._