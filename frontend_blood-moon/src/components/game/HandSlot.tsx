import { useDroppable } from '@dnd-kit/core';
import { cn } from '../../lib/utils';
import { ReactNode } from 'react';

export function HandSlot({ children, className }: { children: ReactNode, className?: string }) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'hand-zone',
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex gap-3 overflow-x-auto pb-2 items-end min-h-[12rem] transition-colors rounded-xl p-2",
        isOver ? "bg-slate-800/50 ring-2 ring-teal-500/50" : "",
        className
      )}
    >
      {children}
    </div>
  );
}
