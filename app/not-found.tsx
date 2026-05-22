import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-[#0F172A] font-sans">
      <h2 className="text-4xl font-bold mb-4">Página não encontrada</h2>
      <p className="mb-6">Desculpe, não conseguimos encontrar a página que você está procurando.</p>
      <Link href="/" className="px-6 py-3 bg-cyan-600 text-white rounded-full hover:bg-cyan-700 transition-colors">
        Voltar ao início
      </Link>
    </div>
  )
}
