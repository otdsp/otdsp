'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import Image from 'next/image';

const basePath = process.env.NODE_ENV === 'production' ? '/otdsp' : '';

const slides = [
  {
    id: 1,
    bg: 'bg-[#0F172A]',
    img: `${basePath}/carousel-1.jpg`,
    textColor: 'text-white',
    title: 'OTDSP ajuda o município na <span class="text-cyan-400">transformação digital</span>',
    tag: '01 / HUB',
    tagBg: 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/30',
    boxBg: 'bg-slate-900/95 backdrop-blur-md'
  },
  {
    id: 2,
    bg: 'bg-cyan-500',
    img: `${basePath}/carousel-2.jpg`,
    textColor: 'text-white',
    title: 'Seja <span class="text-orange-500">Protagonista</span> de inovação na sua região',
    tag: '02 / INNOVATION',
    tagBg: 'bg-[#0F172A]/10 text-orange-400 border border-[#0F172A]/30',
    boxBg: 'bg-slate-900/95 border border-orange-500/50 backdrop-blur-md'
  },
  {
    id: 3,
    bg: 'bg-white',
    img: `${basePath}/carousel-3.jpg`,
    textColor: 'text-white',
    title: 'Tenha um polo <span class="text-slate-900">tecnológico USP</span> no seu município',
    tag: '03 / TECH',
    tagBg: 'bg-white/20 text-white border border-white/30',
    boxBg: 'bg-[#00A6FF]/95 backdrop-blur-md'
  }
];

const variants = {
  enter: (direction: number) => {
    return {
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    };
  },
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => {
    return {
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    };
  }
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

  return (
    <div className="relative w-[95%] md:w-full max-w-7xl mx-auto h-[60vh] md:h-[70vh] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-[#0F172A]/10 mt-6 z-10 group bg-slate-100 flex items-center justify-center">
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
          className={`absolute inset-0 flex flex-col justify-center px-10 md:px-24 ${slides[currentIndex].bg}`}
        >
          {slides[currentIndex].img && (
            <Image
              src={slides[currentIndex].img}
              alt="Slide Background"
              fill
              className="object-cover z-0"
              referrerPolicy="no-referrer"
            />
          )}

          <div className={`relative z-10 p-8 rounded-2xl shadow-2xl max-w-2xl ${slides[currentIndex].boxBg}`}>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider mb-6 ${slides[currentIndex].tagBg}`}
            >
              {slides[currentIndex].tag}
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className={`text-4xl md:text-5xl lg:text-6xl font-extrabold max-w-4xl leading-tight tracking-tight ${slides[currentIndex].textColor}`}
              dangerouslySetInnerHTML={{ __html: slides[currentIndex].title }}
            />
          </div>
          
          {/* Decorative shapes to maintain an immersive feel without being aggressive */}
          <div className="absolute right-[-10%] top-[-20%] w-96 h-96 rounded-full bg-white opacity-[0.03] blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[20%] w-64 h-64 rounded-full bg-black opacity-[0.03] blur-3xl pointer-events-none" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute right-6 bottom-6 md:right-12 md:bottom-12 flex gap-4 z-20">
        <button
          className="bg-white/20 hover:bg-white/40 backdrop-blur-md border border-white/30 text-white w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-lg"
          onClick={() => paginate(-1)}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          className="bg-white/20 hover:bg-white/40 backdrop-blur-md border border-white/30 text-white w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-lg"
          onClick={() => paginate(1)}
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      <div className="absolute left-6 bottom-6 md:left-12 md:bottom-12 flex gap-2 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              const direction = index > currentIndex ? 1 : -1;
              setPage([index, direction]);
            }}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentIndex ? "bg-white scale-125" : "bg-white/40 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
