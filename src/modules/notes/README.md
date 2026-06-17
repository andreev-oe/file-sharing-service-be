# NotesModule

Текстовые заметки к файлам с поддержкой `@mentions`, пагинация, контроль авторства.

## Эндпоинты

Все защищены `JwtAuthGuard`. Автор определяется по `CurrentUser` из JWT.

| Метод | URL | Описание |
|---|---|---|
| POST | `/notes` | Создать заметку к файлу |
| GET | `/notes/file/:fileId?page=1&limit=20` | Список заметок файла (пагинация) |
| PATCH | `/notes/:id` | Обновить содержимое заметки (только автор) |
| DELETE | `/notes/:id` | Удалить заметку (только автор, 204) |

## NotesService

### `create(authorId, dto)`
Создаёт заметку: сохраняет `fileId`, `authorId`, `content`, автоматически извлекает `mentions` из контента через `extractMentions()`. Возвращает сохранённую сущность.

### `findByFile(fileId, page, limit)`
Возвращает `{ data: Note[], total: number }`. Сортировка по `createdAt DESC`. Пагинация: `skip = (page - 1) * limit`, `take = limit`. Видят заметки все аутентифицированные пользователи (нет ограничения по `authorId`).

### `update(id, authorId, dto)`
Делегирует проверку владения в `findOwnedOrFail()`. Обновляет `content` и пересчитывает `mentions`. Возвращает обновлённую сущность через `save()`.

### `remove(id, authorId)`
Делегирует проверку владения в `findOwnedOrFail()`. Выполняет жёсткое удаление через `delete()`.

### `findOwnedOrFail(id, authorId)` (private)
Ищет заметку по `id`. Выбрасывает `NotFoundException` если не найдена, `ForbiddenException` если `note.authorId !== authorId`.

### `extractMentions(content)` (private)
Извлекает уникальные логины из строки по паттерну `@(\w+)`. Использует `matchAll` с модулем-уровневым `MENTION_PATTERN = /@(\w+)/g`. Результат дедуплицируется через `Set`.

## Сущность Note

| Поле | Тип | Описание |
|---|---|---|
| `id` | uuid | PK, генерируется автоматически |
| `fileId` | string | FK на `files.id` |
| `authorId` | string | FK на `users.id` |
| `content` | text | Текст заметки |
| `mentions` | text[] | Список упомянутых логинов (из `@...` в content) |
| `createdAt` | timestamp | Время создания |
| `updatedAt` | timestamp | Время последнего обновления |

## Mentions

Логины хранятся как массив строк в PostgreSQL-колонке `text[]`. Извлекаются из `content` при каждом `create` и `update`. `mentions` — денормализованный кэш: источником истины остаётся `content`.

Пример: `"Отличный файл, @alice и @bob!"` → `mentions: ["alice", "bob"]`.
