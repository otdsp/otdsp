'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import Image from 'next/image'

const basePath = process.env.__NEXT_ROUTER_BASEPATH || '';
import { 
  Mail, Phone, MapPin, Quote, ClipboardList, Handshake, Cog, X, 
  Users, Landmark, GraduationCap, Factory, Leaf 
} from 'lucide-react'

const pillars = [
  { 
    name: "Sociedade Civil", 
    icon: Users, 
    description: "Participação ativa dos cidadãos na cocriação de soluções." 
  },
  { 
    name: "Governo", 
    icon: Landmark, 
    description: "Esfera pública, consórcios e articulação política eficiente." 
  },
  { 
    name: "Universidade", 
    icon: GraduationCap, 
    description: "Pesquisa de ponta e transferência de tecnologia de base." 
  },
  { 
    name: "Setor Produtivo", 
    icon: Factory, 
    description: "Startups e empresas integrando inovação prática." 
  },
  { 
    name: "Meio Ambiente", 
    icon: Leaf, 
    description: "Sustentabilidade, ecologia e preservação municipal." 
  },
]

export default function SobreNosPage() {
  const [isHovered, setIsHovered] = useState<number | null>(null)
  return (
    <div className="min-h-screen bg-slate-50 font-sans pt-20">
      {/* Hero Section */}
      <section className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src={`${basePath}/universidade.jpg`}
            alt="Universidade USP"
            fill
            className="object-cover"
            priority
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-slate-900/80 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/30 to-slate-900/95" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-8 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <h1 className="text-3xl md:text-5xl lg:text-[3.5rem] font-extrabold text-white tracking-tight leading-tight mb-6">
              Somos uma iniciativa suprapartidária com o objetivo de transferência de tecnologia da <span className="text-cyan-400">USP</span> para os municípios do Brasil.
            </h1>
            
            <p className="text-lg md:text-xl md:text-2xl text-slate-300 max-w-4xl mx-auto font-medium mb-12 leading-relaxed">
              Você gestor público, entre em contato e venha somar conosco nessa transformação digital em benefício dos municípios.
            </p>
          </motion.div>

          {/* Ajustado items-start para alinhar os contatos à esquerda no mobile */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="flex flex-col md:flex-row flex-wrap justify-between items-start md:items-center gap-6 md:gap-4 mt-8 w-full max-w-6xl mx-auto"
          >
            {/* Contact Cards */}
            <div className="flex items-center justify-start gap-4 text-left group flex-1 w-full md:w-auto">
              <div className="w-10 h-10 border border-cyan-400/30 text-cyan-400 rounded-full flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="flex flex-col items-start text-left">
                <div className="text-xs text-slate-400 font-semibold mb-1 uppercase tracking-wider">E-mail</div>
                <div className="text-white font-medium text-[15px] md:text-base select-text">observatorio.estado.sp@gmail.com</div>
              </div>
            </div>

            <div className="flex items-center justify-start md:justify-center gap-4 text-left group flex-1 w-full md:w-auto">
              <div className="w-10 h-10 border border-green-400/30 text-green-400 rounded-full flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div className="flex flex-col items-start text-left">
                <div className="text-xs text-slate-400 font-semibold mb-1 uppercase tracking-wider">WhatsApp</div>
                <div className="text-white font-medium text-base md:text-lg whitespace-nowrap select-text">11 97083-0876</div>
              </div>
            </div>

            <div className="flex items-center justify-start md:justify-end gap-4 text-left group flex-1 w-full md:w-auto">
              <div className="w-10 h-10 border border-orange-400/30 text-orange-400 rounded-full flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex flex-col items-start text-left">
                <div className="text-xs text-slate-400 font-semibold mb-1 uppercase tracking-wider">Endereço</div>
                <div className="text-white font-medium text-sm md:text-base leading-tight select-text">
                  Av. Prof. Lúcio Martins Rodrigues, 370<br />
                  Butantã, São Paulo - SP, 05508-020
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Missão Section (Orbital Network) */}
      <section className="py-20 md:py-32 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-50/50 rounded-full blur-3xl -mr-64 -mt-64 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-50/50 rounded-full blur-3xl -ml-40 -mb-40 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
            
            {/* Left/Top: Orbital Network Component */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="w-full lg:w-1/2 flex justify-center lg:justify-end"
            >
              <div 
                className="relative w-full max-w-[340px] sm:max-w-[400px] aspect-square rounded-full flex items-center justify-center bg-[#F8FAFC] border border-slate-200/50 [--orbit-radius:100px] sm:[--orbit-radius:125px] md:[--orbit-radius:140px] selector-helix"
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
                    animation: orbit 35s linear infinite;
                  }
                  .animate-counter-orbit {
                    animation: counter-orbit 35s linear infinite;
                  }
                `}} />

                {/* Sub-rings for aesthetics */}
                <div className="absolute w-[80%] h-[80%] rounded-full border border-slate-200/30 pointer-events-none" />
                <div 
                  className="absolute rounded-full border border-dashed border-cyan-400/25 pointer-events-none"
                  style={{ width: 'calc(2 * var(--orbit-radius))', height: 'calc(2 * var(--orbit-radius))' }}
                />

                {/* Orbit loop group */}
                <div 
                  className="absolute inset-0 animate-orbit z-10"
                  style={{ animationPlayState: isHovered !== null ? 'paused' : 'running' }}
                >
                  {pillars.map((item, i) => {
                    const angle = i * 72;
                    const IconComponent = item.icon;
                    return (
                      <div
                        key={i}
                        className="absolute top-1/2 left-1/2"
                        style={{
                          transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(calc(-1 * var(--orbit-radius)))`,
                        }}
                      >
                        <div 
                          className="relative"
                          onMouseEnter={() => setIsHovered(i)}
                          onMouseLeave={() => setIsHovered(null)}
                        >
                          {/* Counter-rotation to keep the icon upright */}
                          <div 
                            className="animate-counter-orbit"
                            style={{ animationPlayState: isHovered !== null ? 'paused' : 'running' }}
                          >
                            <div 
                              style={{ transform: `rotate(-${angle}deg)` }}
                              className="transition-transform duration-300"
                            >
                              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center cursor-pointer border shadow-md transition-all duration-300 ${
                                isHovered === i 
                                  ? 'bg-cyan-500 border-cyan-400 text-white shadow-cyan-200/50 shadow-lg scale-110' 
                                  : 'bg-white border-slate-200/80 text-slate-600 hover:text-cyan-600 hover:border-cyan-200'
                              }`}>
                                <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 stroke-[1.8]" />
                              </div>
                            </div>
                          </div>

                         {/* Label tooltip (Compact Pill) */}
                          <div className={`absolute left-1/2 -translate-x-1/2 bottom-full mb-3 whitespace-nowrap bg-slate-900 text-cyan-400 px-4 py-2 rounded-full border border-slate-700 shadow-xl transition-all duration-300 pointer-events-none z-50 flex items-center justify-center ${
                            isHovered === i 
                              ? 'opacity-100 scale-100 translate-y-0' 
                              : 'opacity-0 scale-95 translate-y-2'
                          }`}>
                            <span className="font-bold text-xs tracking-wide uppercase select-none">{item.name}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Center Circle with Logo */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full z-20 flex items-center justify-center shadow-lg border border-slate-100 p-4 w-[110px] h-[110px] md:w-[130px] md:h-[130px]">
                  <div className="relative w-16 h-16 md:w-20 md:h-20">
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
              className="w-full lg:w-1/2 text-center lg:text-left"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 bg-cyan-100 text-cyan-600 rounded-2xl mb-8 shadow-sm">
                <Quote className="w-6 h-6 fill-cyan-600" />
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-[2.25rem] font-bold text-slate-800 leading-[1.3] md:leading-[1.4] tracking-tight">
                Nossa missão é conectar todas as esferas e seus agentes de forma organizada e transferir a ciência da universidade para os municípios de médio e pequeno porte. Tudo isso de forma personalizada e com articulação política eficiente.
              </h2>
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
      <section className="py-20 md:py-32 bg-slate-900 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
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
              className="bg-slate-800/80 backdrop-blur-md rounded-[2rem] p-8 md:p-10 shadow-2xl border border-slate-700/50 flex flex-col items-center text-center group transition-all hover:bg-slate-800"
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
              className="bg-slate-800/80 backdrop-blur-md rounded-[2rem] p-8 md:p-10 shadow-2xl border border-slate-700/50 flex flex-col items-center text-center group transition-all hover:bg-slate-800"
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
              className="bg-slate-800/80 backdrop-blur-md rounded-[2rem] p-8 md:p-10 shadow-2xl border border-slate-700/50 flex flex-col items-center text-center group transition-all hover:bg-slate-800"
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
    </div>
  )
}