# GroupsModule

Управление группами пользователей: создание, управление участниками, ролевая модель внутри группы.

## Эндпоинты

Все защищены `JwtAuthGuard`. Текущий пользователь определяется по `CurrentUser` из JWT.

| Метод | URL | Описание |
|---|---|---|
| POST | `/groups` | Создать группу |
| POST | `/groups/:id/members` | Добавить участника (только OWNER / ADMIN) |
| DELETE | `/groups/:id/members/:userId` | Удалить участника (только OWNER / ADMIN, 204) |
| GET | `/groups/:id/members` | Список участников группы с данными пользователя |

## GroupsService

### `create(ownerId, dto)`
Создаёт группу и сразу добавляет создателя как первого участника с ролью `OWNER`. Два `save` выполняются последовательно: группа сохраняется первой, чтобы получить `id` для записи в `group_members`.

### `addMember(groupId, requesterId, dto)`
Проверяет право через `verifyManagerAccess()`. Проверяет что пользователь ещё не состоит в группе — `ConflictException` при дублировании. Создаёт `GroupMember` с переданной ролью.

### `removeMember(groupId, requesterId, userId)`
Проверяет право через `verifyManagerAccess()`. Ищет запись участника — `NotFoundException` если нет. Запрещает удалять OWNER — `ForbiddenException`. Выполняет жёсткое удаление по `id` записи.

### `getMembers(groupId)`
Возвращает всех участников группы с загруженной релацией `user`. Сортировка по `createdAt ASC` (старейшие участники первые).

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
| `owner` | Создатель группы. Не может быть удалён из группы. |
| `admin` | Может добавлять и удалять участников. |
| `member` | Рядовой участник. |
| `viewer` | Участник только для просмотра. |

## Архитектурные решения

`verifyManagerAccess` намеренно бросает `ForbiddenException` (а не `NotFoundException`) если пользователь не состоит в группе — это не раскрывает факт существования группы посторонним.

OWNER защищён от удаления на уровне сервиса, а не базы данных — чтобы ошибка была читаемой (`ForbiddenException`), а не сырой constraint violation.
