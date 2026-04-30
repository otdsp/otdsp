"use client";
import { motion } from "motion/react";
import { ReactNode } from "react";

export default function AnimatedSection({ 
  children, 
  id, 
  className = "" 
}: { 
  children: ReactNode, 
  id?: string, 
  className?: string 
}) {
  return (
    <motion.section
      id={id}
      className={`py-20 ${className}`}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      {children}
    </motion.section>
  );
}
