import { motion, AnimatePresence } from 'motion/react';
import { Chest } from './Chest';
import { Card } from './Card';
import { EquipmentSlot } from './EquipmentSlot';
import { DiscardSlot } from './DiscardSlot';
import { HandSlot } from './HandSlot';
import { Clock, ScrollText, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { useRef, useEffect } from 'react';
import { calculateFinalGold } from '../../entities/utils';

export function GameBoard({ state, send }: { state: any, send: any }) {
  const { context } = state;
  const isBattle = state.matches('battle_phase');
  const isRest = state.matches('rest_phase');
  const myPlayerId = 'p1'; // Assuming p1 is the current player for this demo

  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [context.eventLog]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && over.id === 'equipment-zone') {
      const card = active.data.current?.card;
      if (card) {
        send({ type: 'EQUIP_ITEM', playerId: myPlayerId, cardId: card.id });
      }
    } else if (over && over.id === 'discard-zone') {
      const card = active.data.current?.card;
      if (card) {
        send({ type: 'DISCARD_ITEM', playerId: myPlayerId, cardId: card.id });
      }
    } else if (over && over.id === 'hand-zone') {
      const card = active.data.current?.card;
      if (card) {
        send({ type: 'UNEQUIP_ITEM', playerId: myPlayerId, cardId: card.id });
      }
    }
  };

  const myPlayer = context.players.find((p: any) => p.id === myPlayerId);
  const otherPlayers = context.players.filter((p: any) => p.id !== myPlayerId);
  const treasureCount = myPlayer?.inventory?.equipment?.filter((c: any) => c.type === 'TREASURE').length || 0;
  const isEquipmentFull = treasureCount >= 2;

  const calculatePlayerStrength = (player: any) => {
    if (!player) return 0;
    const base = player.character?.baseStrength || 5;
    const equip = player.inventory?.equipment?.reduce((sum: number, item: any) => sum + (item.strengthBonus || 0), 0) || 0;
    return base + equip;
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col h-screen w-full bg-slate-950 text-slate-50 overflow-hidden"
      >
        {/* Top Bar: Timer, Log, Other Players */}
        <div className="shrink-0 p-4 border-b border-slate-800 bg-slate-900/50 flex gap-4 items-start">
          {/* Timer */}
          <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-lg shrink-0">
            <Clock className={cn("text-red-500", context.globalTimer <= 3 && "animate-pulse")} size={28} />
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Гнев Дворца</div>
              <motion.div 
                key={context.globalTimer}
                initial={{ scale: 1.5, color: '#ef4444' }}
                animate={{ scale: 1, color: '#f1f5f9' }}
                className="text-2xl font-black leading-none"
              >
                {context.globalTimer}
              </motion.div>
            </div>
          </div>

          {/* Log */}
          <div className="flex-1 bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-lg h-16 overflow-y-auto flex flex-col gap-1">
            {context.eventLog.map((log: string, i: number) => (
              <div key={i} className="text-xs text-slate-400 flex items-start gap-2">
                <ScrollText size={12} className="mt-0.5 text-teal-500 shrink-0" />
                <span>{log}</span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>

          {/* Other Players */}
          <div className="flex gap-2 shrink-0">
            {otherPlayers.map((p: any) => (
              <div key={p.id} className={cn(
                "bg-slate-950 border rounded-xl p-2 flex flex-col gap-1 text-xs w-32 shadow-lg transition-colors",
                context.lastLoserId === p.id ? "border-red-500/50 bg-red-950/20" : "border-slate-800"
              )}>
                <div className="font-bold text-teal-400 truncate">{p.name}</div>
                <div className="flex justify-between">
                  <span className="text-yellow-400 font-mono">{p.gold}G</span>
                  <span className={cn("font-mono", context.lastLoserId === p.id ? "text-red-500 animate-pulse" : "text-red-400")}>{p.currentHealth}HP</span>
                </div>
                <div className="text-slate-600 text-[10px] mt-1">Экип: {p.inventory?.equipment?.length || 0}/2</div>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Chests & Actions */}
        <div className="flex-1 relative flex flex-col items-center justify-center p-6 min-h-0 overflow-y-auto">
          <div className="text-2xl font-black text-teal-500 tracking-widest uppercase mb-8 drop-shadow-[0_0_10px_rgba(20,184,166,0.3)] text-center">
            {state.matches('chest_selection') ? 'Выберите Сундук' : 
             isBattle ? 'Битва за Сундуки!' : 
             state.matches('chest_reveal') ? 'Вскрытие Сундука' : 
             'Привал'}
          </div>
          
          <div className="flex gap-8 items-center justify-center flex-wrap">
            {context.chests.map((chest: any) => (
              <Chest 
                key={chest.id} 
                chest={chest} 
                isActive={context.activeChestId === chest.id}
                onClick={() => {
                  if (state.matches('chest_selection')) {
                    send({ type: 'SELECT_CHEST', playerId: myPlayerId, chestId: chest.id });
                  }
                }}
              />
            ))}
          </div>
          
          {/* Action Buttons */}
          <div className="mt-12 flex gap-4">
            {state.matches('chest_selection') && (
              <button 
                onClick={() => send({ type: 'NEXT_PHASE' })} 
                disabled={!context.activeChestId}
                className={cn(
                  "px-8 py-3 rounded-full font-bold transition-all shadow-[0_0_20px_rgba(13,148,136,0.3)]",
                  context.activeChestId 
                    ? "bg-teal-600 hover:bg-teal-500 text-white hover:scale-105" 
                    : "bg-slate-700 text-slate-400 cursor-not-allowed shadow-none"
                )}
              >
                Начать Битву
              </button>
            )}
            {state.matches('chest_reveal') && (
              <button onClick={() => send({ type: 'NEXT_PHASE' })} className="px-8 py-3 bg-yellow-600 hover:bg-yellow-500 text-white rounded-full font-bold transition-all shadow-[0_0_20px_rgba(202,138,4,0.4)] hover:scale-105">
                Забрать Добычу
              </button>
            )}
            {state.matches('rest_phase') && (
              <div className="flex flex-col items-center gap-3">
                <button 
                  onClick={() => send({ type: 'END_ROUND' })} 
                  disabled={!state.can({ type: 'END_ROUND' })}
                  className="px-8 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:hover:bg-slate-700 text-white rounded-full font-bold transition-all shadow-lg"
                >
                  Конец Раунда
                </button>
                {!state.can({ type: 'END_ROUND' }) && (
                  <span className="text-sm text-red-400 font-bold animate-pulse">Сбросьте лишние карты (макс 3)</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar: My Player */}
        <div className="shrink-0 bg-slate-900 border-t border-slate-800 p-4 flex gap-6 items-end overflow-x-auto">
          {myPlayer && (
            <>
              {/* Stats */}
              <div className="flex flex-col gap-3 min-w-[160px] shrink-0 mb-2">
                <div className="flex items-center gap-2">
                  <User size={20} className="text-teal-400" />
                  <span className="font-bold text-slate-200 truncate">{myPlayer.name} (Вы)</span>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 shadow-inner">
                    <span className="text-xs text-slate-500 font-bold uppercase">Золото</span>
                    <motion.span key={myPlayer.gold} className="font-mono text-yellow-400 font-bold">{myPlayer.gold}G</motion.span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 shadow-inner">
                    <span className="text-xs text-slate-500 font-bold uppercase">Здоровье</span>
                    <motion.span key={myPlayer.currentHealth} className={cn("font-mono font-bold", context.lastLoserId === myPlayerId ? "text-red-500 animate-pulse" : "text-red-400")}>{myPlayer.currentHealth}HP</motion.span>
                  </div>
                </div>
              </div>

              {/* Equipment */}
              <div className="flex flex-col gap-2 shrink-0">
                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider pl-1">Экипировка (Макс 2)</div>
                <EquipmentSlot id="equipment-zone" isFull={isEquipmentFull}>
                  <AnimatePresence>
                    {myPlayer.inventory?.equipment?.map((card: any) => (
                      <Card 
                        key={card.id}
                        card={card} 
                        layoutId={`card-${card.id}`} 
                        isDraggable={isRest}
                        className="border-yellow-500/50 shadow-[0_0_15px_rgba(250,204,21,0.15)] ring-1 ring-yellow-500/30"
                      />
                    ))}
                  </AnimatePresence>
                </EquipmentSlot>
              </div>

              {/* Hand */}
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider pl-1">Рука (Макс 3)</div>
                <HandSlot>
                  <AnimatePresence>
                    {myPlayer.inventory?.hand?.map((card: any) => {
                      const isConsumable = card.type === 'CONSUMABLE';
                      const canUse = isConsumable && (isRest || isBattle);
                      return (
                        <div 
                          key={card.id} 
                          className={cn("shrink-0", canUse && "cursor-pointer hover:-translate-y-4 transition-transform")}
                          onClick={() => {
                            if (canUse) {
                              send({ type: 'USE_CONSUMABLE', playerId: myPlayerId, cardId: card.id });
                            }
                          }}
                        >
                          <Card 
                            card={card} 
                            layoutId={`card-${card.id}`} 
                            isDraggable={isRest && !isConsumable} 
                            className={cn(canUse && "ring-2 ring-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]")}
                          />
                        </div>
                      );
                    })}
                  </AnimatePresence>
                </HandSlot>
              </div>

              {/* Discard */}
              {isRest && (
                <div className="flex flex-col gap-2 shrink-0">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider opacity-0">Сброс</div>
                  <DiscardSlot />
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* Battle Overlay */}
      <AnimatePresence>
        {isBattle && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-8"
          >
            <h2 className="text-5xl font-black text-red-500 mb-12 tracking-widest uppercase drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">
              Сражение
            </h2>
            
            <div className="flex items-center gap-12 w-full max-w-4xl justify-center">
              {/* Player 1 */}
              <div className="flex flex-col items-center gap-4">
                <div className="text-2xl font-bold text-teal-400">{context.players[0]?.name}</div>
                <div className="text-6xl font-black text-white">{calculatePlayerStrength(context.players[0])}</div>
                <div className="text-sm text-slate-400 uppercase tracking-widest">Сила</div>
              </div>
              
              <div className="text-4xl font-black text-slate-600 italic">VS</div>
              
              {/* Player 2 */}
              <div className="flex flex-col items-center gap-4">
                <div className="text-2xl font-bold text-teal-400">{context.players[1]?.name}</div>
                <div className="text-6xl font-black text-white">{calculatePlayerStrength(context.players[1])}</div>
                <div className="text-sm text-slate-400 uppercase tracking-widest">Сила</div>
              </div>
            </div>
            
            <button 
              onClick={() => send({ type: 'NEXT_PHASE' })} 
              className="mt-16 px-8 py-4 bg-red-600 hover:bg-red-500 text-white rounded-full font-bold text-xl transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:scale-105"
            >
              Узнать Победителя
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over Overlay */}
      <AnimatePresence>
        {state.matches('game_over') && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-8"
          >
            <h2 className="text-6xl font-black text-yellow-500 mb-8 tracking-widest uppercase drop-shadow-[0_0_20px_rgba(234,179,8,0.5)]">
              Игра Окончена
            </h2>
            <div className="text-2xl text-slate-300 mb-12">Финальный подсчет очков</div>
            
            <div className="flex gap-8 mb-12">
              {context.players.map((p: any) => {
                const finalGold = calculateFinalGold(p, context.players);
                return (
                  <div key={p.id} className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex flex-col items-center gap-4 min-w-[250px]">
                    <div className="text-xl font-bold text-teal-400">{p.name}</div>
                    <div className="text-5xl font-black text-yellow-400">{finalGold}G</div>
                    <div className="text-sm text-slate-400">Итоговое Золото</div>
                  </div>
                );
              })}
            </div>
            
            <button
              onClick={() => send({ type: 'RESTART_GAME' })}
              className="px-8 py-4 bg-teal-600 hover:bg-teal-500 text-white rounded-full font-bold text-xl transition-all shadow-[0_0_20px_rgba(13,148,136,0.4)] hover:scale-105"
            >
              Сыграть Снова
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </DndContext>
  );
}
