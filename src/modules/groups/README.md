# GroupsModule

Управление группами пользователей: создание, управление участниками, ролевая модель внутри группы.

## Эндпоинты

Все защищены `JwtAuthGuard`. Текущий пользователь определяется по `CurrentUser` из JWT.

| Метод | URL | Описание |
|---|---|---|
| POST | `/groups` | Создать группу |
| POST | `/groups/:id/members` | Добавить участника (только OWNER / ADMIN) |
| DELETE | `/groups/:id/members/:userId` | Удалить участника (только OWNER / ADMIN, 204) |
| PATCH | `/groups/:id/transfer-ownership` | Передать роль owner другому участнику (только OWNER, 204) |
| GET | `/groups/:id/members` | Список участников группы с данными пользователя |

## GroupsService

### `create(ownerId, dto)`
Создаёт группу и сразу добавляет создателя как первого участника с ролью `OWNER`. Два `save` выполняются последовательно: группа сохраняется первой, чтобы получить `id` для записи в `group_members`.

### `addMember(groupId, requesterId, dto)`
Проверяет право через `verifyManagerAccess()`. Проверяет что пользователь ещё не состоит в группе — `ConflictException` при дублировании. Создаёт `GroupMember` с переданной ролью.

### `removeMember(groupId, requesterId, userId)`
Проверяет право через `verifyManagerAccess()`. Ищет запись участника — `NotFoundException` если нет.

Если удаляемый участник — OWNER:
- Только сам владелец может удалить себя (самовыход). Попытка admin удалить owner → `ForbiddenException`.
- Перед удалением вызывает `promoteOldestAdminToOwner()`. Если admin-ов нет — `ForbiddenException` с предложением сначала передать права явно.

### `transferOwnership(groupId, requesterId, newOwnerId)`
Только OWNER может вызвать. Проверяет что `newOwnerId` — действующий участник группы. Понижает текущего owner до ADMIN, повышает нового участника до OWNER, обновляет `group.ownerId`. Передача самому себе → `ForbiddenException`.

### `getMembers(groupId)`
Возвращает всех участников группы с загруженной релацией `user`. Сортировка по `createdAt ASC` (старейшие участники первые).

### `promoteOldestAdminToOwner(groupId)` (private)
Ищет ADMIN с наименьшим `createdAt` (старейший по стажу). Обновляет его роль до OWNER и обновляет `group.ownerId`. Если admin-ов нет — `ForbiddenException`.

### `verifyManagerAccess(groupId, userId)` (private)
Ищет запись `GroupMember` по `(groupId, userId)`. Выбрасывает `ForbiddenException` если запись не найдена или роль не входит в `MANAGER_ROLES = { OWNER, ADMIN }`.

## Сущности

### Group

| Поле | Тип | Описание |
|---|---|---|
| `id` | uuid | PK |
| `name` | string | Название группы |
| `description` | string \| null | Описание (опционально) |
| `ownerId` | string | FK на `users.id` — создатель |
| `createdAt` | timestamp | Время создания |
| `updatedAt` | timestamp | Время обновления |

### GroupMember

| Поле | Тип | Описание |
|---|---|---|
| `id` | uuid | PK |
| `groupId` | string | FK на `groups.id` |
| `userId` | string | FK на `users.id` |
| `role` | GroupMemberRole | Роль участника в группе |
| `createdAt` | timestamp | Время добавления в группу |

## Роли участников (GroupMemberRole)

| Роль | Описание |
|---|---|
| `owner` | Создатель группы. Может выйти сам только если есть admin для автопромоции, либо передать роль явно через `transfer-ownership`. |
| `admin` | Может добавлять и удалять участников. |
| `member` | Рядовой участник. |
| `viewer` | Участник только для просмотра. |

## Архитектурные решения

`verifyManagerAccess` намеренно бросает `ForbiddenException` (а не `NotFoundException`) если пользователь не состоит в группе — это не раскрывает факт существования группы посторонним.

OWNER защищён от принудительного удаления на уровне сервиса — admin не может удалить owner, только сам owner может покинуть группу (с автопромоцией admin или явной передачей прав).

### Передача владения

Два сценария:
1. **Явная передача** — `PATCH /groups/:id/transfer-ownership` с `{ newOwnerId }`. Текущий owner становится admin, выбранный участник становится owner.
2. **Автопромоция при выходе** — владелец удаляет себя через `DELETE /groups/:id/members/:userId`. Старейший по `createdAt` admin автоматически становится owner. Если admin-ов нет — выход заблокирован с предложением сначала передать роль явно.
