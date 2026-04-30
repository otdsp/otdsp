"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "motion/react";
import LoadingScreen from "@/components/LoadingScreen";
import Navbar from "@/components/Navbar";
import AnimatedSection from "@/components/AnimatedSection";
import MagneticCard from "@/components/MagneticCard";
import ClipPathReveal from "@/components/ClipPathReveal";
import { ChevronDown, Building2, GraduationCap, Factory, Users, Rocket, Activity, BookOpen, ShieldAlert, Leaf, Brain, Wifi, MapPin, Heart, CheckCircle2, Mail, CalendarDays } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } }
};
const elasticItem = {
  hidden: { opacity: 0, y: 50, scale: 0.8 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 200, damping: 15 } }
};

export default function Home() {
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 1000], ["0%", "40%"]);
  const missaoImgY = useTransform(scrollY, [0, 1500], ["0%", "20%"]);

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col font-sans overflow-x-hidden pt-20">
      <LoadingScreen />
      <Navbar />

      <section id="inicio" className="relative w-full h-[100vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden bg-black">
        <motion.div style={{ y: heroY }} className="absolute inset-0 z-0 origin-top">
          <div className="absolute inset-0 z-10 bg-gradient-to-br from-[#00A6FF]/80 to-[#FFCB00]/80 mix-blend-multiply"></div>
          <Image src="https://picsum.photos/seed/sao-paulo/1920/1080" alt="São Paulo Background" fill className="object-cover opacity-80" priority referrerPolicy="no-referrer" />
        </motion.div>
        <div className="relative z-10 max-w-5xl mx-auto space-y-6">
          <motion.h1 initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 1, delay: 0.2, type: "spring", stiffness: 100 }} className="text-5xl md:text-7xl font-bold tracking-tighter text-white drop-shadow-2xl leading-tight">Observatório de Transformação Digital do Estado de São Paulo</motion.h1>
          <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }} className="text-xl md:text-2xl font-medium text-white/95 drop-shadow-md max-w-3xl mx-auto">Conectando Ciência e Transformação Digital para o Estado de São Paulo</motion.p>
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1.2 }} className="absolute bottom-10 z-10 animate-float">
          <a href="#missao" className="text-white hover:text-[#FFCB00] transition-colors"><ChevronDown size={48} /></a>
        </motion.div>
      </section>

      <AnimatedSection id="missao" className="bg-white relative z-20 shadow-xl py-32">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-[#00A6FF]">Missão</h2>
            <div className="w-20 h-1 bg-[#FFCB00] rounded-full"></div>
            <p className="text-xl text-gray-700 leading-relaxed font-medium">Transformar o conhecimento da universidade em soluções inovadoras que promovam inclusão digital, desenvolvimento sustentável e melhoria dos serviços públicos em todo o estado.</p>
            <p className="text-lg text-gray-600 leading-relaxed">Somos uma iniciativa contínua dedicada a mapear e catalisar o ecossistema tecnológico paulista, unindo esforços de diversos setores para alavancar nossa competitividade global.</p>
          </div>
          <MagneticCard className="rounded-[40px] w-full">
            <ClipPathReveal className="aspect-square md:aspect-[4/3] rounded-[40px] shadow-[0_20px_50px_rgba(0,166,255,0.25)] relative w-full h-full">
              <motion.div style={{ y: missaoImgY }} className="absolute -inset-10 z-0">
                <Image src="https://picsum.photos/seed/missao/800/600" alt="Missão Imagem" fill className="object-cover animate-float-slow" referrerPolicy="no-referrer" />
              </motion.div>
            </ClipPathReveal>
          </MagneticCard>
        </div>
      </AnimatedSection>

      <AnimatedSection id="helice" className="bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden py-32">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FFCB00]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#00A6FF]/10 rounded-full blur-3xl"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-bold text-gray-900">O Modelo de Inovação da Quíntupla Hélice</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#00A6FF] to-[#FFCB00] mx-auto rounded-full"></div>
            <p className="text-gray-600 max-w-2xl mx-auto pt-4 text-lg">Integração colaborativa em prol do desenvolvimento e da inovação sustentável.</p>
          </div>
          <motion.div variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} className="flex flex-wrap justify-center gap-6">
            {[
              { icon: Building2, title: "Governo", desc: "Políticas e Regulação" },
              { icon: GraduationCap, title: "Academia", desc: "Pesquisa e Conhecimento" },
              { icon: Factory, title: "Setor Produtivo", desc: "Mercado e Soluções" },
              { icon: Users, title: "Sociedade Civil", desc: "Adoção e Inclusão" },
              { icon: Rocket, title: "Fomento", desc: "Financiamento e Apoio" }
            ].map((item, i) => (
              <MagneticCard key={i} className="flex-1 min-w-[200px] max-w-[240px] rounded-2xl">
                <motion.div variants={elasticItem} className="h-full bg-white/60 backdrop-blur-xl border border-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center relative pointer-events-none">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#00A6FF]/10 to-[#FFCB00]/10 rounded-full flex items-center justify-center mb-6 text-[#00A6FF] animate-float"><item.icon size={32} /></div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </motion.div>
              </MagneticCard>
            ))}
          </motion.div>
        </div>
      </AnimatedSection>

      <AnimatedSection id="eixos" className="bg-white py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-bold text-[#00A6FF]">Eixos Estratégicos de Atuação</h2>
            <div className="w-24 h-1 bg-[#FFCB00] mx-auto rounded-full"></div>
          </div>
          <motion.div variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} className="grid lg:grid-cols-3 gap-8">
            {[
              { title: "Indicadores e Diagnósticos", tags: ["Análise de Dados", "Metodologias", "Diagnósticos"] },
              { title: "Políticas Públicas e Inclusão", tags: ["Evidências", "Recomendações", "Inclusão Digital"] },
              { title: "Convênios derivados e TRL Alta", tags: ["TRL Alto", "Inovação", "Retorno Social"] }
            ].map((eixo, i) => (
              <MagneticCard key={i} className="h-full rounded-3xl">
                <motion.div variants={elasticItem} className="h-full bg-white border border-gray-100 rounded-3xl p-8 shadow-md transition-all pointer-events-none relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00A6FF] to-[#FFCB00] transform origin-left"></div>
                  <div className="text-[#00A6FF] mb-6 animate-float"><Activity size={40} className="opacity-80" /></div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">{eixo.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    {eixo.tags.map((tag, j) => <span key={j} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">{tag}</span>)}
                  </div>
                </motion.div>
              </MagneticCard>
            ))}
          </motion.div>
        </div>
      </AnimatedSection>

      <AnimatedSection id="convenios" className="bg-gray-50 py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-bold text-gray-900">Estrutura Operacional</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#00A6FF] to-[#FFCB00] mx-auto rounded-full"></div>
          </div>
          <div className="flex flex-col items-center gap-12 relative w-full">
            <div className="absolute top-[80px] left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[120px] pointer-events-none z-0 hidden md:block">
              <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                <path d="M 50,0 Q 50,20 20,40" fill="none" stroke="#00A6FF" strokeWidth="0.8" strokeDasharray="4 4" className="animate-flow" />
                <path d="M 50,0 Q 50,20 80,40" fill="none" stroke="#FFCB00" strokeWidth="0.8" strokeDasharray="4 4" className="animate-flow" />
              </svg>
            </div>
            <motion.div initial={{ y: -20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} className="bg-gradient-to-r from-[#00A6FF] to-blue-600 text-white p-8 rounded-3xl shadow-[0_10px_40px_rgba(0,166,255,0.3)] text-center w-full max-w-md relative z-20 animate-float-slow">
              <h3 className="text-2xl font-bold mb-2">Convênio Guarda-chuva</h3>
              <p className="text-white/80 font-medium">Governabilidade e Coordenação Geral</p>
            </motion.div>
            <div className="grid md:grid-cols-2 gap-8 w-full relative z-10 -mt-10 pt-10">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-full">
                <h4 className="text-xl font-bold text-[#FFCB00] mb-6 text-center">Verticais Públicas</h4>
                <motion.div variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid sm:grid-cols-2 gap-4">
                  {[{ icon: Heart, title: "Saúde", items: ["Telemedicina", "Dados", "Prontuário", "Inovação"] }, { icon: BookOpen, title: "Educação", items: ["E-learning", "Equipamento", "Conexão", "Gamificação"] }, { icon: ShieldAlert, title: "Segurança", items: ["Videomonitoramento", "IA", "Comunicação", "Apoio"] }, { icon: Leaf, title: "Meio Ambiente", items: ["Sensores", "Monitoria", "Sustentável", "Prevenção"] }].map((vert, i) => (
                    <motion.div key={i} variants={elasticItem} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex flex-col items-start gap-4">
                      <div className="flex items-center gap-2 text-gray-800 font-bold"><vert.icon size={20} className="text-[#FFCB00] animate-float" />{vert.title}</div>
                      <ul className="space-y-2">{vert.items.map((item, j) => <li key={j} className="text-sm text-gray-600 flex items-center gap-2"><div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>{item}</li>)}</ul>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-full">
                <h4 className="text-xl font-bold text-[#00A6FF] mb-6 text-center">Horizontais Tecnológicas</h4>
                <motion.div variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid sm:grid-cols-2 gap-4">
                  {[{ icon: Brain, title: "IA", items: ["LLMs", "Visão", "Bots", "Previsão"] }, { icon: Wifi, title: "Conectividade", items: ["5G/6G", "Fibra", "IoT", "Redes"] }, { icon: MapPin, title: "Cidades Intel.", items: ["Mobilidade", "Luz", "Resíduos", "Urbanismo"] }, { icon: Users, title: "Impacto Social", items: ["Letramento", "Acesso", "Emprego", "Cidadania"] }].map((horz, i) => (
                    <motion.div key={i} variants={elasticItem} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex flex-col items-start gap-4">
                      <div className="flex items-center gap-2 text-gray-800 font-bold"><horz.icon size={20} className="text-[#00A6FF] animate-float" />{horz.title}</div>
                      <ul className="space-y-2">{horz.items.map((item, j) => <li key={j} className="text-sm text-gray-600 flex items-center gap-2"><div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>{item}</li>)}</ul>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>
            <motion.div variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true }} className="w-full grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
              {["Alto TRL", "Produtos Inovadores", "Impacto Social", "Políticas Efetivas"].map((badge, i) => (
                <motion.div key={i} variants={elasticItem} className="bg-white py-4 px-6 rounded-full shadow-sm border border-gray-100 flex items-center justify-center gap-2 font-semibold text-gray-700"><CheckCircle2 size={18} className="text-green-500" />{badge}</motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection id="timeline" className="bg-[#1f2937] text-white overflow-hidden py-32">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-bold">Linha do Tempo</h2>
            <div className="w-24 h-1 bg-[#00A6FF] mx-auto rounded-full"></div>
          </div>
          <div className="relative py-10">
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-[#00A6FF] via-[#FFCB00] to-[#00A6FF] opacity-50 transform md:-translate-x-1/2 shadow-[0_0_15px_#00A6FF]"></div>
            <motion.div variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true }} className="space-y-16 md:space-y-24">
              {[
                { year: "2022", title: "Gênese da Ideia", desc: "Primeiras discussões e levantamento de necessidades do ecossistema.", pos: "left" },
                { year: "2024", title: "Institucionalização", desc: "Lançamento oficial com os primeiros convênios estruturados.", pos: "right" },
                { year: "2025", title: "Alinhamento Estratégico", desc: "Consolidação das verticais e aproximação com parceiros.", pos: "left" },
                { year: "Novembro 2025", title: "Implementação", desc: "Entrega de soluções práticas focadas em inclusão e alto TRL.", pos: "right" }
              ].map((milestone, i) => (
                <motion.div key={i} variants={elasticItem} className={`relative flex flex-col md:flex-row items-start md:items-center justify-between w-full ${milestone.pos === 'left' ? 'md:flex-row-reverse' : ''}`}>
                  <div className="hidden md:block w-5/12"></div>
                  <div className="z-20 flex items-center justify-center w-8 h-8 rounded-full bg-[#1f2937] absolute left-0 md:left-1/2 transform translate-x-0 md:-translate-x-1/2 shadow-[0_0_20px_#FFCB00] border-4 border-[#FFCB00]">
                    <div className="w-3 h-3 bg-[#00A6FF] rounded-full animate-ping"></div>
                  </div>
                  <div className={`w-full md:w-5/12 pl-12 md:pl-0 ${milestone.pos === 'left' ? 'md:text-right' : 'md:text-left'}`}>
                    <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-2xl hover:bg-white/20 transition-colors">
                      <span className="text-[#FFCB00] font-bold text-lg">{milestone.year}</span>
                      <h4 className="text-2xl font-bold mt-1 mb-2 text-[#00A6FF]">{milestone.title}</h4>
                      <p className="text-gray-300">{milestone.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection id="contato" className="bg-white py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-bold text-gray-900">Contato e Agendamento</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#00A6FF] to-[#FFCB00] mx-auto rounded-full"></div>
          </div>
          <motion.div variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid md:grid-cols-5 gap-12 items-start">
            <motion.div variants={elasticItem} className="md:col-span-2 space-y-8">
              <div>
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-3"><CalendarDays className="text-[#00A6FF]" />Agende uma Visita</h3>
                <p className="text-gray-600 mb-6 font-medium leading-relaxed">Conheça de perto as iniciativas do Observatório. Agende uma reunião com nossa equipe técnica ou coordenação.</p>
                <ul className="space-y-4">
                  {["Apresentação de portfólio de pesquisas", "Demandas de inovação pública", "Visitas institucionais guiadas"].map((item, i) => (
                    <li key={i} className="flex items-start gap-3"><CheckCircle2 size={24} className="text-[#FFCB00] shrink-0" /><span className="text-gray-700 font-medium">{item}</span></li>
                  ))}
                </ul>
              </div>
              <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-3"><Mail className="text-[#00A6FF]" />Informações de Contato</h3>
                <p className="text-gray-600 mb-2">Fale conosco pelo e-mail oficial:</p>
                <a href="mailto:observatorio.estado.sp@gmail.com" className="text-[#00A6FF] font-bold text-lg hover:text-[#FFCB00] transition-colors break-all">observatorio.estado.sp@gmail.com</a>
              </div>
            </motion.div>
            <motion.div variants={elasticItem} className="md:col-span-3 bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100 h-[600px] flex items-center justify-center p-8 text-center relative">
              <div className="absolute inset-0 bg-gray-50 flex items-center justify-center border border-dashed border-gray-300 m-4 rounded-xl"><p className="text-gray-500 font-medium">Widget TidyCal será carregado aqui</p></div>
            </motion.div>
          </motion.div>
        </div>
      </AnimatedSection>

      <footer className="bg-gradient-to-b from-[#1f2937] to-gray-900 text-gray-400 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <span className="font-bold text-2xl text-white tracking-tighter mb-4 block">OTDSP</span>
            <p className="text-sm max-w-sm leading-relaxed">Observatório de Transformação Digital do Estado de São Paulo. Conectando o ecossistema de inovação, academia e setor público com foco na melhoria contínua da vida do cidadão.</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Links Rápidos</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#inicio" className="hover:text-[#00A6FF] transition-colors">Início</a></li>
              <li><a href="#missao" className="hover:text-[#00A6FF] transition-colors">Missão</a></li>
              <li><a href="#helice" className="hover:text-[#00A6FF] transition-colors">Hélice</a></li>
              <li><a href="#eixos" className="hover:text-[#00A6FF] transition-colors">Eixos</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Contato</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="mailto:observatorio.estado.sp@gmail.com" className="hover:text-[#FFCB00] transition-colors break-all">observatorio.estado.sp@gmail.com</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-gray-800 text-sm text-center">© 2025 Observatório de Transformação Digital do Estado de São Paulo.</div>
      </footer>
    </main>
  );
}
