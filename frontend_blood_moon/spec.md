# WebSocket Event Contracts (Phase 2)

Протокол обмена сообщениями между клиентом (React/XState) и сервером (Node.js/WebSocket). Все сообщения передаются в формате JSON.

## Client -> Server (Действия игрока)

Действия, которые инициирует клиент для изменения состояния игры.

### 1. `SELECT_CHEST`
Игрок выбирает сундук (становится Лидером) или пропускает этап.
```json
{
  "type": "SELECT_CHEST",
  "payload": {
    "playerId": "player_1",
    "chestId": "chest_A", // null, если игрок пропускает этап
    "action": "LEAD" // "LEAD" или "SKIP"
  }
}
```

### 2. `JOIN_BATTLE`
Игрок присоединяется к битве за сундук в качестве Союзника выбранного Лидера.
```json
{
  "type": "JOIN_BATTLE",
  "payload": {
    "playerId": "player_2",
    "chestId": "chest_A",
    "leaderId": "player_1"
  }
}
```

### 3. `PLAY_CARD`
Использование расходника в бою или в фазе привала.
```json
{
  "type": "PLAY_CARD",
  "payload": {
    "playerId": "player_1",
    "cardId": "card_123",
    "targetId": "player_2" // Опционально, если карта применяется на другого игрока
  }
}
```

### 4. `EQUIP_ITEM`
Экипировка предмета из руки в фазе Привала (Rest Phase).
```json
{
  "type": "EQUIP_ITEM",
  "payload": {
    "playerId": "player_1",
    "cardId": "treasure_456"
  }
}
```

---

## Server -> Client (Изменения состояния)

События, которые сервер рассылает всем подключенным клиентам (Broadcast) или конкретному игроку.

### 1. `GAME_STARTED`
Инициализация игры, раздача начальных карт и ролей.
```json
{
  "type": "GAME_STARTED",
  "payload": {
    "globalTimer": 10,
    "players": [ /* массив объектов Player */ ],
    "chests": [ /* массив объектов Chest */ ]
  }
}
```

### 2. `PHASE_CHANGED`
Смена глобальной фазы игры (например, переход от выбора сундуков к битве).
```json
{
  "type": "PHASE_CHANGED",
  "payload": {
    "newPhase": "battle_phase",
    "roundNumber": 1
  }
}
```

### 3. `BATTLE_RESULT`
Результаты сражения за конкретный сундук.
```json
{
  "type": "BATTLE_RESULT",
  "payload": {
    "chestId": "chest_A",
    "winnerLeaderId": "player_1",
    "winningAllies": ["player_2"],
    "losers": ["player_3", "player_4"],
    "rewards": {
      "player_1": { "gold": 2, "cards": ["treasure_1", "consumable_1"] },
      "player_2": { "gold": 1 }
    },
    "penalties": {
      "player_3": { "healthLost": 1 },
      "player_4": { "healthLost": 1 }
    }
  }
}
```

### 4. `HEAVENS_GIFT_ROLL`
Результат броска кубика на "Дар с Небес" (в конце четного раунда).
```json
{
  "type": "HEAVENS_GIFT_ROLL",
  "payload": {
    "roundNumber": 2,
    "diceResult": 4,
    "isTriggered": true,
    "revealedCards": ["treasure_7", "treasure_8", "treasure_9"]
  }
}
```
