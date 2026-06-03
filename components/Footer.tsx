'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Mail, Phone, MapPin, Linkedin, Instagram, Shield } from 'lucide-react';

const basePath = process.env.__NEXT_ROUTER_BASEPATH || '';

export default function Footer() {
  return (
    <footer id="footer" className="w-full bg-white border-t border-slate-200 pt-16 pb-8 text-slate-500 font-sans mt-auto overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
          
          {/* Logo & Info */}
          <div className="md:col-span-4 lg:col-span-5">
            <div className="flex items-center gap-2 md:gap-4 mb-6 select-none max-w-full">
              <Link href="/" className="flex items-center gap-2 md:gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded-sm shrink-0">
                <Image src={`${basePath}/logo.png`} alt="OTDSP Logo" width={200} height={40} className="h-8 md:h-10 w-auto object-contain" />
                <div className="h-6 md:h-8 w-px bg-slate-200 shrink-0" />
                <Image src={`${basePath}/inovausp.png`} alt="Inova USP Logo" width={280} height={56} className="h-10 md:h-14 w-auto object-contain" />
              </Link>
            </div>
            <p className="text-sm font-medium leading-relaxed max-w-sm text-slate-500">
              Conectando inovação, dados e desenvolvimento para o avanço dos municípios no Estado de São Paulo.
            </p>
          </div>

          {/* Connect */}
          <div className="md:col-span-5 lg:col-span-4">
            <h4 className="font-bold text-slate-800 mb-3 text-xs uppercase tracking-[0.15em]">Contato</h4>
            <ul className="text-sm font-medium text-slate-500">
              <li className="border-b border-slate-200/60 last:border-0 py-2">
                <div className="flex items-center gap-3 w-full">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <a href="mailto:observatorio.estado.sp@gmail.com" className="text-slate-500 hover:text-cyan-600 transition-all hover:underline underline-offset-4 decoration-cyan-600/30 select-text">
                    observatorio.estado.sp@gmail.com
                  </a>
                </div>
              </li>
              <li className="border-b border-slate-200/60 last:border-0 py-2">
                <div className="flex items-center gap-3 w-full">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <a href="https://wa.me/5511970830876" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-cyan-600 transition-all hover:underline underline-offset-4 decoration-cyan-600/30 select-text">
                    (11) 97083-0876
                  </a>
                </div>
              </li>
              <li className="border-b border-slate-200/60 last:border-0 py-2">
                <div className="flex items-center gap-3 w-full">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <a href="https://maps.google.com/?q=Av.+Prof.+Lúcio+Martins+Rodrigues,+370+-+Butantã,+São+Paulo+-+SP,+05508-020" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-cyan-600 transition-all hover:underline underline-offset-4 decoration-cyan-600/30 select-text inline-block">
                    Av. Prof. Lúcio Martins Rodrigues, 370<br />São Paulo - SP
                  </a>
                </div>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div className="md:col-span-3 lg:col-span-3">
            <h4 className="font-bold text-slate-800 mb-3 text-xs uppercase tracking-[0.15em]">Redes Sociais</h4>
            <ul className="text-sm font-medium text-slate-500">
              <li className="border-b border-slate-200/60 last:border-0 py-2">
                <div className="flex items-center gap-3 w-full">
                  <Linkedin className="w-4 h-4 text-slate-400 shrink-0" />
                  <a href="https://www.linkedin.com/company/otdsp" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-cyan-600 transition-all hover:underline underline-offset-4 decoration-cyan-600/30">
                    LinkedIn
                  </a>
                </div>
              </li>
              <li className="border-b border-slate-200/60 last:border-0 py-2">
                <div className="flex items-center gap-3 w-full">
                  <Instagram className="w-4 h-4 text-slate-400 shrink-0" />
                  <a href="https://www.instagram.com/otdsp.usp" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-cyan-600 transition-all hover:underline underline-offset-4 decoration-cyan-600/30">
                    Instagram
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Bar: Copyright & Legal */}
        <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-slate-400">
          <p className="text-center md:text-left tracking-wide">
            © 2026 Observatório de Transformação Digital do Estado de São Paulo
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <Link 
              href="/privacidade" 
              className="flex items-center gap-1.5 text-slate-500 hover:text-cyan-600 transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              Política de Privacidade
            </Link>
            
            <span className="hidden sm:inline text-slate-200">|</span>
            
            <p className="text-center md:text-right tracking-wide">
              Todos os direitos reservados.
            </p>
          </div>
        </div>
        
      </div>
    </footer>
  );
}