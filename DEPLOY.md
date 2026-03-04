# Деплой BilimHub

Проект на Node.js + EJS + PostgreSQL. Ниже два варианта: **Docker** (VPS/сервер) и **PaaS** (Railway, Render).

---

## 1. Деплой через Docker (VPS, свой сервер)

На сервере должны быть установлены **Docker** и **Docker Compose**.

### Шаги

1. **Клонировать репозиторий и перейти в папку:**
   ```bash
   git clone <url-репозитория> bilimhub && cd bilimhub
   ```

2. **Создать файл `.env`** (скопировать из примера и заполнить):
   ```bash
   cp .env.example .env
   ```
   В `.env` обязательно задать:
   - `DB_USER`, `DB_PASSWORD`, `DB_NAME` — для PostgreSQL (в docker-compose эти же значения использует контейнер БД).
   - **Не задавать** `DB_HOST` в `.env` — в docker-compose он переопределяется на `db`.
   - `SESSION_SECRET`, `JWT_SECRET` — длинные случайные строки для продакшена.
   - При необходимости: `OYLAN_API_KEY`, `OYLAN_ASSISTANT_ID`.

3. **Запуск:**
   ```bash
   docker compose up -d --build
   ```
   - Поднимается PostgreSQL и приложение.
   - Миграции выполняются при старте контейнера приложения.
   - Приложение доступно на порту из переменной `PORT` (по умолчанию 5000).

4. **Создать админа и начальные данные (опционально):**
   ```bash
   docker compose exec app npm run db:seed
   ```
   Либо выполнить миграцию с созданием админа (если есть такая миграция).

5. **Остановка:**
   ```bash
   docker compose down
   ```

### Полезные команды

- Логи: `docker compose logs -f app`
- Перезапуск после изменений: `docker compose up -d --build`
- Подключиться к БД: `docker compose exec db psql -U postgres -d bilimhub`

---

## 2. Деплой на PaaS (Railway / Render)

Подходит, если не хотите управлять сервером. Нужны: **приложение Node.js** и **PostgreSQL**.

### Общие настройки

- **Start command:** `npm start` (в проекте уже настроен на `node server.js`).
- **Root directory:** корень репозитория.
- Добавить **переменные окружения** из `.env.example` (без коммита реального `.env`).

### Railway

1. Создать проект → **Deploy from GitHub** (репозиторий BilimHub).
2. Добавить сервис **PostgreSQL** (Railway создаст БД и переменные типа `DATABASE_URL`).
3. У приложения задать переменные:
   - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_DIALECT=postgres`, `DB_PORT=5432` (значения взять из панели PostgreSQL или из `DATABASE_URL`).
   - `PORT` — обычно задаётся автоматически (например 5000).
   - `NODE_ENV=production`, `SESSION_SECRET`, `JWT_SECRET` — обязательно свои значения.
4. Деплой запустится по `git push`. После первого деплоя выполнить миграции (в Railway: вкладка сервиса → **Settings** → одна команда при деплое или вручную через **Shell**):
   ```bash
   npx sequelize-cli db:migrate
   npm run db:seed
   ```
   (если в Railway нет отдельного шага для миграций — добавить в **Build Command** или выполнять миграции вручную из Shell.)

### Render

1. **New** → **Web Service**, подключить репозиторий.
2. **Build command:** `npm install`
3. **Start command:** `npm start`
4. Добавить **PostgreSQL** через **New** → **PostgreSQL** и скопировать **Internal Database URL**.
5. В настройках Web Service задать переменные окружения:
   - Разобрать `DATABASE_URL` на компоненты или использовать один `DATABASE_URL` — тогда в коде нужно будет читать его через `url` в конфиге Sequelize (сейчас проект ожидает отдельные `DB_HOST`, `DB_USER` и т.д.). Проще задать вручную: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_DIALECT=postgres`, `DB_PORT=5432`.
   - `SESSION_SECRET`, `JWT_SECRET`, `NODE_ENV=production`.
6. После первого деплоя выполнить миграции через **Shell** в панели Render:
   ```bash
   npx sequelize-cli db:migrate
   npm run db:seed
   ```

---

## Чек-лист перед продакшеном

- [ ] В `.env` заданы уникальные `SESSION_SECRET` и `JWT_SECRET`.
- [ ] `NODE_ENV=production`.
- [ ] В БД есть пользователь с ролью `admin` (миграция или seed).
- [ ] При использовании HTTPS настроен доверенный reverse proxy (Nginx/Caddy) и при необходимости `trust proxy` в Express.

После деплоя админка: **https://ваш-домен/admin** (вход под учёткой с ролью admin).
