## Учёт себестоимости объектов (ремонт под ключ)

Веб-приложение для учёта проектов ремонта: предоплаты/оплаты, расходы по статьям,
остаток по проекту в реальном времени, синхронизация расходов в Google Таблицу,
инфографика по расходам.

### Стек

Next.js 14+ (App Router, TypeScript) · Supabase (Postgres + Auth) · Google Sheets API
· Tailwind CSS · Recharts · react-hook-form + zod

### Настройка

1. **Supabase**
   - Создайте проект на [supabase.com](https://supabase.com).
   - Откройте SQL Editor и выполните файл [`supabase/schema.sql`](supabase/schema.sql) целиком — он создаёт таблицы, включает Row Level Security (общий доступ для всех авторизованных пользователей — это одна команда, а не мульти-тенантный сервис) и заполняет базовые статьи расходов.
   - Если у вас уже был применён более ранний вариант схемы (с изоляцией данных по пользователю), выполните дополнительно [`supabase/migration_shared_workspace.sql`](supabase/migration_shared_workspace.sql) — он переключает RLS на общий доступ и убирает дублирующиеся категории, если те успели создаться у второго пользователя.
   - В Authentication → Users создайте пользователей (email + пароль) — по одному на каждого, кто должен вводить данные (владелица бизнеса, сестра и т.д.). Все они видят и редактируют одни и те же проекты.
   - Возьмите `Project URL`, `anon public key` и `service_role key` из Project Settings → API.

2. **Google Sheets**
   - В Google Cloud Console создайте проект, включите Google Sheets API.
   - Создайте сервисный аккаунт, сгенерируйте JSON-ключ.
   - Создайте Google Таблицу и откройте доступ (Editor) для email сервисного аккаунта.
   - Возьмите `client_email` и `private_key` из JSON-ключа, а также ID таблицы (из её URL).

3. **Переменные окружения**
   - Скопируйте `.env.local.example` в `.env.local` и заполните значения.
   - `GOOGLE_PRIVATE_KEY` должен содержать `\n` как экранированные переносы строк (см. пример в файле).

4. **Запуск локально**

   ```bash
   npm install
   npm run dev
   ```

   Откройте http://localhost:3000 и войдите созданным в Supabase пользователем.

### Деплой на Vercel

1. Импортируйте репозиторий в Vercel.
2. Добавьте все переменные из `.env.local.example` в Project Settings → Environment Variables.
3. Задеплойте — миграции не нужны, схема уже применена напрямую в Supabase на шаге настройки.

### Структура

- `supabase/schema.sql` — схема БД, RLS-политики (общий доступ для всех авторизованных пользователей), базовые категории расходов.
- `supabase/migration_shared_workspace.sql` — миграция для БД, созданной по старой (per-user) версии схемы.
- `src/lib/supabase/` — клиенты Supabase (browser/server/middleware).
- `src/lib/googleSheets.ts` — запись строки расхода в Google Таблицу через сервисный аккаунт.
- `src/app/(app)/` — защищённые авторизацией страницы: дашборд, страница проекта, аналитика.
- `src/app/api/sheets/` — API-роуты синхронизации (`append`, `resync` для повторной отправки несинхронизированных расходов).
