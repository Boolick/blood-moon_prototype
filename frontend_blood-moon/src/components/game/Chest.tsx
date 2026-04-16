import { motion } from 'motion/react';
import { Package, PackageOpen } from 'lucide-react';
import { Chest as ChestType } from '../../entities/types';
import { cn } from '../../lib/utils';

interface ChestProps {
  key?: string | number;
  chest: ChestType;
  isActive?: boolean;
  onClick?: () => void;
}

export function Chest({ chest, isActive, onClick }: ChestProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "relative w-32 h-32 rounded-2xl flex flex-col items-center justify-center cursor-pointer border-2 transition-colors",
        "bg-slate-800/80 backdrop-blur-sm shadow-lg",
        isActive ? "border-teal-400 shadow-teal-500/20" : "border-slate-700 hover:border-slate-500",
        chest.isOpened ? "opacity-50" : "opacity-100"
      )}
    >
      {chest.isOpened ? (
        <PackageOpen size={48} className="text-yellow-500/50 mb-2" />
      ) : (
        <Package size={48} className="text-yellow-500 mb-2" />
      )}
      
      <div className="text-xs font-bold text-slate-300">
        {chest.isOpened ? "Открыт" : `${chest.cards?.length + 1 || 1} карт`}
      </div>
      
      {isActive && (
        <motion.div 
          layoutId="active-chest-indicator"
          className="absolute -bottom-2 w-12 h-1 bg-teal-400 rounded-full shadow-[0_0_8px_rgba(45,212,191,0.8)]"
        />
      )}
    </motion.div>
  );
}
