'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ChevronDown, UserPlus, User, LogOut, Calendar } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const basePath = process.env.__NEXT_ROUTER_BASEPATH || '';

const navItems = [
  { name: 'Início', href: '/' },
  { name: 'Sobre nós', href: '/sobre-nos' },
  {
    name: 'Transversais',
    href: '#',
    dropdown: [
      { name: 'Mulheres', href: '/em-construcao?s=Mulheres' },
      { name: 'Inclusão de alunos com necessidades especiais', href: '/em-construcao?s=Inclusao' },
      { name: 'Igualdade de Gênero', href: '/em-construcao?s=Igualdade' },
      { name: 'LGBTQIA+', href: '/em-construcao?s=LGBTQIA+' },
    ],
  },
  {
    name: 'Tecnologias',
    href: '#',
    dropdown: [
      { name: 'Hardware aberto - Caninos', href: '/em-construcao?s=Caninos' },
    ],
  },
  {
    name: 'Área de Atuação',
    href: '#',
    dropdown: [
      { name: 'Saúde', href: '/em-construcao?s=Saude' },
      { name: 'Segurança', href: '/em-construcao?s=Seguranca' },
      { name: 'Educação', href: '/em-construcao?s=Educacao' },
      { name: 'Meio Ambiente', href: '/em-construcao?s=MeioAmbiente' },
    ],
  },
  {
    name: 'Faça Parte',
    href: '#',
    dropdown: [
      { name: 'Cadastro', href: '/cadastro', icon: UserPlus },
    ],
  },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mobileExpandedIndex, setMobileExpandedIndex] = useState<number | null>(null);
  const [user, setUser] = useState<any>(null);
  
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    await supabase.auth.signOut();
    setMobileMenuOpen(false);
    setMobileExpandedIndex(null);
    router.push('/');
    router.refresh();
  };

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  // Dynamic menu items based on auth state
  const dynamicNavItems = navItems.map((item) => {
    if (item.name === 'Faça Parte') {
      return {
        ...item,
        dropdown: user
          ? [
              { name: 'Meu Perfil', href: '/perfil', icon: User },
              { name: 'Engajamentos', href: '/engajamentos', icon: Calendar },
              { name: 'Sair', href: '#', isLogout: true, icon: LogOut },
            ]
          : [
              { name: 'Entrar', href: '/login', icon: User },
              { name: 'Cadastro', href: '/cadastro', icon: UserPlus },
            ],
      };
    }
    return item;
  });

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/50 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            {/* Logo Group */}
            <div className="flex-shrink-0 flex items-center select-none max-w-[70vw] sm:max-w-none">
              <Link href="/" className="flex items-center gap-2 md:gap-4">
                <Image src={`${basePath}/logo.png`} alt="OTDSP Logo" width={200} height={40} className="h-8 md:h-10 w-auto object-contain" />
                <div className="h-6 md:h-8 w-px bg-slate-200/80 shrink-0" />
                <Image src={`${basePath}/inovausp.png`} alt="Inova USP Logo" width={280} height={56} className="h-10 md:h-14 w-auto object-contain" />
              </Link>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex flex-1 items-center justify-end gap-1">
            {dynamicNavItems.map((item, index) => (
              <div
                key={item.name}
                className="relative flex-none"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <Link
                  href={item.href}
                  className="px-1.5 xl:px-2 py-2 flex items-center gap-1 text-[#0F172A] font-medium transition-colors hover:text-cyan-600 text-[14px] xl:text-[15px] tracking-wide whitespace-nowrap group"
                >
                  {item.name}
                  {item.dropdown && (
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        hoveredIndex === index ? 'rotate-180 text-cyan-600' : 'text-slate-400 group-hover:text-cyan-600'
                      }`}
                    />
                  )}
                </Link>

                {/* Dropdown Menu */}
                {item.dropdown && (
                  <AnimatePresence>
                    {hoveredIndex === index && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute left-0 mt-2 w-56 rounded-2xl bg-white border border-slate-100 shadow-xl shadow-slate-900/5 py-2 z-50 overflow-hidden"
                      >
                        {item.dropdown.map((subItem: any) => (
                          subItem.isLogout ? (
                            <button
                              key={subItem.name}
                              onClick={handleLogout}
                              className="w-full text-left flex items-center gap-2.5 px-5 py-2.5 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50/50 transition-colors font-medium border-0 cursor-pointer group/item"
                            >
                              {subItem.icon && <subItem.icon className="w-4 h-4 text-slate-400 group-hover/item:text-red-500" />}
                              {subItem.name}
                            </button>
                          ) : (
                            <Link
                              key={subItem.name}
                              href={subItem.href}
                              target={subItem.href.startsWith('http') ? "_blank" : undefined}
                              rel={subItem.href.startsWith('http') ? "noopener noreferrer" : undefined}
                              className="flex items-center gap-2.5 px-5 py-2.5 text-sm text-slate-600 hover:text-cyan-600 hover:bg-cyan-50/50 transition-colors font-medium group/item"
                            >
                              {subItem.icon && <subItem.icon className="w-4 h-4 text-slate-400 group-hover/item:text-cyan-500" />}
                              {subItem.name}
                            </Link>
                          )
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-[#0F172A] hover:text-cyan-600 focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden bg-white border-b border-slate-200 overflow-hidden"
          >
            {/* ADICIONANDO ALTURA MÁXIMA E SCROLL */}
            <div className="px-4 pt-2 pb-6 space-y-1 sm:px-6 max-h-[calc(100vh-5rem)] overflow-y-auto">
              {dynamicNavItems.map((item, index) => (
                <div key={item.name} className="py-1">
                  {item.dropdown ? (
                    <>
                      <button
                        onClick={() =>
                          setMobileExpandedIndex(mobileExpandedIndex === index ? null : index)
                        }
                        className="w-full flex items-center justify-between px-3 py-3 text-base font-medium text-[#0F172A] hover:bg-slate-50 hover:text-cyan-600 rounded-xl transition-colors"
                      >
                        {item.name}
                        <ChevronDown
                          className={`w-5 h-5 transition-transform duration-200 ${
                            mobileExpandedIndex === index ? 'rotate-180 text-cyan-600' : 'text-slate-400'
                          }`}
                        />
                      </button>
                      <AnimatePresence>
                        {mobileExpandedIndex === index && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="pl-6 pr-3 overflow-hidden"
                          >
                            <div className="py-2 space-y-1 relative before:absolute before:left-3 before:top-4 before:bottom-4 before:w-px before:bg-slate-200">
                              {item.dropdown.map((subItem: any) => (
                                subItem.isLogout ? (
                                  <button
                                    key={subItem.name}
                                    onClick={handleLogout}
                                    className="w-full text-left flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border-0 cursor-pointer"
                                  >
                                    {subItem.icon && <subItem.icon className="w-5 h-5" />}
                                    {subItem.name}
                                  </button>
                                ) : (
                                  <Link
                                    key={subItem.name}
                                    href={subItem.href}
                                    target={subItem.href.startsWith('http') ? "_blank" : undefined}
                                    rel={subItem.href.startsWith('http') ? "noopener noreferrer" : undefined}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors relative"
                                  >
                                    {subItem.icon && <subItem.icon className="w-5 h-5" />}
                                    {subItem.name}
                                  </Link>
                                )
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-3 text-base font-medium text-[#0F172A] hover:bg-slate-50 hover:text-cyan-600 rounded-xl transition-colors"
                    >
                      {item.name}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
