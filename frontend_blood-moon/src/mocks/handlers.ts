import { http, HttpResponse, delay } from 'msw';
import { CardType, Chest } from '../entities/types';

export const handlers = [
  // Имитация получения начальных данных при старте игры
  http.get('/api/game/initial-data', async () => {
    // Имитация сетевой задержки в 500мс
    await delay(500);

    const mockChests: Chest[] = [
      {
        id: 'chest_1',
        isOpened: false,
        timerCard: {
          id: 'timer_1',
          name: 'Гнев Дворца -1',
          description: 'Уменьшает общий таймер на 1',
          type: CardType.TIMER,
          timerModifier: -1,
        },
        cards: [
          {
            id: 'treas_1',
            name: 'Золотой Идол',
            description: 'Древний артефакт',
            type: CardType.TREASURE,
            strengthBonus: 2,
            goldValue: 5,
            isEquipped: false,
          },
          {
            id: 'cons_1',
            name: 'Зелье Лечения',
            description: 'Восстанавливает 2 жизни',
            type: CardType.CONSUMABLE,
            effectType: 'HEAL',
            value: 2,
          },
        ],
      },
      {
        id: 'chest_2',
        isOpened: false,
        timerCard: {
          id: 'timer_2',
          name: 'Гнев Дворца -2',
          description: 'Уменьшает общий таймер на 2',
          type: CardType.TIMER,
          timerModifier: -2,
        },
        cards: [
          {
            id: 'treas_2',
            name: 'Меч Атлантов',
            description: 'Острое оружие',
            type: CardType.TREASURE,
            strengthBonus: 4,
            goldValue: 3,
            isEquipped: false,
          },
        ],
      },
      {
        id: 'chest_3',
        isOpened: false,
        timerCard: {
          id: 'timer_3',
          name: 'Гнев Дворца -1',
          description: 'Уменьшает общий таймер на 1',
          type: CardType.TIMER,
          timerModifier: -1,
        },
        cards: [
          {
            id: 'cons_2',
            name: 'Эликсир Силы',
            description: 'Дает +3 к силе в бою',
            type: CardType.CONSUMABLE,
            effectType: 'STRENGTH_BUFF',
            value: 3,
          },
        ],
      },
    ];

    return HttpResponse.json({
      chests: mockChests,
    });
  }),
];
