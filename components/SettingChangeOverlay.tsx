"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';

export const getAiAvatarUrl = (avatar: string) => {
  switch (avatar) {
    case 'sakura':
      return 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sakura&eyebrows=defaultNatural&mouth=smile&hair=longButNotTooLong&hairColor=pink';
    case 'ansh':
      return 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ansh&eyebrows=default&mouth=smile&hair=shortCurly&hairColor=black';
    case 'mary':
      return 'https://api.dicebear.com/7.x/bottts/svg?seed=Mary&eyes=happy&mouth=smile&texture=grid';
    case 'classic':
    default:
      return '/jarvis-character.png';
  }
};

const getAnimationConfig = (type: string, value: string, aiName: string) => {
  switch (type) {
    case 'font':
      return {
        emojis: ['✍️', '🎨', '✨', 'A', 'B', 'C', 'D', 'E'],
        phrases: [
          "Summoning the calligraphy spirits... 🧚‍♀️",
          "Rewriting database letters... 🧱",
          "Applying typography magic! 💫"
        ],
        avatarAnim: {
          rotate: [0, 360],
          scale: [1, 1.15, 0.95, 1],
        }
      };
    case 'size':
      return {
        emojis: ['🔍', '🔎', '📈', '➕', '↕️', '📏', '📉'],
        phrases: [
          "Stretching the parchment paper... 📜",
          "Telescoping all the sentences... 🔭",
          "Adjusting magnifying glass to " + value + "px... 🔍"
        ],
        avatarAnim: {
          scale: [1, 1.35, 0.75, 1],
          y: [0, -15, 10, 0]
        }
      };
    case 'avatar':
      return {
        emojis: ['🎭', '👕', '💅', '🧬', '👗', '🕶️', '✨'],
        phrases: [
          `Reweaving ${aiName}'s digital particles... 🧬`,
          "Dressing up in fancy clean clothes... 👕",
          "Evolution completed successfully! ✨"
        ],
        avatarAnim: {
          rotateY: [0, 720],
          scale: [1, 1.25, 0.8, 1],
        }
      };
    case 'voice':
    case 'language':
      return {
        emojis: ['🗣️', '🎙️', '💬', '🔊', '🎧', '🎵', '🎶'],
        phrases: [
          `Clearing ${aiName}'s vocal cords... 🗣️`,
          "Aligning voice synthesizer metrics... 🎙️",
          "Dialect fully synchronized! 🔊"
        ],
        avatarAnim: {
          scale: [1, 1.05, 1, 1.1, 1],
          x: [0, -5, 5, -5, 0],
        }
      };
    default:
      return {
        emojis: ['⚙️', '🔧', '⚡', '⚙️', '🤖', '🔋'],
        phrases: [
          "Reconfiguring local system properties... ⚙️",
          "Aligning the matrix cogwheels... 🔧",
          "Settings synchronized! ⚡"
        ],
        avatarAnim: {
          y: [0, -10, 0, -10, 0],
          rotate: [0, 15, -15, 0]
        }
      };
  }
};

export function SettingChangeOverlay() {
  const { settingChangeAnimation, aiName, aiAvatar } = useApp();
  const [phraseIdx, setPhraseIdx] = useState(0);

  useEffect(() => {
    if (settingChangeAnimation?.active) {
      setPhraseIdx(0);
      const t1 = setTimeout(() => setPhraseIdx(1), 2500);
      const t2 = setTimeout(() => setPhraseIdx(2), 5000);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [settingChangeAnimation]);

  if (!settingChangeAnimation?.active) return null;

  const config = getAnimationConfig(
    settingChangeAnimation.type,
    settingChangeAnimation.value,
    aiName
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/35 backdrop-blur-md pointer-events-auto select-none overflow-hidden"
      >
        {/* Animated background gradient orbs */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <motion.div
            animate={{
              x: [-120, 120, -120],
              y: [-80, 80, -80],
              scale: [1, 1.25, 0.9, 1],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 blur-3xl"
          />
          <motion.div
            animate={{
              x: [120, -120, 120],
              y: [80, -80, 80],
              scale: [1.2, 0.95, 1.2],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 blur-3xl"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ type: "spring", damping: 25, stiffness: 220 }}
          className="relative max-w-sm w-full mx-4 p-8 bg-white/70 backdrop-blur-xl border-2 border-[#2d2d2d] rounded-2xl shadow-2xl flex flex-col items-center justify-center font-kalam text-center border-dashed pointer-events-auto"
        >
          {/* Floating decorative elements */}
          {config.emojis.map((emoji, idx) => (
            <motion.span
              key={idx}
              initial={{ 
                opacity: 0, 
                y: 30, 
                x: (Math.random() - 0.5) * 80, 
                scale: 0.6 
              }}
              animate={{ 
                opacity: [0, 1, 1, 0], 
                y: -120, 
                x: (Math.random() - 0.5) * 120, 
                scale: [0.6, 1.2, 1, 0.8],
                rotate: (Math.random() - 0.5) * 60
              }}
              transition={{ 
                duration: 2.2, 
                delay: idx * 0.25, 
                repeat: Infinity,
                ease: "easeOut"
              }}
              className="absolute text-2xl pointer-events-none select-none"
              style={{ bottom: "80px" }}
            >
              {emoji}
            </motion.span>
          ))}

          {/* Morphing Avatar Wrapper */}
          <div className="relative w-32 h-32 flex items-center justify-center mb-6">
            <motion.div
              animate={{
                borderRadius: [
                  "48% 52% 55% 45% / 55% 45% 48% 52%",
                  "52% 48% 40% 60% / 40% 60% 52% 48%",
                  "45% 55% 50% 50% / 50% 50% 45% 55%",
                  "48% 52% 55% 45% / 55% 45% 48% 52%"
                ],
                rotate: 360
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-2 border-2 border-dashed border-[#2d2d2d]/30"
            />
            
            <motion.div
              animate={config.avatarAnim}
              transition={{ duration: 2.5, ease: "easeInOut" }}
              className="w-28 h-28 rounded-full bg-white border-2 border-[#2d2d2d] flex items-center justify-center p-2 shadow-md overflow-hidden relative"
            >
              <img 
                src={getAiAvatarUrl(aiAvatar)} 
                alt={aiName} 
                className="w-20 h-20 object-contain"
              />
            </motion.div>
          </div>

          {/* Animating Status Message */}
          <div className="h-14 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={phraseIdx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="text-lg font-bold text-[#2d2d2d] leading-snug"
              >
                {config.phrases[phraseIdx]}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Subtle note of value/appreciation */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 0.6 }}
            className="text-xs text-[#5a5a5a] italic mt-2"
          >
            "We value your experience, reshaping the notebook... ✨"
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
