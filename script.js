gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    if (window.location.hash) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    setTimeout(() => {
        window.scrollTo(0, 0);
    }, 0);

    // --- 1. Liquid Background Logic ---
    const blobs = document.querySelectorAll('.blob');
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let scrollY = 0;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // Use GSAP ticker for smoother performance
    gsap.ticker.add((time, deltaTime) => {
        scrollY = window.scrollY;
        
        blobs.forEach((blob, index) => {
            // Parallax factors
            const speed = 0.5 + (index * 0.1);
            const timeVal = Date.now() * 0.001;
            
            // Circular motion
            const offsetX = Math.sin(timeVal * speed + index) * 30;
            const offsetY = Math.cos(timeVal * speed + index) * 30;
            
            // Mouse Parallax
            const parallaxX = (mouseX - window.innerWidth / 2) * (0.02 + index * 0.01);
            const parallaxY = (mouseY - window.innerHeight / 2) * (0.02 + index * 0.01);
            
            // Scroll Lag
            const scrollOffset = scrollY * (0.15 + index * 0.05);

            gsap.set(blob, {
                x: offsetX + parallaxX,
                y: offsetY + parallaxY - scrollOffset
            });
        });
    });

    // --- 2. Dynamic SVG Path Drawing ---
    const svg = document.querySelector('#scroll-svg');
    const path = document.querySelector('#scroll-path');
    const targets = document.querySelectorAll('.path-target');

    function updatePath() {
        if (!targets.length) return;

        const isMobile = window.innerWidth <= 768;
        const points = [];
        const centerX = window.innerWidth / 2;

        points.push({ x: centerX, y: 0 });

        targets.forEach((target, index) => {
            const rect = target.getBoundingClientRect();
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const cardCenterY = rect.top + scrollTop + rect.height / 2;

            if (isMobile) {
                const baseOffset = Math.min(rect.width / 2 + 40, window.innerWidth * 0.3);
                const dir = index % 2 === 0 ? -1 : 1;
                const sideX = centerX + dir * baseOffset;
                points.push({ x: sideX, y: cardCenterY });
            } else {
                const cardCenterX = rect.left + rect.width / 2;
                points.push({ x: cardCenterX, y: cardCenterY });
            }
        });

        const endY = document.body.scrollHeight;
        points.push({ x: centerX, y: endY });

        let d = `M ${points[0].x} ${points[0].y}`;
        
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i+1];
            
            const cp1x = p1.x;
            const cp1y = p1.y + (p2.y - p1.y) * 0.5;
            
            const cp2x = p2.x;
            const cp2y = p2.y - (p2.y - p1.y) * 0.5;

            d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
        }

        path.setAttribute('d', d);

        // Re-initialize ScrollTrigger animation
        const length = path.getTotalLength();
        path.style.strokeDasharray = length;
        path.style.strokeDashoffset = length;
        
        // Kill old trigger if exists to avoid conflict? 
        // Actually simple property tween is safer to overwrite
        ScrollTrigger.getById("pathDrawer")?.kill();
        
        gsap.to(path, {
            id: "pathDrawer",
            strokeDashoffset: 0,
            ease: "none",
            scrollTrigger: {
                trigger: "body",
                start: "top top",
                end: "bottom bottom",
                scrub: 1
            }
        });
    }

    // Debounced Resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(updatePath, 100);
    });
    
    // Initial Call (wait for layout)
    setTimeout(updatePath, 100);


    // --- 3. Content "Pop" Interactions ---
    const popElements = document.querySelectorAll('.pop-in');

    popElements.forEach((el) => {
        let xVal = 0;
        let yVal = 60;
        let scaleVal = 0.9;

        if (window.innerWidth > 768) {
            if (el.closest('.left-align') && el.classList.contains('feature-card')) {
                xVal = -50;
            } else if (el.closest('.right-align') && el.classList.contains('feature-card')) {
                xVal = 50;
            }
        }

        gsap.fromTo(el, 
            { 
                autoAlpha: 0, 
                y: yVal, 
                x: xVal, 
                scale: scaleVal 
            },
            {
                duration: 1.0,
                autoAlpha: 1,
                y: 0,
                x: 0,
                scale: 1,
                ease: "power3.out", 
                scrollTrigger: {
                    trigger: el,
                    start: "top 90%", 
                    toggleActions: "play none none reverse" 
                }
            }
        );
    });

    // --- 4. Tilt Effect (Disable on mobile) ---
    if (window.matchMedia("(min-width: 769px)").matches) {
        const cards = document.querySelectorAll('.glass-card');
        cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = ((y - centerY) / centerY) * -4;
                const rotateY = ((x - centerX) / centerX) * 4;
                
                gsap.to(card, {
                    duration: 0.5,
                    transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
                    ease: "power2.out"
                });
            });
            
            card.addEventListener('mouseleave', () => {
                gsap.to(card, {
                    duration: 0.5,
                    transform: `perspective(1000px) rotateX(0) rotateY(0)`,
                    ease: "power2.out"
                });
            });
        });
    }

    // --- 5. UI Simulations (Typing) ---
    const heroInput = document.querySelector('.typing-text-hero');
    if (heroInput) {
        const text = "2024_年度计划_Final.pdf";
        let i = 0;
        function typeHero() {
            if (i < text.length) {
                heroInput.textContent = text.substring(0, i+1);
                i++;
                setTimeout(typeHero, 100 + Math.random()*50);
            } else {
                setTimeout(() => { i=0; heroInput.textContent=""; typeHero(); }, 3000);
            }
        }
        setTimeout(typeHero, 1000);
    }

    // --- 6. Mobile Menu ---
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
        
        // Close menu when link clicked
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }

    // --- 7. Feature 1: Search & Loading Animation ---
    const feature1Section = document.querySelector('#search');
    const searchBarSmall = feature1Section?.querySelector('.search-bar');
    const searchInputSmall = searchBarSmall?.querySelector('.typing-text');
    const searchResults = feature1Section?.querySelector('.search-results-mini');
    
    if (searchBarSmall && searchInputSmall && searchResults) {
        // Prepare elements
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        searchBarSmall.appendChild(spinner);
        
        const results = searchResults.querySelectorAll('.result-row');
        gsap.set(results, { autoAlpha: 0, x: -10 });
        gsap.set(spinner, { display: 'none' });
        
        // Create timeline
        const searchTL = gsap.timeline({
            scrollTrigger: {
                trigger: feature1Section,
                start: "top 60%",
            },
            repeat: -1,
            repeatDelay: 3
        });
        
        const searchText = "年度报表.pdf";
        searchInputSmall.textContent = "";
        
        // 1. Type text (Proxy method)
        const typeObj = { len: 0 };
        searchTL.to(typeObj, {
            len: searchText.length,
            duration: 1.5,
            ease: "none",
            onUpdate: () => {
                searchInputSmall.textContent = searchText.substring(0, Math.round(typeObj.len));
            }
        });
        
        // 2. Show Spinner
        searchTL.to(spinner, { display: 'block', duration: 0.1 });
        searchTL.to({}, { duration: 1.0 }); // Wait (Loading...)
        searchTL.to(spinner, { display: 'none', duration: 0.1 });
        
        // 3. Show Results
        searchTL.to(results, {
            autoAlpha: 1,
            x: 0,
            stagger: 0.1,
            duration: 0.5
        });
        
        // 4. Hold then Reset
        searchTL.to({}, { duration: 3 });
        searchTL.to([results], {
            autoAlpha: 0,
            duration: 0.5
        });
        searchTL.add(() => {
             searchInputSmall.textContent = "";
             gsap.set(results, { autoAlpha: 0, x: -10 });
        });
    }

    // --- 8. Feature 2: Preview Popup Animation ---
    const feature2Section = document.querySelector('#preview');
    const previewWindow = feature2Section?.querySelector('.preview-demo');
    const contextMenu = previewWindow?.querySelector('.context-menu-float');
    const previewContent = previewWindow?.querySelector('.preview-content');
    
    if (previewWindow && contextMenu && previewContent) {
        // Init state
        gsap.set(contextMenu, { autoAlpha: 0, scale: 0.5, transformOrigin: "top left" });
        gsap.set(previewContent, { opacity: 0.3, filter: "blur(5px)" }); 
        
        const previewTL = gsap.timeline({
            scrollTrigger: {
                trigger: feature2Section,
                start: "top 60%",
            },
            repeat: -1,
            repeatDelay: 2
        });
        
        // 1. Context Menu Pop
        previewTL.to(contextMenu, {
            autoAlpha: 1,
            scale: 1,
            duration: 0.4,
            ease: "back.out(1.7)"
        });
        
        // 2. Simulate Click "Preview"
        const menuItem = contextMenu.querySelector('.menu-item.active'); 
        previewTL.to(menuItem, {
            backgroundColor: "#0063b1", 
            color: "white",
            duration: 0.2,
            delay: 0.5
        });
        
        // 3. Close Menu & Open Preview
        previewTL.to(contextMenu, {
            autoAlpha: 0,
            duration: 0.2,
            delay: 0.2
        }, "openPreview");
        
        previewTL.to(previewContent, {
            opacity: 1,
            filter: "blur(0px)",
            duration: 0.5
        }, "openPreview");
        
        // 4. Hold then Reset
        previewTL.to({}, { duration: 3 });
        previewTL.to(previewContent, {
            opacity: 0.3,
            filter: "blur(5px)",
            duration: 0.5
        });
        previewTL.set(menuItem, { clearProps: "all" }); // Reset menu item style
    }
});
