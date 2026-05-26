'use client'

import { motion } from 'motion/react'
import { Shield, ArrowLeft, Eye, RefreshCw, Trash2, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function PrivacidadePage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-slate-50/50 py-20 px-4 font-sans selection:bg-cyan-500 selection:text-white">
        <div className="max-w-3xl mx-auto">
            
            {/* Botão para voltar dinâmico */}
            <button 
                onClick={() => router.back()} 
                className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium mb-8 transition-colors group"
                >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Voltar
            </button>

            {/* Cabeçalho */}
            <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center text-cyan-600">
                <Shield className="w-6 h-6" />
            </div>
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Política de Privacidade</h1>
                <p className="text-sm text-slate-400 font-medium mt-1">Última atualização: Maio de 2026</p>
            </div>
            </div>

            {/* Conteúdo Jurídico Textual */}
            <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 md:p-12 shadow-xl shadow-slate-200/40 border border-slate-100 prose prose-slate max-w-none text-slate-600 space-y-8"
            >
            <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-800">1. Compromisso Geral</h2>
                <p className="leading-relaxed text-justify text-sm">
                O <strong>Observatório de Transformação Digital do Estado de São Paulo (OTDSP)</strong> tem como prioridade a transparência e a segurança no tratamento dos dados dos seus usuários. Esta Política de Privacidade descreve como coletamos, armazenamos e utilizamos suas informações em total conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD).
                </p>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-800">2. Quais dados coletamos e para quê?</h2>
                <p className="leading-relaxed text-justify text-sm">
                Ao se cadastrar de forma voluntária em nossa plataforma, coletamos as seguintes informações:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-sm">
                <li><strong>Identificação pessoal e profissional:</strong> Nome completo, e-mail institucional, telefone/WhatsApp, cargo/função, município sede e a sua instituição pertencente.</li>
                <li><strong>Finalidade de Coleta:</strong> Os dados profissionais são coletados para validação interna de sua atuação e para a <strong>geração de relatórios estatísticos e insights agregados (anonimizados)</strong> sobre a maturidade da transformação digital das organizações de São Paulo.</li>
                <li><strong>Comunicação e Agendamentos:</strong> Seus dados de contato (e-mail e telefone) são de uso estritamente institucional para viabilizar o suporte técnico, a moderação de acessos e a <strong>comunicação/agendamentos de reuniões e engajamentos</strong> com nossa equipe.</li>
                </ul>
            </section>

            <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-800">3. Segurança e Compartilhamento</h2>
                <p className="leading-relaxed text-justify text-sm">
                A base de dados da OTDSP é armazenada sob rígidos protocolos de segurança em infraestrutura na nuvem (fornecida via Supabase), garantindo criptografia em trânsito e em repouso. 
                </p>
                <p className="leading-relaxed text-justify text-sm">
                Não comercializamos, não alugamos e não compartilhamos seus dados pessoais com nenhuma empresa privada ou terceiros para fins publicitários ou mercadológicos.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-bold text-slate-800">4. Quais são os seus direitos?</h2>
                <p className="leading-relaxed text-justify text-sm">
                Como titular das informações, a LGPD garante a você direitos fundamentais que podem ser exercidos diretamente no seu painel ou entrando em contato conosco:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-slate-50 rounded-xl flex gap-3">
                    <Eye className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-600"><strong>Confirmação e Acesso:</strong> Direito de saber se tratamos seus dados e consultá-los a qualquer momento no seu perfil.</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl flex gap-3">
                    <RefreshCw className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-600"><strong>Correção:</strong> Direito de solicitar a alteração de dados incompletos, inexatos ou desatualizados em sua conta.</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl flex gap-3">
                    <Trash2 className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-600"><strong>Eliminação:</strong> Direito de requerer a exclusão permanente do seu perfil e a revogação do consentimento de armazenamento.</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl flex gap-3">
                    <Lock className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-600"><strong>Segurança jurídica:</strong> Garantia de auditoria da base legal para procedimentos operacionais regulamentares.</p>
                </div>
                </div>
            </section>

            <section className="pt-6 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-400">
                Para dúvidas sobre nossa política ou solicitações diretas sobre LGPD, entre em contato através do e-mail oficial do suporte OTDSP.
                </p>
            </section>

            </motion.div>
        </div>
        </div>
    )
}