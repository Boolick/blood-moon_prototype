import { useMachine } from '@xstate/react';
import { gameMachine } from './machines/gameMachine';
import { GameBoard } from './components/game/GameBoard';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect } from 'react';

export default function App() {
  const [state, send] = useMachine(gameMachine);

  return (
    <div className="atlantis-root min-h-screen bg-slate-950 text-slate-50 font-sans overflow-hidden relative selection:bg-teal-500/30">
      {/* Background ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(13,148,136,0.15),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(234,179,8,0.05),transparent_50%)] pointer-events-none" />

      <AnimatePresence mode="wait">
        {state.value === 'lobby' && (
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
              onClick={() => send({ type: 'START_GAME' })}
              className="px-8 py-4 bg-teal-600 hover:bg-teal-500 text-white rounded-full font-bold text-lg transition-all hover:shadow-[0_0_20px_rgba(13,148,136,0.5)] hover:-translate-y-1 active:translate-y-0"
            >
              Войти во Дворец
            </button>
          </motion.div>
        )}

        {state.value !== 'lobby' && (
          <motion.div 
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-screen w-full relative z-10"
          >
            <GameBoard state={state} send={send} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
