# AdNexus · Ad Platform

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
Схема пока минимальная (`users`, `login_attempts`): таблицы предметной
области проектируются заново.

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

## Состояние

Готово: каркас, дизайн-система, оболочка кабинета, инфраструктура БД,
вход и разделение по ролям. Разделы кабинета — заглушки: логику
проектируем заново.
