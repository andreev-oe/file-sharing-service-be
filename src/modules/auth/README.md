# AuthModule

Регистрация, вход, управление JWT-токенами, инвалидация сессий через Redis.

## Эндпоинты

| Метод | URL | Защита | Описание |
|---|---|---|---|
| POST | `/auth/register` | — | Регистрация нового пользователя |
| POST | `/auth/login` | — | Вход, возврат пары токенов |
| POST | `/auth/refresh` | — | Обновление токенов по refresh-токену |
| POST | `/auth/logout` | JwtAuthGuard | Инвалидация refresh-токена |

## AuthService

### `register(dto)`
Делегирует создание пользователя в `UsersService.create()`. Выбрасывает `ConflictException`, если email уже занят.

### `login(dto)`
Ищет пользователя по email, сравнивает пароль через `bcrypt.compare`. При успехе вызывает `issueTokenPair()`.

### `refresh(token)`
Верифицирует refresh JWT, проверяет наличие ключа `refresh:{jti}` в Redis. Если токен действителен — удаляет старый ключ и выдаёт новую пару (ротация). Выбрасывает `UnauthorizedException` если токен отозван или истёк.

### `logout(token)`
Декодирует refresh-токен (без верификации подписи), извлекает `jti` и удаляет ключ `refresh:{jti}` из Redis.

### `issueTokenPair(userId)` (private)
Генерирует `jti` через `crypto.randomUUID()`. Создаёт два JWT:
- **access** — `{ sub: userId }`, TTL из конфига (по умолчанию 15 мин)
- **refresh** — `{ sub: userId, jti, type: 'refresh' }`, TTL из конфига (по умолчанию 7 дней)

Сохраняет в Redis: `refresh:{jti}` = `userId`, EX = 7 дней.

## JwtStrategy

Passport-стратегия `Bearer`. Читает `sub` из payload, загружает пользователя через `UsersService.findById()`. Если пользователь не найден — выбрасывает `UnauthorizedException`.

## Схема хранения refresh-токенов в Redis

```
refresh:{jti}  →  userId   (EX: 604800 сек)
```

Каждая сессия имеет уникальный `jti`, что позволяет иметь несколько активных сессий одновременно и отзывать их по отдельности.
