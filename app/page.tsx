'use client';

import { useEffect, useRef, MouseEvent, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import gsap from 'gsap';
import { ParticleBackground } from '../components/ParticleBackground';
import Carousel from '../components/Carousel';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Box, Layers, Activity, CheckCircle, MapPin, GraduationCap, Landmark, Microscope, Briefcase, Target, HeartPulse, BookOpen, ShieldCheck, Leaf, Pencil, Map } from 'lucide-react';
import Image from 'next/image';

const basePath = process.env.NODE_ENV === 'production' ? '/otdsp' : '';

// -----------------------------------------------------------------------------
// Soluções Strategy Block (using Case style)
// -----------------------------------------------------------------------------
function SolucaoBlock({ imageSrc, title, description, category, categoryColor, theme, align = 'left', className = '', Icon }: any) {
  return (
    <div className={`case-block relative w-full md:w-11/12 xl:w-4/5 h-[450px] md:h-[500px] rounded-3xl overflow-hidden shadow-2xl flex items-center ${align === 'left' ? 'mr-auto' : 'ml-auto'} ${className}`}>
      
      {/* Background Image */}
      <Image 
        src={imageSrc} 
        alt={title} 
        fill 
        style={{ objectFit: 'cover' }}
        className="absolute inset-0 w-full h-full z-0" 
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-slate-900/20 z-10" />

      {/* Floating Text Card */}
      <div className={`case-text relative z-20 bg-white rounded-2xl shadow-xl p-8 max-w-lg md:max-w-xl mx-8 ${align === 'left' ? 'mr-auto' : 'ml-auto'}`}>
        <div className={`flex items-center gap-2 font-semibold text-xs mb-4 inline-flex px-3 py-1.5 rounded-full w-fit ${categoryColor}`}>
          <Icon className="w-4 h-4" />
          {category}
        </div>
        <h3 className="text-xl md:text-2xl font-semibold mb-3 text-slate-900 leading-tight">{title}</h3>
        <div className="text-sm md:text-base text-slate-600 leading-relaxed">{description}</div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main Page Component
// -----------------------------------------------------------------------------
export default function Page() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Hero Background Warp State
  const bgX = useMotionValue(0);
  const bgY = useMotionValue(0);
  const smoothBgX = useSpring(bgX, { stiffness: 50, damping: 20 });
  const smoothBgY = useSpring(bgY, { stiffness: 50, damping: 20 });

  const handleGlobalMouseMove = (e: MouseEvent) => {
    const { clientX, clientY } = e;
    const normX = (clientX / (typeof window !== 'undefined' ? window.innerWidth : 1000)) - 0.5;
    const normY = (clientY / (typeof window !== 'undefined' ? window.innerHeight : 1000)) - 0.5;
    bgX.set(normX * 100);
    bgY.set(normY * 100);
  };

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      // 1. Case Blocks Parallax & Scale Scrub
      gsap.utils.toArray('.case-block').forEach((block: any) => {
        gsap.fromTo(block, 
          { scale: 0.9, opacity: 0.4 },
          {
            scale: 1, 
            opacity: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: block,
              start: 'top bottom',
              end: 'center center',
              scrub: 1,
            }
          }
        );

        const textContent = block.querySelector('.case-text');
        gsap.fromTo(textContent,
          { y: 150 },
          {
            y: -150,
            ease: 'none',
            scrollTrigger: {
              trigger: block,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1,
            }
          }
        );
      });

      // 2. (Removed Dor Blocks Scrub Animation - Solucoes overlap with Case GSAP hooks)

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div 
      className="min-h-screen relative w-full overflow-hidden bg-[#F8FAFC] text-slate-800 selection:bg-cyan-100 selection:text-cyan-900 font-sans" 
      ref={containerRef}
      onMouseMove={handleGlobalMouseMove}
    >
      {/* Dynamic Warping Background Effect (Subtle, clean) */}
      <motion.div 
        className="fixed inset-0 z-[-1] pointer-events-none blur-[120px] mix-blend-multiply opacity-30"
        style={{ x: smoothBgX, y: smoothBgY }}
      >
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-200" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-orange-100" />
        <div className="absolute top-[40%] left-[30%] w-[30vw] h-[30vw] rounded-full bg-slate-200" />
      </motion.div>

      {/* Grid Pattern Background */}
      <motion.div
         animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
         transition={{ duration: 30, repeat: Infinity, repeatType: "mirror" }}
         className="fixed inset-0 z-[-2] pointer-events-none"
         style={{ backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />
      
      <ParticleBackground mouseX={smoothBgX} mouseY={smoothBgY} />

      {/* 1. The Header / Hero Area */}
      <section className="relative w-full pt-24 md:pt-28 px-4 max-w-7xl mx-auto flex flex-col z-20">
        {/* Carousel Full Width */}
        <Carousel />
      </section>

      {/* 2. Data & Statistics Section */}
      <section className="relative w-full py-16 my-10 px-4 max-w-7xl mx-auto z-20">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 w-full">
          {[
            { icon: MapPin, num: "+60", text: "Municípios Impactados" },
            { icon: GraduationCap, num: "+90", text: "Jovens no Letramento Digital" },
            { icon: Landmark, num: "+2", text: "Frentes Parlamentares mobilizadas na ALESP" },
            { icon: Microscope, num: "+10", text: "Laboratórios USP Conectados" },
            { icon: Briefcase, num: "+14", text: "Projetos USP Incorporados no convênio" }
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white/70 backdrop-blur-xl border border-white p-8 rounded-2xl shadow-lg shadow-slate-900/5 flex flex-col items-center justify-center text-center transition-shadow hover:shadow-2xl hover:shadow-cyan-900/10"
              >
                <div className="bg-cyan-50 p-4 rounded-full mb-4 text-cyan-600">
                  <Icon className="w-8 h-8" />
                </div>
                <h3 className="text-4xl font-extrabold bg-gradient-to-r from-cyan-500 to-orange-500 bg-clip-text text-transparent tracking-tighter mb-2">{item.num}</h3>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">{item.text}</p>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* 3. Case Blocks - Stacked vertically scrub scaling */}
      <section className="relative w-full pt-10 pb-20 max-w-7xl mx-auto px-4">
        <div className="text-center mb-16 px-4">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight text-[#0F172A]">Casos de Sucesso</h2>
          <p className="text-base md:text-lg text-slate-500 font-medium max-w-2xl mx-auto">Impacto real e transformação comprovada nos municípios.</p>
        </div>

        <div className="flex flex-col items-center gap-24 md:gap-32 w-full">
           {/* CASE 1 */}
        <div className="case-block relative w-full h-auto p-6 md:p-16 lg:p-20 shadow-2xl shadow-slate-900/5 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white">
          {/* Text Column (Left) */}
          <div className="flex flex-col justify-center">
            <span className="flex items-center gap-2 bg-cyan-100 text-cyan-900 px-4 py-1.5 rounded-full text-sm font-semibold mb-6 inline-flex w-fit">
              <Pencil className="w-4 h-4" />
              Inclusão Científica
            </span>
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight mb-8">
              Programa EDUCA + INOVAUSP com jovens de comunidade
            </h3>
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <CheckCircle className="w-6 h-6 text-cyan-600 shrink-0 mt-0.5" />
                <span className="text-lg text-slate-700 leading-relaxed"><strong className="font-semibold text-slate-900">+40 Horas de Atividades Científicas:</strong> 4 dias de experiência prática em laboratórios de ponta da USP, com certificação oficial da universidade.</span>
              </li>
              <li className="flex items-start gap-4">
                <CheckCircle className="w-6 h-6 text-cyan-600 shrink-0 mt-0.5" />
                <span className="text-lg text-slate-700 leading-relaxed"><strong className="font-semibold text-slate-900">Vocação Tecnológica:</strong> 90% dos jovens do Instituto Rosemere Chaves relataram aumento no interesse por carreiras em tecnologia.</span>
              </li>
              <li className="flex items-start gap-4">
                <CheckCircle className="w-6 h-6 text-cyan-600 shrink-0 mt-0.5" />
                <span className="text-lg text-slate-700 leading-relaxed"><strong className="font-semibold text-slate-900">Ciência e Visibilidade Acadêmica:</strong> Conexão direta com a comunidade científica nacional por meio da participação na FEBRACE, expandindo horizontes e possibilidades de carreira.</span>
              </li>
            </ul>
          </div>
          
          {/* Image Column (Right) */}
          <div className="relative w-full h-full min-h-[400px] lg:min-h-[500px]">
            <Image 
              src={`${basePath}/case-1.jpg`} 
              alt="Programa EDUCA + INOVAUSP" 
              fill 
              style={{ objectFit: 'cover' }}
              className="rounded-2xl shadow-lg"
            />
          </div>
        </div>

        {/* CASE 2 */}
        <div className="case-block relative w-full h-auto p-6 md:p-16 lg:p-20 shadow-2xl shadow-slate-900/5 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white">
          {/* Image Column (Left) */}
          <div className="relative w-full h-full min-h-[400px] lg:min-h-[500px]">
            <Image 
              src={`${basePath}/case-2.jpg`} 
              alt="Projeto INSPIRE" 
              fill 
              style={{ objectFit: 'cover' }}
              className="rounded-2xl shadow-lg"
            />
          </div>

          {/* Text Column (Right) */}
          <div className="flex flex-col justify-center">
            <span className="flex items-center gap-2 bg-orange-100 text-orange-900 px-4 py-1.5 rounded-full text-sm font-semibold mb-6 inline-flex w-fit">
              <Map className="w-4 h-4" />
              Tecnologia Nacional
            </span>
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight mb-8">
              Projeto INSPIRE
            </h3>
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <CheckCircle className="w-6 h-6 text-orange-500 shrink-0 mt-0.5" />
                <span className="text-lg text-slate-700 leading-relaxed">+ 1.000 ventiladores fabricados com tecnologia 100% brasileira, contando com o apoio de mais de 60 parceiros.</span>
              </li>
              <li className="flex items-start gap-4">
                <CheckCircle className="w-6 h-6 text-orange-500 shrink-0 mt-0.5" />
                <span className="text-lg text-slate-700 leading-relaxed">Até novembro de 2021, o projeto já havia distribuído 825 equipamentos, atendendo 219 hospitais em 219 cidades, espalhadas por 16 estados brasileiros.</span>
              </li>
              <li className="flex items-start gap-4">
                <CheckCircle className="w-6 h-6 text-orange-500 shrink-0 mt-0.5" />
                <span className="text-lg text-slate-700 leading-relaxed">A utilização de 20 respiradores INSPIRE resultou em mais de 100 vidas salvas entre os meses de fevereiro e junho de 2021.</span>
              </li>
            </ul>
          </div>
        </div>
        </div>
      </section>

      {/* 4. The Staggered "Soluções" Grid */}
      <section className="relative w-full max-w-7xl mx-auto py-32 px-4 md:px-0">
        <div className="text-center mb-24 px-4">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight text-[#0F172A]">Soluções <span className="text-orange-500">Estratégicas</span></h2>
          <p className="text-base md:text-lg text-slate-500 font-medium max-w-2xl mx-auto">Tecnologias inovadoras para a gestão municipal.</p>
        </div>

        <div className="flex flex-col space-y-32 md:space-y-40 w-full px-4 md:px-10 pb-10">
          {/* Solução 1: Left Aligned */}
          <div className="w-full relative z-10 flex">
            <SolucaoBlock 
              imageSrc={`${basePath}/solucao-saude.jpg`}
              title="Saúde Digital" 
              description={<><strong>Projeto INSPIRE — Ventilador Pulmonar Emergencial:</strong> Ventilador pulmonar de baixo custo e tecnologia nacional criado pela Poli-USP, ampliando o acesso a suporte à vida em municípios remotos. <br/><br/> <strong>Projeto CROSS — Regulação de Urgências:</strong> Modernização do CROSS otimizando a regulação médica de urgências, aumentando a eficiência do atendimento municipal.</>}
              category="Saúde"
              categoryColor="text-cyan-600 bg-cyan-50"
              theme="dark"
              align="left"
              Icon={HeartPulse}
            />
          </div>

          {/* Solução 2: Right Aligned */}
          <div className="w-full relative z-20 flex">
            <SolucaoBlock 
              imageSrc={`${basePath}/solucao-educacao.jpg`}
              title="Laboratórios STEAM & Maker" 
              description={<>Voltados à integração interdisciplinar de áreas como ciências, arte e tecnologia equipados e experiências práticas em design, robótica e prototipagem que estimulam a criatividade aplicada.</>}
              category="Educação"
              categoryColor="text-orange-600 bg-orange-50"
              theme="light"
              align="right"
              Icon={BookOpen}
            />
          </div>

          {/* Solução 3: Left Aligned */}
          <div className="w-full relative z-30 flex">
            <SolucaoBlock 
              imageSrc={`${basePath}/solucao-seguranca.jpg`}
              title="ABESE Labs - Laboratório de Experimentação" 
              description={<>Espaço avançado para testes e demonstrações de tecnologias de ponta em segurança eletrônica, desenvolvido em parceria com a ABESE, com compatibilidade total ao Programa Muralha Paulista e integração plena aos sistemas estaduais de segurança pública.</>}
              category="Segurança"
              categoryColor="text-cyan-600 bg-cyan-50"
              theme="light"
              align="left"
              Icon={ShieldCheck}
            />
          </div>
          
          {/* Solução 4: Right Aligned */}
          <div className="w-full relative z-40 flex">
            <SolucaoBlock 
              imageSrc={`${basePath}/solucao-meio-ambiente.jpg`}
              title="Gestão Territorial Baseada em Dados" 
              description={<>Sensores de precisão instalados no território capturam dados climáticos em tempo real — temperatura, umidade, precipitação e pressão atmosférica — , alimentando uma plataforma digital de gestão ambiental integrada.</>}
              category="Meio Ambiente"
              categoryColor="text-[#0F172A] bg-slate-100"
              theme="dark"
              align="right"
              Icon={Leaf}
            />
          </div>
        </div>
      </section>

      {/* 5. Footer Element */}
      <motion.footer 
        id="footer"
        initial={{ opacity: 0, y: 50 }} 
        whileInView={{ opacity: 1, y: 0 }} 
        viewport={{ once: true, margin: "-50px" }} 
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full py-12 bg-white text-[#0F172A] border-t border-slate-200 mt-24"
      >
        <div className="max-w-7xl mx-auto w-full px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          {/* Left Side */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left gap-4">
            <div className="flex items-center gap-3">
              <Image src={`${basePath}/logo.png`} alt="OTDSP Logo" width={200} height={40} className="h-10 w-auto object-contain" />
            </div>
            <p className="text-slate-500 font-medium max-w-sm text-sm">
              Conectando inovação, dados e desenvolvimento para o avanço dos municípios no Estado de São Paulo.
            </p>
          </div>

          {/* Right Side */}
          <div className="flex flex-col items-center md:items-end gap-6">
            <div className="flex flex-wrap justify-center md:justify-end gap-4">
              {[
                { name: 'LinkedIn', url: 'https://www.linkedin.com/company/otdsp/' },
                { name: 'Instagram', url: 'https://www.instagram.com/otdsp.usp' }
              ].map((social, i) => (
                <motion.a 
                  key={i}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="font-medium px-6 py-2.5 bg-[#0F172A] text-white hover:bg-cyan-600 hover:shadow-lg hover:shadow-cyan-600/20 rounded-full transition-all duration-300 text-sm"
                >
                  {social.name}
                </motion.a>
              ))}
            </div>
            <p className="text-slate-400 font-medium tracking-wide text-xs">
              © 2026 Observatório de Transformação Digital – USP.
            </p>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}

