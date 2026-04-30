"use client";
import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

export default function MagneticCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const springConfig = { stiffness: 300, damping: 20, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const rotateX = useTransform(smoothY, [0, 1], ["12deg", "-12deg"]);
  const rotateY = useTransform(smoothX, [0, 1], ["-12deg", "12deg"]);

  const glareX = useTransform(smoothX, [0, 1], ["-20%", "120%"]);
  const glareY = useTransform(smoothY, [0, 1], ["-20%", "120%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", perspective: 1200 }}
      className={`relative group ${className}`}
    >
      {children}
      <motion.div
        className="pointer-events-none absolute inset-0 z-50 mix-blend-overlay rounded-inherit"
        style={{
          x: useTransform(glareX, (x) => `calc(${x} - 50%)`),
          y: useTransform(glareY, (y) => `calc(${y} - 50%)`),
          width: "200%", height: "200%",
          background: "radial-gradient(circle at center, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 40%)",
          opacity: isHovered ? 1 : 0,
          transition: "opacity 0.4s ease",
        }}
      />
    </motion.div>
  );
}
