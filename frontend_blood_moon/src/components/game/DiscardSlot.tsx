import { useDroppable } from '@dnd-kit/core';
import { cn } from '../../lib/utils';
import { Trash2 } from 'lucide-react';

export function DiscardSlot() {
  const { isOver, setNodeRef } = useDroppable({
    id: 'discard-zone',
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative w-28 h-44 rounded-xl border-2 border-dashed flex items-center justify-center transition-colors shrink-0",
        isOver ? "border-red-500 bg-red-500/20 text-red-400" : "border-slate-700 bg-slate-800/30 text-slate-500"
      )}
    >
      <div className="flex flex-col items-center gap-2">
        <Trash2 size={24} />
        <span className="text-[10px] font-bold uppercase tracking-wider">Сброс</span>
      </div>
    </div>
  );
}
