# PermissionsModule

Управление доступом к файлам и папкам. Поддерживает выдачу прав отдельным пользователям и группам.

## Эндпоинты

Все защищены `JwtAuthGuard`.

| Метод | URL | Описание |
|---|---|---|
| POST | `/permissions` | Выдать или обновить разрешение |
| DELETE | `/permissions/:id` | Отозвать разрешение (204) |

## PermissionsService

### `grant(dto)`
Upsert: если разрешение для той же пары `(subjectType, subjectId, resourceType, resourceId)` уже существует — обновляет уровень. Иначе создаёт новую запись. Это позволяет повышать и понижать права без предварительного отзыва.

### `revoke(id)`
Удаляет разрешение по `id`. `NotFoundException` если не найдено.

### `check(userId, resourceType, resourceId, required)`
Проверяет, имеет ли пользователь требуемый уровень доступа к ресурсу. Учитывает два источника прав:

1. **Прямые** — записи с `subjectType = user` и `subjectId = userId`
2. **Групповые** — записи с `subjectType = group` и `subjectId` в группах пользователя

Шаги:
1. Получает список групп пользователя через `EntityManager.createQueryBuilder(GroupMember)`
2. Одним запросом забирает все подходящие записи из `permissions`
3. Выбирает наивысший уровень среди найденных
4. Сравнивает с `required` по шкале `VIEW < COMMENT < EDIT < MANAGE`

Возвращает `true` если наивысший найденный уровень ≥ требуемого.

## Сущность Permission

| Поле | Тип | Описание |
|---|---|---|
| `id` | uuid | PK |
| `subjectType` | SubjectType | `user` или `group` |
| `subjectId` | string | ID пользователя или группы |
| `resourceType` | ResourceType | `file` или `folder` |
| `resourceId` | string | ID файла или папки |
| `permission` | PermissionLevel | Уровень доступа |
| `createdAt` | timestamp | Время выдачи |

## Уровни доступа (PermissionLevel)

| Уровень | Описание |
|---|---|
| `VIEW` | Просмотр ресурса |
| `COMMENT` | Просмотр + добавление заметок |
| `EDIT` | Просмотр + редактирование содержимого |
| `MANAGE` | Полный контроль, включая выдачу прав другим |

Уровни упорядочены: `VIEW < COMMENT < EDIT < MANAGE`. Проверка `check` принимает любой уровень ≥ требуемого.

## Архитектурное решение

`check` читает таблицу `group_members` через `EntityManager.createQueryBuilder(GroupMember)` — без инжекции репозитория из `GroupsModule`. `EntityManager` имеет доступ ко всем зарегистрированным сущностям через `autoLoadEntities: true` в `AppModule`. Это позволяет выполнить join между доменами не нарушая изоляцию модулей.
