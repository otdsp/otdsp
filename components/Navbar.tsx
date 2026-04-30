"use client";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [mobileOpen]);

  const links = [
    { name: "Início", href: "#inicio" },
    { name: "Missão", href: "#missao" },
    { name: "Quíntupla Hélice", href: "#helice" },
    { name: "Eixos", href: "#eixos" },
    { name: "Convênios", href: "#convenios" },
    { name: "Linha do Tempo", href: "#timeline" },
    { name: "Contato", href: "#contato" },
  ];

  const handleLinkClick = () => {
    setMobileOpen(false);
  };

  return (
    <header
      className={`fixed top-0 w-full z-40 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.1)] py-4"
          : "bg-white/10 backdrop-blur-md py-6 border-b border-white/20"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <a href="#inicio" className={`font-bold text-2xl tracking-tighter ${scrolled ? "text-[#00A6FF]" : "text-white"}`}>
          OTDSP
        </a>
        
        {/* Desktop Nav */}
        <nav className="hidden lg:flex gap-6">
          {links.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className={`font-medium transition-colors hover:text-[#FFCB00] ${scrolled ? "text-gray-700 hover:text-[#00A6FF]" : "text-white"}`}
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Mobile Toggle */}
        <button
          className="lg:hidden text-2xl focus:outline-none"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? (
            <X className={scrolled ? "text-gray-900" : "text-white"} />
          ) : (
            <Menu className={scrolled ? "text-gray-900" : "text-white"} />
          )}
        </button>
      </div>

      {/* Mobile Nav Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 top-[72px] bg-white z-40 flex flex-col items-center py-8 gap-6 shadow-xl lg:hidden">
          {links.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={handleLinkClick}
              className="text-2xl font-semibold text-gray-800 hover:text-[#00A6FF]"
            >
              {link.name}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
