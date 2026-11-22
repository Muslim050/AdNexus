# AdNexus · Ad Platform

Рекламная платформа: кампании, договоры и оплаты, рекламодатели, площадки,
пользователи и отчёты. Визуальный язык «Павильон» перенесён из проекта
Global Expo: тёмная верхняя «вывеска» с номерами разделов, прямые углы,
тонкие линии и чертёжная сетка, изумрудный акцент.

## Стек

Next.js 16 (App Router, Turbopack, Cache Components) · React 19 ·
Tailwind CSS 4 · Framer Motion · lucide-react. Шрифты — Montserrat,
Manrope и JetBrains Mono из `@fontsource-variable/*`.

Дальше по плану: Postgres (Neon) + Drizzle ORM, Better Auth, Vercel Blob.

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

## Состояние

Этапы 0–1 готовы: каркас, дизайн-система, оболочка кабинета, экран входа.
Разделы пока — заглушки. Вход временный: кабинет открыт под
демо-администратором (`src/lib/session.ts`), пока не подключена авторизация.
