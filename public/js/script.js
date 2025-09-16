// Smooth scrolling and navigation functionality
document.addEventListener('DOMContentLoaded', function() {
    // Loading screen
    const loadingScreen = document.getElementById('loading');
    if (loadingScreen) {
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
            setTimeout(() => {
                loadingScreen.remove();
            }, 500);
        }, 1000);
    }

    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
            
            // Prevent body scroll when menu is open
            if (navMenu.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // Header background on scroll with throttle
    const header = document.querySelector('.header');
    let ticking = false;
    
    function updateHeader() {
        if (window.scrollY > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.98)';
            header.style.boxShadow = '0 4px 25px rgba(0, 166, 255, 0.15)';
            header.style.borderBottom = '1px solid rgba(0, 166, 255, 0.1)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.boxShadow = 'none';
            header.style.borderBottom = '1px solid rgba(0, 0, 0, 0.1)';
        }
        ticking = false;
    }

    function requestHeaderUpdate() {
        if (!ticking) {
            requestAnimationFrame(updateHeader);
            ticking = true;
        }
    }

    window.addEventListener('scroll', requestHeaderUpdate);

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = target.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Active navigation highlighting with throttle
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    let navigationTicking = false;

    function highlightNavigation() {
        const scrollPosition = window.scrollY + 200;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
        navigationTicking = false;
    }

    function requestNavigationUpdate() {
        if (!navigationTicking) {
            requestAnimationFrame(highlightNavigation);
            navigationTicking = true;
        }
    }

    window.addEventListener('scroll', requestNavigationUpdate);

    // Enhanced Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -80px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                
                // Add stagger effect for cards
                if (entry.target.classList.contains('eixo-card') || 
                    entry.target.classList.contains('helix-element')) {
                    const cards = entry.target.parentElement.children;
                    const index = Array.from(cards).indexOf(entry.target);
                    entry.target.style.animationDelay = `${index * 0.1}s`;
                }
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const elementsToAnimate = document.querySelectorAll(
        '.eixo-card, .helix-element, .timeline-item, .mission-text, .mission-visual, .branch, .contato-item'
    );
    
    elementsToAnimate.forEach(el => {
        observer.observe(el);
    });

    // Counter animation for statistics
    function animateCounters() {
        const counters = document.querySelectorAll('.counter');
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-target'));
            const duration = 2000;
            const step = target / (duration / 16);
            let current = 0;
            
            const timer = setInterval(() => {
                current += step;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                counter.textContent = Math.floor(current);
            }, 16);
        });
    }

    // Enhanced hero section parallax effect with throttle
    let parallaxTicking = false;
    
    function updateParallax() {
        const scrolled = window.pageYOffset;
        const hero = document.querySelector('.hero');
        const heroBackground = document.querySelector('.hero-bg-img');
        
        if (hero && heroBackground) {
            const rate = scrolled * -0.3;
            heroBackground.style.transform = `translateY(${rate}px)`;
        }
        parallaxTicking = false;
    }

    function requestParallaxUpdate() {
        if (!parallaxTicking) {
            requestAnimationFrame(updateParallax);
            parallaxTicking = true;
        }
    }

    window.addEventListener('scroll', requestParallaxUpdate);

    // Enhanced helix elements interaction
    const helixElements = document.querySelectorAll('.helix-element');
    helixElements.forEach(element => {
        element.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.05)';
            this.style.zIndex = '10';
            
            // Add subtle glow effect to other elements
            helixElements.forEach(otherElement => {
                if (otherElement !== this) {
                    otherElement.style.opacity = '0.7';
                    otherElement.style.filter = 'blur(1px)';
                }
            });
        });

        element.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.zIndex = '1';
            
            // Remove effects
            helixElements.forEach(otherElement => {
                otherElement.style.opacity = '1';
                otherElement.style.filter = 'none';
            });
        });
    });

    // Enhanced cycle items interaction
    const cycleItems = document.querySelectorAll('.cycle-item');
    cycleItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            // Pause arrow animations temporarily
            document.querySelectorAll('.flow-arrow').forEach(arrow => {
                arrow.style.animationPlayState = 'paused';
            });
            
            // Highlight this item
            this.style.zIndex = '10';
        });

        item.addEventListener('mouseleave', function() {
            // Resume arrow animations
            document.querySelectorAll('.flow-arrow').forEach(arrow => {
                arrow.style.animationPlayState = 'running';
            });
            
            this.style.zIndex = '2';
        });

        // Add click interaction for mobile
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const label = this.querySelector('.cycle-label').textContent;
            showNotification(`Clicou em: ${label}`, 'info');
        });
    });

    // Enhanced timeline scroll animation with stagger
    let timelineTicking = false;
    
    function animateTimeline() {
        const timelineItems = document.querySelectorAll('.timeline-item');
        const windowHeight = window.innerHeight;
        
        timelineItems.forEach((item, index) => {
            const itemTop = item.getBoundingClientRect().top;
            if (itemTop < windowHeight * 0.8 && !item.classList.contains('animate-in')) {
                setTimeout(() => {
                    item.classList.add('animate-in');
                    
                    // Add marker animation
                    const marker = item.querySelector('.timeline-marker');
                    if (marker) {
                        marker.style.animation = 'none';
                        setTimeout(() => {
                            marker.style.animation = '';
                        }, 100);
                    }
                }, index * 150);
            }
        });
        timelineTicking = false;
    }

    function requestTimelineUpdate() {
        if (!timelineTicking) {
            requestAnimationFrame(animateTimeline);
            timelineTicking = true;
        }
    }

    window.addEventListener('scroll', requestTimelineUpdate);

    // Enhanced contact form handling (if exists)
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const nome = formData.get('nome');
            const email = formData.get('email');
            const interesse = formData.get('interesse');
            const mensagem = formData.get('mensagem');

            // Enhanced validation
            if (!nome || nome.trim().length < 2) {
                showNotification('Por favor, insira um nome válido (mín. 2 caracteres).', 'error');
                return;
            }

            if (!email || !isValidEmail(email)) {
                showNotification('Por favor, insira um e-mail válido.', 'error');
                return;
            }

            if (!interesse) {
                showNotification('Por favor, selecione seu interesse.', 'error');
                return;
            }

            if (!mensagem || mensagem.trim().length < 10) {
                showNotification('Por favor, insira uma mensagem (mín. 10 caracteres).', 'error');
                return;
            }

            // Simulate form submission with loading state
            const submitBtn = this.querySelector('.submit-btn');
            const originalText = submitBtn.textContent;
            const originalBg = submitBtn.style.background;
            
            submitBtn.textContent = 'Enviando...';
            submitBtn.disabled = true;
            submitBtn.style.background = 'linear-gradient(135deg, #6b7280, #9ca3af)';

            setTimeout(() => {
                showNotification('Mensagem enviada com sucesso! Entraremos em contato em breve.', 'success');
                this.reset();
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                submitBtn.style.background = originalBg;
                
                // Add success animation
                submitBtn.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    submitBtn.style.transform = 'scale(1)';
                }, 200);
            }, 2500);
        });
    }

    // Enhanced email validation
    function isValidEmail(email) {
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return emailRegex.test(email);
    }

    // Enhanced notification system
    function showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => notification.remove(), 300);
        });

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        // Mudei isso aqui para evitar XSS (Cross-Site Scripting)

        /*
        notification.innerHTML = `
            <div class="notification-content">
                <i class="${icons[type] || icons.info}"></i>
                <span>${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        */

        // Create main content
        const content = document.createElement('div');
        content.className = 'notification-content';

        // Create icon
        const icon = document.createElement('i');
        icon.className = icons[type] || icons.info;

        // Create span
        const messageSpan = document.createElement('span');
        messageSpan.textContent = message; // textContent escapa automaticamente HTML

        // Create close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'notification-close';
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        closeBtn.onclick = () => notification.remove();

        // Structure
        content.appendChild(icon);
        content.appendChild(messageSpan);
        content.appendChild(closeBtn);
        notification.appendChild(content);

        // Add notification styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            min-width: 300px;
            max-width: 400px;
            padding: 1rem;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            transform: translateX(400px);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(10px);
        `;

        // Type-specific styling
        const typeStyles = {
            success: 'background: linear-gradient(135deg, #10b981, #059669); color: white;',
            error: 'background: linear-gradient(135deg, #ef4444, #dc2626); color: white;',
            warning: 'background: linear-gradient(135deg, #f59e0b, #d97706); color: white;',
            info: 'background: linear-gradient(135deg, #00A6FF, #0080cc); color: white;'
        };

        notification.style.cssText += typeStyles[type] || typeStyles.info;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Auto remove after delay
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.transform = 'translateX(400px)';
                setTimeout(() => notification.remove(), 300);
            }
        }, type === 'error' ? 6000 : 4000);
    }

    // Enhanced iframe loading for calendar
    const iframe = document.querySelector('.iframe-container iframe');
    if (iframe) {
        iframe.addEventListener('load', function() {
            this.style.opacity = '1';
            this.style.transform = 'scale(1)';
        });
        
        iframe.style.opacity = '0';
        iframe.style.transform = 'scale(0.95)';
        iframe.style.transition = 'all 0.5s ease';
    }

    // Enhanced branch cards interaction
    const branches = document.querySelectorAll('.branch');
    branches.forEach(branch => {
        const listItems = branch.querySelectorAll('li');
        
        branch.addEventListener('mouseenter', function() {
            listItems.forEach((item, index) => {
                setTimeout(() => {
                    item.style.transform = 'translateX(10px)';
                    item.style.color = '#374151';
                }, index * 50);
            });
        });

        branch.addEventListener('mouseleave', function() {
            listItems.forEach(item => {
                item.style.transform = 'translateX(0)';
                item.style.color = '#6b7280';
            });
        });
    });

    // Add keyboard navigation for accessibility
    document.addEventListener('keydown', function(e) {
        // ESC key closes mobile menu
        if (e.key === 'Escape') {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        }

        // Tab navigation enhancement
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
        }
    });

    document.addEventListener('mousedown', function() {
        document.body.classList.remove('keyboard-navigation');
    });

    // Enhanced scroll-to-top functionality
    const scrollToTopBtn = document.createElement('button');
    scrollToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    scrollToTopBtn.className = 'scroll-to-top';
    scrollToTopBtn.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        border: none;
        border-radius: 50%;
        background: linear-gradient(135deg, #00A6FF, #FFCB00);
        color: white;
        font-size: 18px;
        cursor: pointer;
        z-index: 1000;
        opacity: 0;
        transform: translateY(100px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 15px rgba(0, 166, 255, 0.3);
    `;

    scrollToTopBtn.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.body.appendChild(scrollToTopBtn);

    // Show/hide scroll to top button
    let scrollToTopTicking = false;
    
    function updateScrollToTop() {
        if (window.scrollY > 300) {
            scrollToTopBtn.style.opacity = '1';
            scrollToTopBtn.style.transform = 'translateY(0)';
        } else {
            scrollToTopBtn.style.opacity = '0';
            scrollToTopBtn.style.transform = 'translateY(100px)';
        }
        scrollToTopTicking = false;
    }

    function requestScrollToTopUpdate() {
        if (!scrollToTopTicking) {
            requestAnimationFrame(updateScrollToTop);
            scrollToTopTicking = true;
        }
    }

    window.addEventListener('scroll', requestScrollToTopUpdate);

    // Performance optimization: debounce resize events
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            // Recalculate positions after resize
            highlightNavigation();
        }, 250);
    });

    // Initialize components
    setTimeout(() => {
        highlightNavigation();
        updateHeader();
        animateTimeline();
    }, 100);

    // Add smooth reveal animation to page load
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);

    // Console welcome message
    console.log(`
    🚀 Observatório Digital SP
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ✨ Website carregado com sucesso!
    🔗 Conectando ciência e transformação digital
    📧 Contato: contato@otdsp.usp.br
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
});

// Global utility functions
window.showNotification = function(message, type = 'info') {
    const event = new CustomEvent('showNotification', { 
        detail: { message, type } 
    });
    document.dispatchEvent(event);
};

// Service Worker registration for performance (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
            })
            .catch(function(err) {
                console.log('ServiceWorker registration failed');
            });
    });
}
