# Разработка и публикация

Сервер написан на Rust, веб-интерфейс использует React и Vite. При сборке Rust встраивает готовые файлы интерфейса в бинарник. Схема БД и протокол авторизации совместимы с AsterYggdrasil.

```sh
cd frontend-panel
bun install --frozen-lockfile
bun run check
bun run test
bun run build
cd ..
cargo fmt --all -- --check
cargo test --workspace
```

Для запуска всего приложения из изменённого дерева:

```sh
docker build -t mc-portal:dev .
PORTAL_IMAGE=mc-portal:dev docker compose up -d
```

## Образы

GitHub Actions собирает образы на нативных Linux-раннерах AMD64 и ARM64, запускает каждую сборку и проверяет `/health/ready`. После обеих проверок публикуется общий манифест в GHCR. Для записи используется токен текущего workflow с правом `packages: write`.

| Ссылка на образ | Когда появляется |
|---|---|
| `ghcr.io/streletskiy/krwa-mc-portal:sha-<полный SHA>` | После сборки конкретной ревизии |
| `:latest` | После сборки актуальной вершины `main` |
| `:vX.Y.Z` | После сборки одноимённого Git-тега |

В собственном форке workflow берёт namespace и имя из `github.repository`. Для Compose укажите свой `PORTAL_IMAGE`. После первой публикации владелец пакета может открыть анонимное скачивание в настройках GHCR.

## Обновление и откат

Сохраните предыдущий digest и согласованную резервную копию всего `/data`. Задайте в `.env` новое значение `PORTAL_IMAGE=ghcr.io/streletskiy/krwa-mc-portal@sha256:…`, выполните `docker compose pull portal` и `docker compose up -d portal`. Проверьте готовность, вход в портал и лаунчер, наличие прежнего профиля и загрузку текстур. Для отката верните прежний digest. Если релиз применил несовместимую миграцию, восстановите также согласованную копию данных.
