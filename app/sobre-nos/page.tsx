'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Image from 'next/image'
import { 
  Mail, Phone, MapPin, Quote, ClipboardList, Handshake, Cog, X, 
  Users, Landmark, GraduationCap, Factory, Leaf 
} from 'lucide-react'

const basePath = process.env.__NEXT_ROUTER_BASEPATH || '';

const pillars = [
  { 
    name: "Sociedade Civil", 
    icon: Users, 
    description: "Participação ativa dos cidadãos na cocriação de soluções.",
    axis: "ecosystem",
    cardClass: "bg-white border-2 border-amber-500/35 text-amber-950 shadow-lg shadow-slate-100/80 hover:border-amber-500 hover:shadow-xl hover:shadow-amber-200/40 cursor-pointer",
    iconClass: "text-amber-600 bg-amber-50/70 border border-amber-200/50",
    textClass: "text-amber-950 font-bold group-hover:text-amber-700",
    potenciais: "Os usuários estão no centro do modelo, atuando ativamente em processos de cocriação e promovendo uma dinâmica de inovação aberta democrática. Legitimada junto à opinião pública, a sociedade civil traz as demandas culturais, territoriais e de inclusão real diretamente para o núcleo das decisões tecnológicas municipais.",
    desafios: "Sua participação estruturada nos ecossistemas de inovação ainda enfrenta barreiras práticas e conceituais, sofrendo com a falta de canais institucionais perenes de coordenação, governança e escuta ativa, especialmente em regiões periféricas onde a dimensão sociocultural precisa de maior valorização."
  },
  { 
    name: "Governo", 
    icon: Landmark, 
    description: "Esfera pública, consórcios e articulação política eficiente.",
    axis: "institutional",
    cardClass: "bg-white border-2 border-slate-200 text-[#0F172A] shadow-lg shadow-slate-100/80 hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-100/55 cursor-pointer",
    iconClass: "text-cyan-700 bg-cyan-50 border border-cyan-200/50",
    textClass: "text-[#0F172A] font-bold group-hover:text-cyan-700",
    potenciais: "Garante estabilidade política, provê infraestrutura de base e incentivos fiscais estruturantes, apoiando arranjos organizacionais e articulando o ecossistema. Atua como indutor estratégico de inovação por meio de compras públicas tecnológicas, fomento direcionado e desenho de políticas de desenvolvimento regional sustentável de longo prazo.",
    desafios: "Enfrenta entraves severos ligados à burocratização excessiva, rigidez ou lentidão nos processos legais necessários para a contratação pública de soluções de inovação e riscos de descontinuidade administrativa decorrentes dos ciclos políticos locais."
  },
  { 
    name: "Universidade", 
    icon: GraduationCap, 
    description: "Pesquisa de ponta e transferência de tecnologia de base.",
    axis: "ecosystem",
    cardClass: "bg-white border-2 border-amber-500/35 text-amber-950 shadow-lg shadow-slate-100/80 hover:border-amber-500 hover:shadow-xl hover:shadow-amber-200/40 cursor-pointer",
    iconClass: "text-amber-600 bg-amber-50/70 border border-amber-200/50",
    textClass: "text-amber-950 font-bold group-hover:text-amber-700",
    potenciais: "Gera novos conhecimentos científicos, forma pesquisadores e mão de obra altamente qualificada, aproximando o governo das empresas e liderando processos de mudança disruptiva. Fortalece o ecossistema por meio de projetos de pesquisa aplicados, parques tecnológicos, incubadoras, NITs e compartilhamento de ativos intelectuais com a indústria.",
    desafios: "Seu crescimento e impacto dependem de ampliar e diversificar as fontes de fomento financeiro, renovar os modelos internos de gestão e estreitar vínculos diretos com o mercado. Ambientes com baixa coordenação institucional exigem maior esforço de adaptação, pesquisa aplicada e interdisciplinaridade."
  },
  { 
    name: "Setor Produtivo", 
    icon: Factory, 
    description: "Startups e empresas integrando inovação prática.",
    axis: "institutional",
    cardClass: "bg-white border-2 border-slate-200 text-[#0F172A] shadow-lg shadow-slate-100/80 hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-100/55 cursor-pointer",
    iconClass: "text-cyan-700 bg-cyan-50 border border-cyan-200/50",
    textClass: "text-[#0F172A] font-bold group-hover:text-cyan-700",
    potenciais: "Desenvolve produtos e serviços inovadores de alto valor agregado, interage diretamente com centros de pesquisa acadêmicos e lidera processos de mudança econômica. Na economia baseada no conhecimento, transforma inovação tecnológica em vantagem competitiva real, convertendo ciência em valor de mercado e novos empregos.",
    desafios: "Pode apresentar limitações severas na capacidade ou cultura de investimento próprio e contínuo em P&D interno. Para expandir, precisa superar o isolamento operacional de governanças tradicionais e construir maior maturidade corporativa para cooperar em projetos complexos de inovação aberta."
  },
  { 
    name: "Meio Ambiente", 
    icon: Leaf, 
    description: "Sustentabilidade, ecologia e preservação municipal.",
    axis: "ecosystem",
    cardClass: "bg-white border-2 border-amber-500/35 text-amber-950 shadow-lg shadow-slate-100/80 hover:border-amber-500 hover:shadow-xl hover:shadow-amber-200/40 cursor-pointer",
    iconClass: "text-amber-600 bg-amber-50/70 border border-amber-200/50",
    textClass: "text-amber-950 font-bold group-hover:text-amber-700",
    potenciais: "Atua como o fator principal para a preservação, sobrevivência e vitalização da humanidade, integrando-se de forma ativa na produção de conhecimento. É o grande motor de eco-inovação, sustentabilidade regional, regeneração ecológica e economia circular, balizando os projetos sob critérios de ecoeficiência e neutralidade de carbono.",
    desafios: "Ainda oferece um campo amplo e desafiador para aprofundar sua representação prática e mensuração cotidiana dentro de políticas públicas e arranjos institucionais. Há uma necessidade latente de transformar a dimensão ambiental em um agente proativo com indicadores de impacto claros e integrados."
  },
]

