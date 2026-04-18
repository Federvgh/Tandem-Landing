/* ========================================
   TANDEM STUDIO - MAIN JAVASCRIPT
   Animations & Interactions
======================================== */

// Enable progressive enhancement — CSS uses .js prefix for animations.
// Without this class, [data-animate] stays visible (no-JS fallback).
document.documentElement.classList.add('js');

// ========================================
// UTILITY FUNCTIONS
// ========================================
const select = (el, all = false) => {
    return all ? [...document.querySelectorAll(el)] : document.querySelector(el);
};

const addClass = (el, className) => el && el.classList.add(className);
const removeClass = (el, className) => el && el.classList.remove(className);
const toggleClass = (el, className) => el && el.classList.toggle(className);

// ========================================
// HEADER SCROLL BEHAVIOR
// ========================================
const header = select('#header');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
        addClass(header, 'scrolled');
    } else {
        removeClass(header, 'scrolled');
    }

    lastScroll = currentScroll;
});

// ========================================
// MOBILE NAVIGATION
// ========================================
const navToggle = select('#nav-toggle');
const navMenu = select('#nav-menu');

if (navToggle) {
    navToggle.addEventListener('click', () => {
        toggleClass(navToggle, 'active');
        toggleClass(navMenu, 'active');
        document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    });
}

// Close menu when clicking on a link
const navLinks = select('.nav__link', true);
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        // If it's not a dropdown trigger
        if (!link.closest('.nav__dropdown') || link.getAttribute('href') !== '#') {
            removeClass(navToggle, 'active');
            removeClass(navMenu, 'active');
            document.body.style.overflow = '';
        }
    });
});

// ========================================
// DROPDOWN MENU (MOBILE)
// ========================================
const dropdowns = select('.nav__dropdown', true);

dropdowns.forEach(dropdown => {
    const link = dropdown.querySelector('.nav__link');
    const menu = dropdown.querySelector('.nav__dropdown-menu');

    if (window.innerWidth <= 768) {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            dropdown.classList.toggle('active');

            if (menu) {
                menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
            }
        });
    }
});

// ========================================
// LANGUAGE SWITCHER
// ========================================
const langButtons = select('.lang__btn', true);

langButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const lang = btn.dataset.lang;

        // Remove active from all
        langButtons.forEach(b => removeClass(b, 'active'));

        // Add active to clicked
        addClass(btn, 'active');

        // Detect if running on GitHub Pages or custom domain (AWS)
        const basePath = window.location.hostname.includes('github.io') ? '/tandem-new' : '';

        // Redirect to appropriate language
        if (lang === 'en') {
            window.location.href = `${basePath}/en/index.html`;
        } else {
            window.location.href = `${basePath}/`;
        }
    });
});

// ========================================
// SCROLL ANIMATIONS (INTERSECTION OBSERVER)
// ========================================
const animateOnScroll = () => {
    const elements = select('[data-animate]', true);

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    addClass(entry.target, 'animated');
                }, index * 100); // Stagger effect
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    elements.forEach(el => observer.observe(el));
};

// Initialize scroll animations
animateOnScroll();

// ========================================
// STATS COUNTER ANIMATION
// ========================================
const animateCounter = (element, target, duration = 2000) => {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;

    const updateCounter = () => {
        current += increment;
        if (current < target) {
            element.textContent = Math.floor(current);
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target;
        }
    };

    updateCounter();
};

const statNumbers = select('.stat__number', true);

if (statNumbers.length > 0) {
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseFloat(entry.target.dataset.target);
                if (target) {
                    animateCounter(entry.target, target);
                }
                statsObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.5
    });

    statNumbers.forEach(stat => {
        if (stat.dataset.target) {
            statsObserver.observe(stat);
        }
    });
}

// ========================================
// SMOOTH SCROLL FOR ANCHOR LINKS
// ========================================
const anchorLinks = select('a[href^="#"]', true);

anchorLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');

        // Skip if it's just "#" (dropdown triggers)
        if (href === '#') return;

        const target = select(href);

        if (target) {
            e.preventDefault();

            const headerHeight = header.offsetHeight;
            const targetPosition = target.offsetTop - headerHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });

            // Close mobile menu if open
            removeClass(navToggle, 'active');
            removeClass(navMenu, 'active');
            document.body.style.overflow = '';
        }
    });
});

// ========================================
// PARTICLES ANIMATION (HERO BACKGROUND)
// ========================================
const createParticles = () => {
    const heroParticles = select('.hero__particles');

    if (!heroParticles) return;

    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';

        // Random position
        particle.style.cssText = `
            position: absolute;
            width: ${Math.random() * 3 + 1}px;
            height: ${Math.random() * 3 + 1}px;
            background: rgba(0, 102, 255, ${Math.random() * 0.5 + 0.2});
            border-radius: 50%;
            top: ${Math.random() * 100}%;
            left: ${Math.random() * 100}%;
            animation: float ${Math.random() * 10 + 10}s infinite ease-in-out;
            animation-delay: ${Math.random() * 5}s;
        `;

        heroParticles.appendChild(particle);
    }
};

// Initialize particles
createParticles();

// ========================================
// FORM VALIDATION (for future contact forms)
// ========================================
const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

const handleFormSubmit = (form) => {
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = form.querySelector('input[type="email"]');

        if (email && !validateEmail(email.value)) {
            alert('Por favor, ingresa un email válido');
            return;
        }

        // Here you would typically send the form data
        console.log('Form submitted');
    });
};

// Initialize forms if they exist
const forms = select('form', true);
forms.forEach(form => handleFormSubmit(form));

// ========================================
// PRELOAD CRITICAL IMAGES
// ========================================
const preloadImages = () => {
    const images = [
        'assets/images/logos/clients/tandem2.png'
    ];

    images.forEach(src => {
        const img = new Image();
        img.src = src;
    });
};

preloadImages();

// ========================================
// PERFORMANCE: DEBOUNCE FUNCTION
// ========================================
const debounce = (func, wait = 10) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// ========================================
// WINDOW RESIZE HANDLER
// ========================================
let windowWidth = window.innerWidth;

window.addEventListener('resize', debounce(() => {
    const newWidth = window.innerWidth;

    // Only reload if crossing mobile/desktop breakpoint
    if ((windowWidth <= 768 && newWidth > 768) || (windowWidth > 768 && newWidth <= 768)) {
        windowWidth = newWidth;

        // Reset mobile menu
        removeClass(navToggle, 'active');
        removeClass(navMenu, 'active');
        document.body.style.overflow = '';

        // Reset dropdowns
        dropdowns.forEach(dropdown => {
            const menu = dropdown.querySelector('.nav__dropdown-menu');
            if (menu) {
                menu.style.display = '';
            }
        });
    }

    windowWidth = newWidth;
}, 250));

// ========================================
// PAGE LOAD ANIMATION
// ========================================
window.addEventListener('load', () => {
    document.body.classList.add('loaded');

    // Animate hero section
    const heroContent = select('.hero__content');
    if (heroContent) {
        heroContent.style.animation = 'fadeInUp 1s ease';
    }
});

// ========================================
// ACCESSIBILITY: KEYBOARD NAVIGATION
// ========================================
document.addEventListener('keydown', (e) => {
    // Close mobile menu on Escape
    if (e.key === 'Escape') {
        if (navMenu && navMenu.classList.contains('active')) {
            removeClass(navToggle, 'active');
            removeClass(navMenu, 'active');
            document.body.style.overflow = '';
        }
    }
});

// ========================================
// CONSOLE MESSAGE
// ========================================
console.log('%c🚀 Tandem Studio', 'color: #0066FF; font-size: 20px; font-weight: bold;');
console.log('%ctransparency | team first | think big', 'color: #64748B; font-size: 12px;');
console.log('%cDesarrollado con tecnología moderna y optimizado para performance', 'color: #64748B; font-size: 10px;');

// ========================================
// EXPORT FOR POTENTIAL MODULE USE
// ========================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        select,
        addClass,
        removeClass,
        toggleClass,
        debounce,
        validateEmail
    };
}
