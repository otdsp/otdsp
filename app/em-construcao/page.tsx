'use client';

import { Suspense } from 'react';
import { motion } from 'motion/react';
import { Settings } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function EmConstrucaoContent() {
  const searchParams = useSearchParams();
  const section = searchParams.get('s') || 'default';

  return (
    <motion.div 
      key={section}
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative z-10 w-full max-w-xl bg-white/70 backdrop-blur-xl border border-white p-10 md:p-14 rounded-3xl shadow-xl shadow-slate-900/10 flex flex-col items-center text-center"
    >
      <div className="mb-8">
        <Settings className="w-24 h-24 stroke-[1.5] text-cyan-500/80 drop-shadow-md animate-[spin_10s_linear_infinite]" />
      </div>
      
      <h1 className="text-3xl md:text-5xl font-extrabold text-[#0F172A] tracking-tight mb-4">
        Página em <span className="bg-gradient-to-r from-cyan-500 to-orange-500 bg-clip-text text-transparent">Construção</span>
      </h1>
      
      <p className="text-base md:text-lg text-slate-500 font-medium mb-10 leading-relaxed">
        Estamos trabalhando para trazer novas soluções para os municípios paulistas em breve.
      </p>

      <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
        <Link href="/" className="inline-block px-8 py-3.5 bg-[#0F172A] text-white font-semibold rounded-full shadow-lg shadow-slate-900/20 hover:bg-cyan-600 hover:shadow-cyan-600/30 transition-all duration-300">
          Voltar para o Início
        </Link>
      </motion.div>
    </motion.div>
  );
}

export default function EmConstrucaoPage() {
  return (
    <div className="min-h-screen relative w-full flex items-center justify-center overflow-hidden bg-[#F8FAFC] text-slate-800 font-sans p-4">
      {/* Soft Background Gradients */}
      <div className="absolute inset-0 z-0 pointer-events-none blur-[120px] mix-blend-multiply opacity-20">
        <div className="absolute top-[20%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-cyan-200" />
        <div className="absolute bottom-[20%] right-[20%] w-[30vw] h-[30vw] rounded-full bg-orange-100" />
      </div>

      <Suspense fallback={<div className="opacity-0">Carregando...</div>}>
        <EmConstrucaoContent />
      </Suspense>
    </div>
  );
}
