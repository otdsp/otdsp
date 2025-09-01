// ===== AGUARDA O CARREGAMENTO COMPLETO DA PÁGINA =====
document.addEventListener('DOMContentLoaded', function() {
    
    // ===== NAVEGAÇÃO SUAVE (SMOOTH SCROLL) =====
    // Seleciona todos os links de navegação interna
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault(); // Previne comportamento padrão do link
            
            // Pega o ID do elemento alvo
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                // Calcula a posição considerando o header fixo
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight;
                
                // Faz o scroll suave até o elemento
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // ===== MENU MOBILE (HAMBURGER) =====
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    // Função para abrir/fechar menu mobile
    function toggleMobileMenu() {
        navMenu.classList.toggle('active');
        hamburger.classList.toggle('active');
    }
    
    // Event listener para o botão hamburger
    if (hamburger) {
        hamburger.addEventListener('click', toggleMobileMenu);
    }
    
    // Fecha menu mobile ao clicar em um link
    const navMenuLinks = document.querySelectorAll('.nav-link');
    navMenuLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            hamburger.classList.remove('active');
        });
    });
    
    // Fecha menu mobile ao clicar fora dele
    document.addEventListener('click', function(e) {
        if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
            navMenu.classList.remove('active');
            hamburger.classList.remove('active');
        }
    });
    
    // ===== HEADER COM SCROLL =====
    // Adiciona efeito no header conforme o usuário faz scroll
    const header = document.querySelector('.header');
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Adiciona classe para estilizar header no scroll
        if (scrollTop > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        lastScrollTop = scrollTop;
    });
    
    // ===== FORMULÁRIO DE CONTATO =====
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Previne envio padrão do formulário
            
            // Coleta dados do formulário
            const formData = new FormData(this);
            const name = formData.get('name');
            const email = formData.get('email');
            const message = formData.get('message');
            
            // Validação básica
            if (!name || !email || !message) {
                showMessage('Por favor, preencha todos os campos.', 'error');
                return;
            }
            
            if (!isValidEmail(email)) {
                showMessage('Por favor, insira um email válido.', 'error');
                return;
            }
            
            // Simula envio do formulário
            // Em um projeto real, você faria uma requisição para seu backend
            showMessage('Mensagem enviada com sucesso! Entraremos em contato em breve.', 'success');
            
            // Limpa o formulário
            this.reset();
        });
    }
    
    // ===== FUNÇÕES AUXILIARES =====
    
    // Valida formato de email
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // Mostra mensagem para o usuário
    function showMessage(message, type) {
        // Remove mensagem anterior se existir
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Cria elemento de mensagem
        const messageElement = document.createElement('div');
        messageElement.className = `message message-${type}`;
        messageElement.textContent = message;
        
        // Estilos inline para a mensagem
        messageElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 9999;
            animation: slideIn 0.3s ease;
            background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        `;
        
        // Adiciona animação CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
        
        // Adiciona mensagem ao DOM
        document.body.appendChild(messageElement);
        
        // Remove mensagem após 5 segundos
        setTimeout(() => {
            messageElement.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => {
                messageElement.remove();
                style.remove();
            }, 300);
        }, 5000);
    }
    
    // ===== ANIMAÇÕES DE ENTRADA =====
    // Observa elementos entrando na viewport
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeInUp 1s ease forwards';
                observer.unobserve(entry.target); // Para de observar após animar
            }
        });
    }, observerOptions);
    
    // Aplica animação aos cards de features
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.animationDelay = `${index * 0.2}s`;
        observer.observe(card);
    });
    
    // ===== PERFORMANCE E OTIMIZAÇÃO =====
    // Debounce para eventos de scroll
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // ===== DETECTA PREFERÊNCIA DE MOVIMENTO REDUZIDO =====
    // Respeita configuração de acessibilidade do usuário
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    if (prefersReducedMotion.matches) {
        // Remove animações se usuário preferir movimento reduzido
        document.querySelectorAll('*').forEach(el => {
            el.style.animationDuration = '0.01ms !important';
            el.style.animationIterationCount = '1 !important';
            el.style.transitionDuration = '0.01ms !important';
        });
    }
});

// ===== EVENT LISTENERS GLOBAIS =====

// Previne scroll horizontal em dispositivos touch
document.addEventListener('touchmove', function(e) {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });

// Melhora performance em dispositivos móveis
let resizeTimer;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
        // Código a ser executado após resize parar
        console.log('Resize finalizado');
    }, 250);
});
