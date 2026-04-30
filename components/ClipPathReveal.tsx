"use client";
import { motion } from "motion/react";
import { ReactNode } from "react";

export default function ClipPathReveal({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <motion.div
        initial={{ clipPath: "inset(0 100% 0 0)", scale: 1.2 }}
        whileInView={{ clipPath: "inset(0 0% 0 0)", scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }} 
        className="w-full h-full relative"
      >
        {children}
      </motion.div>
    </div>
  );
}
