'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const navItems = [
  { name: 'Home', href: '/' },
  {
    name: 'Vertentes',
    href: '#',
    dropdown: [
      { name: 'Social', href: '/em-construcao?s=Social' },
      { name: 'Municipal', href: '/em-construcao?s=Municipal' },
    ],
  },
  {
    name: 'Produtos',
    href: '#',
    dropdown: [
      { name: 'Caninos', href: '/em-construcao?s=Caninos' },
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
  { name: 'Contato', href: '/#footer' },
  {
    name: 'Faça Parte',
    href: '#',
    dropdown: [
      { name: 'Login', href: '/login' },
      { name: 'Cadastro', href: '/cadastro' },
    ],
  },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mobileExpandedIndex, setMobileExpandedIndex] = useState<number | null>(null);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/50 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0 flex items-center gap-2">
              <Image src="/logo.png" alt="OTDSP Logo" width={200} height={40} className="h-10 w-auto object-contain" />
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item, index) => (
              <div
                key={item.name}
                className="relative"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <Link
                  href={item.href}
                  className="px-4 py-2 flex items-center gap-1 text-[#0F172A] font-medium transition-colors hover:text-cyan-600 rounded-lg group"
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
                        {item.dropdown.map((subItem) => (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            className="block px-5 py-2.5 text-sm text-slate-600 hover:text-cyan-600 hover:bg-cyan-50/50 transition-colors font-medium"
                          >
                            {subItem.name}
                          </Link>
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
            <div className="px-4 pt-2 pb-6 space-y-1 sm:px-6">
              {navItems.map((item, index) => (
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
                              {item.dropdown.map((subItem) => (
                                <Link
                                  key={subItem.name}
                                  href={subItem.href}
                                  className="block px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors relative"
                                >
                                  {subItem.name}
                                </Link>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    <Link
                      href={item.href}
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
