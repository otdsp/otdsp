'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

const basePath = process.env.__NEXT_ROUTER_BASEPATH || '';

const slides = [
  { id: 1, type: 'banner1' },
  { id: 2, type: 'banner2' },
  { id: 3, type: 'banner3' },
  { id: 4, type: 'banner4' }
];

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 1000 : -1000,
    opacity: 0
  })
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

export default function Carousel() {
  const [[page, direction], setPage] = useState([0, 0]);

  const currentIndex = Math.abs(page % slides.length);

  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      paginate(1);
    }, 6000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const renderSlide = (slide: typeof slides[0]) => {
    switch (slide.type) {
      case 'banner1':
        return (
          <div className="absolute inset-0 flex flex-col md:block overflow-hidden bg-slate-900">
            <div className="relative w-full h-[320px] md:h-full md:absolute md:inset-0 z-0 p-4 md:p-0">
              <Image 
                src={`${basePath}/banner1-bg.jpg`} 
                alt="Alunos Atípicos Background" 
                fill 
                className="object-contain md:object-cover object-center z-0"
                referrerPolicy="no-referrer"
                priority
              />
            </div>
            {/* Box: Canto Inferior Esquerdo */}
            <div className="absolute bottom-4 left-0 right-0 px-4 z-10 md:w-auto md:h-auto md:bottom-12 md:left-12 flex items-center justify-center md:p-0 md:block">
              <div className="-translate-y-[15%] md:translate-y-0 w-full bg-cyan-400/95 backdrop-blur-md p-8 py-10 md:p-12 rounded-3xl shadow-2xl md:max-w-md border border-cyan-300/50">
                 <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight">
                   Projetos pensados para alunos atípicos
                 </h2>
              </div>
            </div>
          </div>
        );
      case 'banner2':
        return (
          <div className="absolute inset-0 flex flex-col md:block overflow-hidden bg-cyan-700 md:bg-cyan-500">
            <div className="relative w-full h-[320px] md:h-full md:absolute md:inset-0 z-0 p-4 md:p-0">
              <Image 
                src={`${basePath}/banner2-photo.jpg`} 
                alt="Letramento Digital Fotografia" 
                fill 
                className="object-contain md:object-cover object-center z-0" 
                referrerPolicy="no-referrer" 
              />
              {/* Watermark */}
              <div className="absolute inset-0 opacity-10 z-0 pointer-events-none">
                 <Image src={`${basePath}/watermark.png`} alt="Watermark pattern" fill className="object-cover" referrerPolicy="no-referrer" />
              </div>
            </div>

            {/* Logo: Canto Superior Esquerdo */}
            <div className="absolute top-6 left-6 md:top-8 md:left-12 z-20 bg-orange-500 p-2 md:px-4 md:py-2 font-bold text-white rounded-xl shadow-lg border border-orange-400/50">
               <Image src={`${basePath}/inova-logo.png`} alt="Inova Logo" width={140} height={45} className="w-20 md:w-[140px] h-auto md:h-[45px] object-contain" referrerPolicy="no-referrer" />
            </div>
            
            {/* Box: Canto Inferior Esquerdo */}
            <div className="absolute bottom-4 left-0 right-0 px-4 z-10 md:w-auto md:h-auto md:bottom-12 md:left-12 flex items-center justify-center md:p-0 md:block">
              <div className="-translate-y-[15%] md:translate-y-0 w-full bg-blue-950 p-6 md:p-10 lg:p-12 rounded-3xl shadow-2xl md:max-w-md">
                <h2 className="text-xl md:text-4xl lg:text-5xl font-extrabold text-white mb-3 md:mb-6 leading-tight">
                  Inclusão e Letramento Digital <span className="text-cyan-400">para Municípios</span>
                </h2>
                <p className="text-slate-300 text-sm md:text-lg lg:text-xl font-medium leading-relaxed">
                  Projeto da USP voltado para o acesso à tecnologia e desenvolvimento de jovens em municípios.
                </p>
              </div>
            </div>
          </div>
        );
      case 'banner3':
        return (
          <div className="absolute inset-0 flex flex-col md:block overflow-hidden bg-slate-200 md:bg-slate-100">
            <div className="relative w-full h-[320px] md:h-full md:absolute md:inset-0 z-0 p-4 md:p-0">
              <Image 
                src={`${basePath}/banner3-photo.jpg`} 
                alt="Ventilador USP Fotografia" 
                fill 
                className="object-contain md:object-cover object-center md:object-bottom z-0" 
                referrerPolicy="no-referrer" 
              />
              {/* Watermark */}
              <div className="absolute inset-0 opacity-[0.03] z-0 pointer-events-none">
                 <Image src={`${basePath}/watermark.png`} alt="Watermark pattern" fill className="object-cover mix-blend-multiply" referrerPolicy="no-referrer" />
              </div>
            </div>

            {/* Logo: Canto Superior Direito */}
            <div className="absolute top-6 right-6 md:top-8 md:right-12 z-20 bg-orange-500 text-white font-bold p-2 md:px-4 md:py-2 rounded-xl shadow-lg border border-orange-400/50">
               <Image src={`${basePath}/inova-logo.png`} alt="Inova Logo" width={140} height={45} className="w-20 md:w-[140px] h-auto md:h-[45px] object-contain" referrerPolicy="no-referrer" />
            </div>
            
            {/* Box: Canto Inferior Esquerdo */}
            <div className="absolute bottom-4 left-0 right-0 px-4 z-10 md:w-auto md:h-auto md:bottom-12 md:left-12 flex items-center justify-center md:p-0 md:block">
              <div className="-translate-y-[15%] md:translate-y-0 w-full bg-blue-950/95 backdrop-blur-md p-6 md:p-8 lg:p-10 rounded-3xl shadow-2xl md:max-w-2xl lg:max-w-4xl border border-blue-800/50 max-h-full overflow-y-auto custom-scrollbar">
                <h2 className="text-xl md:text-3xl lg:text-4xl font-extrabold text-white leading-tight">
                  Este Ventilador, desenvolvido aqui na USP, impactou <span className="text-cyan-400">219 Municípios</span> e custou <span className="text-orange-400">1/7 dos ventiladores do mercado</span>
                </h2>
              </div>
            </div>
          </div>
        );
      case 'banner4':
        return (
          <div className="absolute inset-0 flex flex-col md:block overflow-hidden bg-slate-900">
            <div className="relative w-full h-[320px] md:h-full md:absolute md:inset-0 z-0 p-4 md:p-0">
              <Image 
                src={`${basePath}/banner4-bg.jpg`} 
                alt="SciBiz Event Background" 
                fill 
                className="object-contain md:object-cover md:object-[center_20%] z-0" 
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Box de Texto */}
            <div className="absolute bottom-4 left-0 right-0 px-4 z-10 md:w-auto md:h-auto md:bottom-12 md:left-12 flex items-center justify-center md:p-0 md:block">
              <div className="-translate-y-[15%] md:translate-y-0 w-full bg-blue-950/95 backdrop-blur-md p-6 md:p-8 lg:p-10 rounded-3xl shadow-2xl md:max-w-2xl lg:max-w-4xl border border-blue-800/50 max-h-full overflow-y-auto custom-scrollbar">
                <h2 className="text-xl md:text-3xl lg:text-4xl font-extrabold text-white mb-2 lg:mb-4 leading-tight tracking-tight">
                  Nossa participação na SciBiz 26
                </h2>
                <p className="text-slate-300 text-sm md:text-base lg:text-lg font-medium leading-relaxed">
                  Uma iniciativa para unir Ciência e Empreendedorismo, conectando Startups, Indústria, USP e Investidores em um só lugar.
                </p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="relative w-full max-w-7xl mx-auto h-[520px] md:min-h-[600px] md:h-[70vh] lg:h-[75vh] rounded-none md:rounded-[2.5rem] overflow-hidden shadow-2xl shadow-[#0F172A]/10 mt-0 z-10 group bg-slate-100">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={page}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = swipePower(offset.x, velocity.x);
            if (swipe < -swipeConfidenceThreshold) {
              paginate(1);
            } else if (swipe > swipeConfidenceThreshold) {
              paginate(-1);
            }
          }}
          className="absolute inset-0"
          style={{ height: '100%' }}
        >
          {renderSlide(slides[currentIndex])}
        </motion.div>
      </AnimatePresence>

      {/* NAVEGAÇÃO: SETAS LATERAIS (Mapeadas no centro vertical para não cobrir os textos) */}
      <div className="absolute inset-y-0 w-full flex items-center justify-between px-4 md:px-6 z-20 pointer-events-none">
        <button
          className="pointer-events-auto bg-slate-900/20 hover:bg-slate-900/50 backdrop-blur-md border border-white/20 text-white w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all shadow-lg"
          onClick={() => paginate(-1)}
          aria-label="Slide anterior"
        >
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <button
          className="pointer-events-auto bg-slate-900/20 hover:bg-slate-900/50 backdrop-blur-md border border-white/20 text-white w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all shadow-lg"
          onClick={() => paginate(1)}
          aria-label="Próximo slide"
        >
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      </div>

      {/* NAVEGAÇÃO: DOTS (Centralizados na base para não conflitar com os textos nos cantos) */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-6 md:bottom-8 flex gap-2 md:gap-3 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              const direction = index > currentIndex ? 1 : -1;
              setPage([index, direction]);
            }}
            aria-label={`Ir para o slide ${index + 1}`}
            className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full transition-all duration-300 shadow-sm ${
              index === currentIndex ? "bg-white scale-125 border border-slate-200" : "bg-white/40 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}