# AdNexus · CRM Platform

Рекламная платформа: кампании, договоры и оплаты, рекламодатели, площадки,
пользователи и отчёты. Визуальный язык «Павильон» перенесён из проекта
Global Expo: тёмная верхняя «вывеска» с номерами разделов, прямые углы,
тонкие линии и чертёжная сетка, изумрудный акцент.

## Стек

Next.js 16 (App Router, Turbopack, Cache Components) · React 19 ·
Tailwind CSS 4 · Framer Motion · lucide-react. Шрифты — Montserrat,
Manrope и JetBrains Mono из `@fontsource-variable/*`.

База — Postgres (Neon через Vercel Marketplace) и Drizzle ORM, как в
проекте yakasaroy. Файлы — Vercel Blob.

## База данных

Переменные подключения берутся из проекта на Vercel:

```bash
vercel link
vercel env pull .env.local
npm run db:migrate
npm run db:seed
```

| Команда               | Что делает                                                            |
| --------------------- | --------------------------------------------------------------------- |
| `npm run db:generate` | создаёт миграцию в `drizzle/` после правки `src/db/schema.ts`         |
| `npm run db:migrate`  | применяет миграции к базе из `.env.local`                             |
| `npm run db:seed`     | добавляет демо-входы `admin` и `viewer` (пароль = логин), если их нет |
| `npm run db:studio`   | Drizzle Studio — просмотр таблиц                                      |

Клиент — `getDb()` из [src/db/index.ts](src/db/index.ts), только на сервере.
Таблицы: `users`, `login_attempts`, `advertisers`, `contracts`, `campaigns`,
`placement_formats`, `bookings`.
Логика проектируется заново; цепочка «рекламодатель → договор → кампания»
сделана по образцу Setanta (без лиг и пакетов).

## Запуск

```bash
npm install
npm run dev -- --port 5198
```

```bash
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit (перед ним один раз: npx next typegen)
npm run format     # Prettier
```

## Структура

```
src/
  app/
    login/          — экран входа
    (cabinet)/      — кабинет: общий каркас и разделы
  components/
    ui/             — дизайн-система (Button, Card, Modal-панель, Field, Tabs, Toast…)
    charts/         — SVG-графики (Area, Bar, Donut, Sparkline)
    layout/         — AppShell, Topbar, Navigation
    session/        — текущий пользователь для клиентских компонентов
  lib/              — nav (разделы и роли), session, format, хуки
```

Тема — блок `@theme` в [src/app/globals.css](src/app/globals.css).
Имена токенов: `paper`, `ink`, `indigo-*` (фирменная зелёная шкала),
`lime-*` (мятный сигнальный), `forest` (тёмная вывеска). Утилиты: `eyebrow`,
`corner-ticks`, `bg-blueprint`, `bg-grid-fade`, `bg-hatch`.

## Роли

| Раздел        | admin |     viewer      |    advertiser    |
| ------------- | :---: | :-------------: | :--------------: |
| Кампании      | CRUD  | только просмотр |   только свои    |
| Обзор         |  да   |       да        |        —         |
| Договоры      | CRUD  | только просмотр |        —         |
| Площадки      | CRUD  | только просмотр |        —         |
| Рекламодатели | CRUD  | только просмотр |        —         |
| Пользователи  | CRUD  |        —        |        —         |
| Отчёт         |   —   |        —        | по своему бренду |

## Вход и доступ

Как в yakasaroy: логин и пароль из таблицы `users`, пароль — scrypt с солью.

- Сессия — httpOnly-cookie `adnexus_session`, подписанная HMAC
  ([src/lib/token.ts](src/lib/token.ts)), живёт неделю. Секрет — `AUTH_SECRET`
  (32+ символа); **без него продакшен не запустится**.
- Лимит попыток входа хранится в Postgres (`login_attempts`): 5 за 15 минут
  с одного адреса на логин, 20 — на логин со всех адресов.
- [src/proxy.ts](src/proxy.ts) — оптимистичная проверка подписи cookie:
  гостя уводит на `/login`, вошедшего — со страницы входа в кабинет.
- Настоящая проверка — [src/lib/auth.ts](src/lib/auth.ts): каждая страница
  кабинета вызывает `requireSection` / `requireRole`, пользователь и роль
  читаются из базы, так что отключённый пользователь теряет доступ сразу.
- Вход и выход — серверные действия в [src/app/actions/auth.ts](src/app/actions/auth.ts).

## Файлы

Приватное хранилище Vercel Blob `adnexus-files` (fra1). Файл уходит из
браузера прямо в Blob ([FileDrop](src/components/ui/FileDrop.tsx) —
перетаскивание, прогресс, отмена), токен на загрузку выдаёт
`/api/files/upload` только admin и только в папки `contracts/` и `bookings/`.
В базе хранится путь; отдаёт файл `/api/files?path=…` после проверки сессии.
Публичных ссылок нет. До 200 МБ: PDF, Word, Excel, изображения, видео.

## Компоненты shadcn/ui

Как в yakasaroy: стиль `base-nova` (Base UI), [components.json](components.json).
Сгенерированные компоненты лежат в `src/components/shadcn/` — отдельно от
своей дизайн-системы `src/components/ui/`, потому что на macOS `button.tsx`
и `Button.tsx` — один файл. Токены shadcn (`primary`, `popover`, `ring`…)
привязаны к палитре в `globals.css`. На них собраны `DatePicker`
(Calendar в поповере), `TimePicker` (часы и минуты двумя колонками)
и `SelectField` (Select) — во всех формах вместо системных полей.

```bash
npx shadcn@latest add <component>
```

## Разделы

| Раздел                 | Адрес                                     | Что есть                                                                                                                                                     |
| ---------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Календарь публикаций   | `/calendar?d=…`, `/calendar?view=day&d=…` | неделя или день по времени (шаг 30 мин), линия «сейчас», мини-месяц, фильтр, бронь кликом по клетке                                                          |
| Заказы и медиапланы    | `/orders?status=&month=&format=&q=&page=` | публикации как брони в yakasaroy: год и месяцы, итоги (публикации, оплачено, остаток), вкладки статусов, поиск, формат, таблица с оплатой, выплаты, карточка |
| Рекламодатели и бренды | `/advertisers`, `/advertisers/contracts`  | вкладки «Рекламодатели» и «Договоры»: списки и создание                                                                                                      |
| Справочник             | `/directory`                              | форматы публикаций и их цвета в календаре                                                                                                                    |

Бронирует admin и рекламодатель (по своим договорам), viewer смотрит.
Статусы брони: Отправлен → Получен → Рассматривается → Активен → Выполнен,
меняет admin. Заявка рекламодателя приходит «Отправлен»; править и отменять
её он может, пока статус не сменился. Чужие брони рекламодатель видит как
«Занято». Доступ рекламодателю выдаёт admin в «Рекламодателях и брендах».
Слот —
«время | менеджер | формат | рекламная кампания», цвет — от формата.
Бронь привязана к рекламодателю и его договору: номер, скидка, срок и файл
договора подтягиваются из договора. Менеджер — сотрудник с учётной записью
(роли admin и viewer). Один формат
в одну минуту бронируется один раз (уникальный индекс в базе). Дата
и время — по Ташкенту.
