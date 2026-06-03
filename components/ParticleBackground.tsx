/* eslint-disable */
'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, useTransform, MotionValue } from 'motion/react';

interface Particle {
  id: number;
  startX: number;
  startY: number;
  moveX: number;
  moveY: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
}

export function ParticleBackground({ mouseX, mouseY }: { mouseX: MotionValue<number>, mouseY: MotionValue<number> }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const newParticles: Particle[] = [];
    // Navy, Cyan, Orange, Slate
    const colors = ['#0F172A', '#06b6d4', '#f97316', '#cbd5e1'];
    
    for (let i = 0; i < 40; i++) {
        // Distribution across viewport + some padding
      newParticles.push({
        id: i,
        startX: Math.random() * 100, // vw
        startY: Math.random() * 100, // vh
        moveX: (Math.random() - 0.5) * 150, // px distance
        moveY: (Math.random() - 0.5) * 150, // px distance
        size: Math.random() * 3 + 1, // 1px to 4px
        color: colors[Math.floor(Math.random() * colors.length)],
        duration: Math.random() * 25 + 20,
        delay: Math.random() * -30,
      });
    }
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 z-[0] pointer-events-none overflow-hidden mix-blend-multiply opacity-20">
      {particles.map((p) => (
        <Particle key={p.id} p={p} mouseX={mouseX} mouseY={mouseY} />
      ))}
    </div>
  );
}

function Particle({ p, mouseX, mouseY }: { p: Particle, mouseX: MotionValue<number>, mouseY: MotionValue<number> }) {
  // Parallax responds to mouseX / mouseY from parent
  const parallaxX = useTransform(mouseX, [-50, 50], [-p.size * 5, p.size * 5]);
  const parallaxY = useTransform(mouseY, [-50, 50], [-p.size * 5, p.size * 5]);

  return (
    <motion.div
      className="absolute"
      style={{
        left: `${p.startX}vw`,
        top: `${p.startY}vh`,
        x: parallaxX,
        y: parallaxY,
      }}
    >
      <motion.div
        className="rounded-full"
        style={{
          width: p.size,
          height: p.size,
          backgroundColor: p.color,
          boxShadow: `0 0 ${p.size * 2}px ${p.color}80, 0 0 ${p.size * 4}px ${p.color}40`,
        }}
        animate={{
          x: [0, p.moveX, 0],
          y: [0, p.moveY, 0],
          opacity: [0.3, 0.7, 0.3],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: p.duration,
          delay: p.delay,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  );
}