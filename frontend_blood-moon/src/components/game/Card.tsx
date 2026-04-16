import { motion } from 'motion/react';
import { Heart, Sword, Coins, Clock, Target } from 'lucide-react';
import { GameCard, CardType } from '../../entities/types';
import { cn } from '../../lib/utils';
import { useDraggable } from '@dnd-kit/core';

interface CardProps {
  key?: string | number;
  card: GameCard;
  layoutId?: string;
  className?: string;
  onClick?: () => void;
  isDraggable?: boolean;
}

export function Card({ card, layoutId, className, onClick, isDraggable = false }: CardProps) {
  const isTreasure = card.type === CardType.TREASURE;
  const isConsumable = card.type === CardType.CONSUMABLE;
  const isTimer = card.type === CardType.TIMER;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
    data: { card },
    disabled: !isDraggable,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 50 : undefined,
  } : undefined;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      layoutId={layoutId}
      onClick={onClick}
      className={cn(
        "relative w-32 h-44 rounded-xl p-3 flex flex-col gap-2 cursor-pointer select-none shrink-0",
        "bg-slate-900/60 backdrop-blur-md border shadow-xl transition-all hover:-translate-y-2 hover:shadow-2xl",
        isTreasure && "border-yellow-500/50 shadow-yellow-900/20",
        isConsumable && "border-slate-300/50 shadow-slate-700/20",
        isTimer && "border-red-500/50 shadow-red-900/20 animate-pulse",
        !isTreasure && !isConsumable && !isTimer && "border-teal-500/30 shadow-teal-900/20",
        isDragging && "opacity-50 shadow-2xl scale-105 rotate-3",
        className
      )}
    >
      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-700/50 pb-1">
        {card.type}
      </div>
      <div className="font-semibold text-sm text-slate-100 leading-tight flex-1 mt-1">
        {card.name}
      </div>
      
      <div className="text-[10px] text-slate-300 flex-1 overflow-hidden">
        {card.description}
      </div>

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-700/50">
        {card.type === CardType.CHARACTER && (
          <>
            <div className="flex items-center gap-1 text-red-400"><Heart size={14} /> {card.maxHealth}</div>
            <div className="flex items-center gap-1 text-teal-400"><Sword size={14} /> {card.baseStrength}</div>
          </>
        )}
        {card.type === CardType.TREASURE && (
          <>
            <div className="flex items-center gap-1 text-teal-400"><Sword size={14} /> +{card.strengthBonus}</div>
            <div className="flex items-center gap-1 text-yellow-400"><Coins size={14} /> {card.goldValue}</div>
          </>
        )}
        {card.type === CardType.TIMER && (
          <div className="flex items-center gap-1 text-red-500 w-full justify-center">
            <Clock size={16} /> {card.timerModifier}
          </div>
        )}
        {card.type === CardType.OBJECTIVE && (
          <div className="flex items-center gap-1 text-purple-400 w-full justify-center">
            <Target size={16} /> {card.objectiveType}
          </div>
        )}
      </div>
    </motion.div>
  );
}
