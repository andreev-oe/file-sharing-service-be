# FoldersModule

Иерархия папок с материализованными путями, поиск, мягкое удаление.

## Эндпоинты

Все защищены `JwtAuthGuard`. Владелец определяется по `CurrentUser` из JWT.

| Метод | URL | Описание |
|---|---|---|
| POST | `/folders` | Создать папку |
| GET | `/folders/tree` | Дерево всех папок пользователя |
| GET | `/folders/search?q=...` | Поиск папок по имени |
| GET | `/folders/:id/children` | Прямые дочерние папки |
| PATCH | `/folders/:id` | Переименовать / переместить |
| DELETE | `/folders/:id` | Мягкое удаление (204) |

Файлы в папке: `GET /files?folderId=:id` — отдельный запрос к `FilesModule`.

## FoldersService

### `create(ownerId, dto)`
Генерирует UUID заранее через `crypto.randomUUID()` — это нужно для построения пути до сохранения в БД. Если передан `parentId`, проверяет что родитель существует и принадлежит пользователю, проверяет глубину ≤ 10. Строит материализованный путь:
- корневая папка → `/{folderId}`
- вложенная папка → `{parent.path}/{folderId}`

### `getTree(ownerId)`
Загружает все папки пользователя одним запросом, затем рекурсивно строит дерево в памяти через `buildTree()`. Возвращает `FolderTreeNodeDto[]`.

### `getChildFolders(folderId, ownerId)`
Проверяет владение папкой, возвращает прямых потомков (`parentId = folderId`).

### `update(id, ownerId, dto)`
Если `parentId` изменился — делегирует перемещение в `moveToNewParent()`. Переименование и перемещение можно делать одним запросом.
- `parentId: null` → переместить в корень
- `parentId: <uuid>` → переместить в другую папку
- `parentId` отсутствует → только переименование

### `softDelete(id, ownerId)`
Помечает `isDeleted = true` для самой папки и всех потомков одним `UPDATE`. Потомки находятся через `path LIKE '{folder.path}/%'`.

### `search(ownerId, query)`
Поиск по полю `name` через `ILIKE '%query%'`. Возвращает папки пользователя, совпадающие с запросом.

### `moveToNewParent(folder, newParentId, ownerId)` (private)
Защищает от двух ситуаций:
1. Перемещение в себя или в собственное поддерево — `newParent.path.startsWith(folder.path + '/')`
2. Превышение глубины 10 в целевом месте

Шаги:
1. Обновляет `parentId` и `path` самой папки
2. Запрашивает всех потомков (`path LIKE 'oldPath/%'`)
3. Пересчитывает `path` каждого потомка: заменяет `oldPath`-префикс на `newPath`

### `findOwnedOrFail(id, ownerId)` (private)
Ищет папку по `id + ownerId + isDeleted = false`. Выбрасывает `NotFoundException` если не найдена — используется во всех публичных методах для проверки владения.

### `buildTree(allFolders, parentId)` (private)
Рекурсивный метод. Фильтрует папки с нужным `parentId`, для каждой рекурсивно собирает детей через `FolderTreeNodeDto.fromEntity()`. Работает на плоском массиве, загруженном одним запросом в `getTree()`.

## Материализованные пути

```
/uuid-a                        ← корневая папка A
/uuid-a/uuid-b                 ← папка B внутри A
/uuid-a/uuid-b/uuid-c          ← папка C внутри B (глубина 3)
```

Преимущество: поиск всех потомков — одно условие `path LIKE '/uuid-a/%'`.
Ограничение: перемещение папки требует обновления `path` у всех потомков построчно.

## Архитектурное решение

`FoldersModule` не зависит от `FilesModule`. Файлы не входят в зону ответственности этого модуля.

Для получения содержимого папки (папки + файлы) клиент делает два независимых запроса:
1. `GET /folders/:id/children` — дочерние папки
2. `GET /files?folderId=:id` — файлы в папке
