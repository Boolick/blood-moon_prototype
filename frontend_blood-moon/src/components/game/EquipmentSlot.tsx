import { useDroppable } from '@dnd-kit/core';
import { cn } from '../../lib/utils';
import { Shield } from 'lucide-react';
import React from 'react';

interface EquipmentSlotProps {
  id: string;
  children?: React.ReactNode;
  isFull?: boolean;
}

export function EquipmentSlot({ id, children, isFull }: EquipmentSlotProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    disabled: isFull,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative min-w-[9rem] h-44 rounded-xl border-2 border-dashed flex items-center justify-center transition-colors p-2 gap-2 shrink-0",
        isOver && !isFull ? "border-teal-400 bg-teal-400/10" : "border-slate-700 bg-slate-800/30",
        isFull && "border-solid border-slate-600 bg-transparent"
      )}
    >
      {React.Children.count(children) > 0 ? (
        children
      ) : (
        <div className="flex flex-col items-center gap-2 text-slate-500 absolute">
          <Shield size={24} />
          <span className="text-xs font-bold uppercase tracking-wider">Экипировка</span>
        </div>
      )}
    </div>
  );
}
