import { GameBoard } from './components/game/GameBoard';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect } from 'react';
import { useSocketStore } from './lib/socket-store';

export default function App() {
  const { state, connect, sendIntent } = useSocketStore();

  useEffect(() => {
    connect('ws://localhost:8080');
  }, [connect]);

  if (!state) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-teal-500 animate-pulse">Подключение к Дворцу...</div>
      </div>
    );
  }

  const phase = state.phase;

  const mockState = {
    context: state,
    value: phase,
    matches: (p: string) => phase === p,
    can: (event: any) => {
      if (phase === 'rest_phase' && event.type === 'END_ROUND') {
        const p1 = state.players.find(p => p.id === 'p1');
        return (p1?.inventory?.hand?.length || 0) <= 3;
      }
      return true;
    }
  };

  return (
    <div className="atlantis-root min-h-screen bg-slate-950 text-slate-50 font-sans overflow-hidden relative selection:bg-teal-500/30">
      {/* Background ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(13,148,136,0.15),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(234,179,8,0.05),transparent_50%)] pointer-events-none" />

      <AnimatePresence mode="wait">
        {phase === 'lobby' && (
          <motion.div 
            key="lobby"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="flex flex-col items-center justify-center min-h-screen gap-8 z-10 relative"
          >
            <div className="text-center space-y-4">
              <h1 className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-teal-300 via-teal-500 to-slate-500 drop-shadow-sm">
                ДВОРЕЦ АТЛАНТИДЫ
              </h1>
              <p className="text-xl text-slate-400 font-light tracking-wide">Битва за Сундуки</p>
            </div>
            
            <button 
              onClick={() => sendIntent({ type: 'START_GAME' })}
              className="px-8 py-4 bg-teal-600 hover:bg-teal-500 text-white rounded-full font-bold text-lg transition-all hover:shadow-[0_0_20px_rgba(13,148,136,0.5)] hover:-translate-y-1 active:translate-y-0"
            >
              Войти во Дворец
            </button>
          </motion.div>
        )}

        {phase !== 'lobby' && (
          <motion.div 
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-screen w-full relative z-10"
          >
            <GameBoard state={mockState as any} send={sendIntent} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