export default function SobreNosPage() {
  const [isHovered, setIsHovered] = useState<number | null>(null)
  const [activeModal, setActiveModal] = useState<number | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveModal(null)
      }
    }
    if (activeModal !== null) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeModal])

  return (
    <div className="min-h-screen bg-slate-50 font-sans pt-20">
      {/* Hero Section */}
      <section className="relative w-full py-16 md:py-24 bg-slate-800 overflow-hidden flex items-center justify-center border-b border-slate-700/30">
        {/* Subtle background gradient glow */}
        <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none z-0" />
        <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-orange-500/5 rounded-full blur-3xl pointer-events-none z-0" />

        {/* Imagem de Borda Infinita à Direita (Apenas Desktop) */}
        <div className="hidden lg:block absolute top-0 bottom-0 right-0 w-[41%] z-0 select-none overflow-hidden pointer-events-none">
          <div className="relative w-full h-full">
            <Image
             src={`${basePath}/universidade.jpg`}
              alt="Universidade USP"
              fill
              className="object-cover object-[40%_center]" 
              priority
              referrerPolicy="no-referrer"
            />
            {/* Gradiente sutil para misturar a imagem com o slate-800 ao fundo */}
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-slate-800 via-slate-800/80 to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Content Container */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Bloco de Texto (Esquerda) */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="lg:col-span-7 flex flex-col items-start text-left relative z-20"
            >
              <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight mb-6">
                Somos uma iniciativa suprapartidária com o objetivo de transferência de tecnologia da <span className="text-cyan-400">USP</span> para os municípios do Brasil.
              </h1>
              
              <p className="text-base sm:text-lg text-slate-300 font-medium mb-8 leading-relaxed max-w-2xl">
                Você gestor público, entre em contato e venha somar conosco nessa transformação digital em benefício dos municípios.
              </p>

              {/* Contact Items - Stacked Vertically */}
              <div className="flex flex-col gap-5 w-full border-t border-slate-700/50 pt-8 mt-4">
                <div className="flex items-center gap-4 text-left group">
                  <div className="w-10 h-10 border border-cyan-400/30 text-cyan-400 rounded-full flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <div className="text-xs text-slate-400 font-semibold mb-0.5 uppercase tracking-wider">E-mail</div>
                    <div className="text-white font-medium text-sm md:text-base select-text">observatorio.estado.sp@gmail.com</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-left group">
                  <div className="w-10 h-10 border border-green-400/30 text-green-400 rounded-full flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <div className="text-xs text-slate-400 font-semibold mb-0.5 uppercase tracking-wider">WhatsApp</div>
                    <div className="text-white font-medium text-sm md:text-base select-text">11 97083-0876</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-left group">
                  <div className="w-10 h-10 border border-orange-400/30 text-orange-400 rounded-full flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <div className="text-xs text-slate-400 font-semibold mb-0.5 uppercase tracking-wider">Endereço</div>
                    <div className="text-white font-medium text-sm leading-relaxed select-text">
                      Av. Prof. Lúcio Martins Rodrigues, 370<br />
                      Butantã, São Paulo - SP, 05508-020
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Imagem Principal (Apenas Mobile/Tablet - como um card elegante) */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
              className="lg:col-span-5 flex justify-center lg:hidden"
            >
              <div className="relative w-full max-w-[420px] aspect-square rounded-[2rem] overflow-hidden shadow-2xl border-4 border-slate-700/30 bg-slate-800">
                <Image
                  src={`${basePath}/universidade.jpg`}
                  alt="Universidade USP"
                  fill
                  className="object-cover object-[65%_center]"
                  priority
                  referrerPolicy="no-referrer"
                />
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Missão Section (Hélice Quíntupla) */}
      <section className="py-20 md:py-32 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-50/50 rounded-full blur-3xl -mr-64 -mt-64 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-50/50 rounded-full blur-3xl -ml-40 -mb-40 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          
          {/* Centered section header */}
          <div className="text-center mb-16 md:mb-20">
            <span className="text-xs font-bold text-cyan-600 tracking-widest uppercase mb-2 block">Propósito</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-800 tracking-tight">Nossa Missão</h2>
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-center gap-16 lg:gap-24">
            
            {/* Left/Top: Hélice Component (Orbital Network for Desktop/Tablet) */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="w-full lg:w-1/2 flex justify-center lg:justify-end overflow-visible"
            >
              {/* Responsive Layout: Orbital wheel */}
              <div 
                className="flex relative w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] md:w-[480px] md:h-[480px] lg:w-[560px] lg:h-[560px] aspect-square rounded-full items-center justify-center bg-slate-50 border border-slate-200/50 [--orbit-radius:125px] sm:[--orbit-radius:145px] md:[--orbit-radius:160px] lg:[--orbit-radius:195px] selector-helix overflow-visible mt-6 lg:mt-0"
              >
                {/* CSS Keyframes for smooth continuous loop and pausing capability */}
                <style dangerouslySetInnerHTML={{__html: `
                  @keyframes orbit {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                  }
                  @keyframes counter-orbit {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(-360deg); }
                  }
                  .animate-orbit {
                    animation: orbit 45s linear infinite;
                  }
                  .animate-counter-orbit {
                    animation: counter-orbit 45s linear infinite;
                  }
                `}} />

                {/* Sub-rings for aesthetics */}
                <div className="absolute w-[80%] h-[80%] rounded-full border border-slate-200/40 pointer-events-none" />
                <div 
                  className="absolute rounded-full border border-dashed border-cyan-500/20 pointer-events-none"
                  style={{ width: 'calc(2 * var(--orbit-radius))', height: 'calc(2 * var(--orbit-radius))' }}
                />
                <div 
                  className="absolute rounded-full border border-slate-200/60 pointer-events-none"
                  style={{ width: 'calc(2 * var(--orbit-radius) - 70px)', height: 'calc(2 * var(--orbit-radius) - 70px)' }}
                />

                {/* Orbit loop group */}
                <div 
                  className="absolute inset-0 animate-orbit z-10 overflow-visible"
                  style={{ animationPlayState: (isHovered !== null || activeModal !== null) ? 'paused' : 'running' }}
                >
                  {pillars.map((item, i) => {
                    const angle = i * 72;
                    const IconComponent = item.icon;
                    return (
                      <div
                        key={i}
                        className="absolute top-1/2 left-1/2 overflow-visible"
                        style={{
                          transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(calc(-1 * var(--orbit-radius)))`,
                        }}
                      >
                        <div 
                          className="relative overflow-visible"
                          onMouseEnter={() => setIsHovered(i)}
                          onMouseLeave={() => setIsHovered(null)}
                        >
                          {/* Counter-rotation to keep the card upright */}
                          <div 
                            className="animate-counter-orbit"
                            style={{ animationPlayState: (isHovered !== null || activeModal !== null) ? 'paused' : 'running' }}
                          >
                            <div 
                              style={{ transform: `rotate(-${angle}deg)` }}
                              className="transition-transform duration-300"
                            >
                              {/* Strict Circular Satellite Card containing visible Icon and Title */}
                              <div 
                                onClick={() => setActiveModal(i)}
                                className={`flex flex-col items-center justify-center text-center p-2.5 sm:p-3 md:p-3.5 lg:p-4 rounded-full aspect-square w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 transition-all duration-300 group cursor-pointer border-2 shadow-lg shadow-slate-200/50 ${item.cardClass} hover:scale-105 hover:-translate-y-1`}
                              >
                                {/* Accentuated circle for the Icon */}
                                <div className={`w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 mb-1 sm:mb-1.5 lg:mb-2 ${item.iconClass}`}>
                                  <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 stroke-[2.2]" />
                                </div>
                                
                                {/* Permanent Solid Title */}
                                <span className={`text-[9.5px] sm:text-[10.5px] md:text-xs lg:text-[13px] font-bold tracking-tight leading-tight select-none px-1 text-center transition-colors ${item.textClass}`}>
                                  {item.name}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Robust Center Circle with Logo (Anchor visual: 33% smaller for elegant breathing room) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full z-20 flex items-center justify-center shadow-xl border-4 border-slate-100 p-2.5 sm:p-3 md:p-4 lg:p-4.5 w-[65px] h-[65px] sm:w-[75px] sm:h-[75px] md:w-[86px] md:h-[86px] lg:w-[107px] lg:h-[107px]">
                  <div className="relative w-full h-full">
                    <Image src={`${basePath}/logo-quadrado.png`} alt="OTDSP Logo" fill className="object-contain" />
                  </div>
                </div>

              </div>
            </motion.div>

            {/* Right/Bottom: Text Content */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
              className="w-full lg:w-1/2 text-center lg:text-left lg:h-[540px] flex flex-col justify-center"
            >
              <div className="inline-flex items-center justify-center lg:self-start w-12 h-12 bg-cyan-100 text-cyan-600 rounded-2xl mb-6 shadow-sm shrink-0">
                <Quote className="w-5 h-5 fill-cyan-600" />
              </div>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-700 leading-relaxed md:leading-[1.7] tracking-normal">
                Nossa missão é conectar todas as esferas e seus agentes de forma organizada e transferir a ciência da universidade para os municípios de médio e pequeno porte. Tudo isso de forma personalizada e com articulação política eficiente.
              </h3>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-24 md:py-32 bg-slate-50 relative overflow-hidden border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 md:mb-24"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-800 tracking-tight">Como fazemos</h2>
          </motion.div>

          <div className="relative max-w-6xl mx-auto">
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes dashX { to { stroke-dashoffset: -24; } }
              @keyframes dashY { to { stroke-dashoffset: -24; } }
              .animate-svg-dash-x { animation: dashX 1s linear infinite; }
              .animate-svg-dash-y { animation: dashY 1s linear infinite; }
            `}} />
            
            {/* Desktop Line (Horizontal) */}
            <div className="hidden md:block absolute top-[50%] -translate-y-1/2 left-[15%] right-[15%] h-[2px] z-0 pointer-events-none">
              <svg width="100%" height="100%" preserveAspectRatio="none">
                <line x1="0" y1="1" x2="100%" y2="1" stroke="#94a3b8" strokeWidth="2" strokeDasharray="12 12" className="animate-svg-dash-x opacity-40" />
              </svg>
            </div>
            
            {/* Mobile Line (Vertical) - Alinhamento central garantido com left-1/2 */}
            <div className="block md:hidden absolute top-[10%] bottom-[10%] left-1/2 -translate-x-1/2 w-[2px] z-0 pointer-events-none">
              <svg width="100%" height="100%" preserveAspectRatio="none">
                <line x1="1" y1="0" x2="1" y2="100%" stroke="#94a3b8" strokeWidth="2" strokeDasharray="12 12" className="animate-svg-dash-y opacity-40" />
              </svg>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16 relative z-10">
              
              {/* Box 1 */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="group bg-white rounded-[2rem] p-8 md:p-10 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.1)] transition-all duration-500 md:hover:-translate-y-3 relative overflow-hidden flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 bg-cyan-50 rounded-2xl flex items-center justify-center text-cyan-600 mb-6 shadow-none border border-cyan-100 relative z-20 group-hover:scale-110 transition-transform duration-500">
                  <ClipboardList className="w-7 h-7 stroke-[2]" />
                </div>
                <div className="relative z-20">
                  <h3 className="font-bold text-slate-900 text-xl tracking-tight mb-4">Necessidade</h3>
                  <p className="text-slate-500 leading-relaxed font-medium">
                    O município ou consórcio entra em contato conosco e apresenta suas necessidades. Temos soluções para as áreas de educação, saúde, segurança pública, inclusão digital e meio ambiente.
                  </p>
                </div>
              </motion.div>

              {/* Box 2 */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="group bg-white rounded-[2rem] p-8 md:p-10 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.1)] transition-all duration-500 md:hover:-translate-y-3 relative overflow-hidden flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 bg-cyan-50 rounded-2xl flex items-center justify-center text-cyan-600 mb-6 shadow-none border border-cyan-100 relative z-20 group-hover:scale-110 transition-transform duration-500">
                  <Handshake className="w-7 h-7 stroke-[2]" />
                </div>
                <div className="relative z-20">
                  <h3 className="font-bold text-slate-900 text-xl tracking-tight mb-4">Colaboração</h3>
                  <p className="text-slate-500 leading-relaxed font-medium">
                    O financiamento também é considerado e existem múltiplas possibilidades. Nós compreendemos as realidades e colaboramos caso a caso para viabilizar os recursos.
                  </p>
                </div>
              </motion.div>

              {/* Box 3 */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="group bg-white rounded-[2rem] p-8 md:p-10 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.1)] transition-all duration-500 md:hover:-translate-y-3 relative overflow-hidden flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 bg-cyan-50 rounded-2xl flex items-center justify-center text-cyan-600 mb-6 shadow-none border border-cyan-100 relative z-20 group-hover:scale-110 transition-transform duration-500">
                  <Cog className="w-7 h-7 stroke-[2]" />
                </div>
                <div className="relative z-20">
                  <h3 className="font-bold text-slate-900 text-xl tracking-tight mb-4">Implementação</h3>
                  <p className="text-slate-500 leading-relaxed font-medium">
                    Após atender a demanda do município e visualizar os caminhos para viabilidade do projeto, nós podemos dar início à orquestração e implantação da solução.
                  </p>
                </div>
              </motion.div>

            </div>
          </div>
        </div>
      </section>

      {/* What we don't do Section */}
      <section className="py-20 md:py-32 bg-slate-800 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">O que não fazemos</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            
            {/* Box 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-slate-900/40 backdrop-blur-md rounded-[2rem] p-8 md:p-10 shadow-2xl border border-slate-700/30 flex flex-col items-center text-center group transition-all duration-300 hover:bg-slate-900/60 animate-glow"
            >
              <div className="w-14 h-14 bg-rose-500/20 rounded-full flex items-center justify-center text-rose-400 mb-6 group-hover:scale-110 transition-transform duration-300 ring-4 ring-rose-500/10">
                <X className="w-6 h-6 stroke-[3]" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-slate-100 mb-4 leading-tight">&quot;Vocês vendem computadores?&quot;</h3>
              <p className="text-slate-400 font-medium leading-relaxed">
                Não vendemos a tecnologia para o município, nosso papel é adequar a TRL (Technology Readiness Level) da startup e apresentar a proposta de trabalho com o Gestor Público.
              </p>
            </motion.div>

            {/* Box 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-slate-900/40 backdrop-blur-md rounded-[2rem] p-8 md:p-10 shadow-2xl border border-slate-700/30 flex flex-col items-center text-center group transition-all duration-300 hover:bg-slate-900/60 animate-glow"
            >
              <div className="w-14 h-14 bg-rose-500/20 rounded-full flex items-center justify-center text-rose-400 mb-6 group-hover:scale-110 transition-transform duration-300 ring-4 ring-rose-500/10">
                <X className="w-6 h-6 stroke-[3]" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-slate-100 mb-4 leading-tight">&quot;Meu município tem apenas 50 mil para comprar.&quot;</h3>
              <p className="text-slate-400 font-medium leading-relaxed">
                Nosso trabalho é criar uma solução para políticas públicas, valores muito reduzidos não atendem a esse escopo estrutural.
              </p>
            </motion.div>

            {/* Box 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-slate-900/40 backdrop-blur-md rounded-[2rem] p-8 md:p-10 shadow-2xl border border-slate-700/30 flex flex-col items-center text-center group transition-all duration-300 hover:bg-slate-900/60 animate-glow"
            >
              <div className="w-14 h-14 bg-rose-500/20 rounded-full flex items-center justify-center text-rose-400 mb-6 group-hover:scale-110 transition-transform duration-300 ring-4 ring-rose-500/10">
                <X className="w-6 h-6 stroke-[3]" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-slate-100 mb-4 leading-tight">&quot;Então a USP faz uma prestação de serviço para o município?&quot;</h3>
              <p className="text-slate-400 font-medium leading-relaxed">
                Não, nós trabalhamos com os consórcios, isso facilita a gestão e entendimento das necessidades. Nós criamos o que chamamos de município âncora.
              </p>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Clickable Satellite Modal Portal/Overlay */}
      <AnimatePresence>
        {activeModal !== null && (() => {
          const item = pillars[activeModal];
          const IconComponent = item.icon;
          return (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              {/* Backdrop Overlay with blur */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => setActiveModal(null)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md cursor-pointer"
              />

              {/* Card of the Modal */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="relative max-w-lg w-full bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-8 md:p-10 z-10 overflow-hidden flex flex-col"
              >
                {/* Close Button right corner */}
                <button 
                  onClick={() => setActiveModal(null)}
                  className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 hover:border-slate-200 transition-all duration-200 cursor-pointer"
                  aria-label="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Header (Icon + Title) */}
                <div className="flex items-center gap-4 md:gap-5 mb-8">
                  <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center border-2 shrink-0 ${item.iconClass}`}>
                    <IconComponent className="w-6 h-6 md:w-7 md:h-7 stroke-[2.2]" />
                  </div>
                  <h3 className="text-slate-900 text-2xl md:text-3xl font-extrabold tracking-tight">
                    {item.name}
                  </h3>
                </div>

                {/* Content paragraphs */}
                <div className="flex flex-col text-left">
                  {/* Potenciais block */}
                  <div className="mb-6">
                    <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md text-xs font-bold font-mono uppercase tracking-wider mb-2 inline-block">
                      Potenciais
                    </span>
                    <p className="text-slate-600 font-medium leading-relaxed text-sm sm:text-base">
                      {item.potenciais}
                    </p>
                  </div>

                  {/* Desafios block */}
                  <div>
                    <span className="text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md text-xs font-bold font-mono uppercase tracking-wider mb-2 inline-block">
                      Desafios
                    </span>
                    <p className="text-slate-600 font-medium leading-relaxed text-sm sm:text-base">
                      {item.desafios}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

    </div>
  )
}