gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {
    // --- Scroll Restoration ---
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    if (window.location.hash) history.replaceState(null, '', window.location.pathname + window.location.search);
    setTimeout(() => window.scrollTo(0, 0), 0);

    // --- 1. Liquid Background Logic (Preserved) ---
    const blobs = document.querySelectorAll('.blob');
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let scrollY = 0;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    gsap.ticker.add(() => {
        scrollY = window.scrollY;
        blobs.forEach((blob, index) => {
            const speed = 0.5 + (index * 0.1);
            const timeVal = Date.now() * 0.001;
            const offsetX = Math.sin(timeVal * speed + index) * 30;
            const offsetY = Math.cos(timeVal * speed + index) * 30;
            const parallaxX = (mouseX - window.innerWidth / 2) * (0.02 + index * 0.01);
            const parallaxY = (mouseY - window.innerHeight / 2) * (0.02 + index * 0.01);
            const scrollOffset = scrollY * (0.15 + index * 0.05);

            gsap.set(blob, {
                x: offsetX + parallaxX,
                y: offsetY + parallaxY - scrollOffset
            });
        });
    });

    // --- 2. Dynamic SVG Path Drawing (Preserved) ---
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
                const baseOffset = Math.min(rect.width / 2 + 20, window.innerWidth * 0.35);
                const dir = index % 2 === 0 ? -1 : 1;
                points.push({ x: centerX + dir * baseOffset, y: cardCenterY });
            } else {
                points.push({ x: rect.left + rect.width / 2, y: cardCenterY });
            }
        });
        points.push({ x: centerX, y: document.body.scrollHeight });

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
        const length = path.getTotalLength();
        path.style.strokeDasharray = length;
        path.style.strokeDashoffset = length;

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
    
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(updatePath, 100);
    });
    setTimeout(updatePath, 100);

    // --- 3. Pop In & Tilt ---
    document.querySelectorAll('.pop-in').forEach((el) => {
        let xVal = 0;
        if (window.innerWidth > 768) {
            if (el.closest('.left-align') && el.classList.contains('feature-card')) xVal = -50;
            else if (el.closest('.right-align') && el.classList.contains('feature-card')) xVal = 50;
        }
        gsap.fromTo(el, 
            { autoAlpha: 0, y: 60, x: xVal, scale: 0.95 },
            {
                duration: 1.0, autoAlpha: 1, y: 0, x: 0, scale: 1, ease: "power3.out",
                scrollTrigger: { trigger: el, start: "top 90%", toggleActions: "play none none reverse" }
            }
        );
    });

    if (window.matchMedia("(min-width: 769px)").matches) {
        document.querySelectorAll('.demo-window').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const rotateX = ((y - rect.height/2) / (rect.height/2)) * -3;
                const rotateY = ((x - rect.width/2) / (rect.width/2)) * 3;
                gsap.to(card, { duration: 0.5, transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`, ease: "power2.out" });
            });
            card.addEventListener('mouseleave', () => {
                gsap.to(card, { duration: 0.5, transform: `perspective(1000px) rotateX(0) rotateY(0)`, ease: "power2.out" });
            });
        });
    }

    // --- 4. Mobile Menu ---
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }

    // --- 5. Hero & Search Animations ---
    
    // Hero Animation: Dynamic Mouse Parallax & Typing
    const heroDemo = document.querySelector('#hero-demo');
    if (heroDemo) {
        const particles = heroDemo.querySelectorAll('.floating-item');
        const searchBar = heroDemo.querySelector('.hero-search-bar');
        const typingText = heroDemo.querySelector('.hero-typing-text');
        
        // Mouse Interaction
        heroDemo.addEventListener('mousemove', (e) => {
            const rect = heroDemo.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            
            gsap.to(searchBar, {
                duration: 0.5,
                x: x * 30,
                y: y * 30,
                rotationX: -y * 10,
                rotationY: x * 10,
                ease: "power2.out"
            });
            
            particles.forEach((p, i) => {
                const depth = (i + 1) * 20;
                gsap.to(p, {
                    duration: 0.8,
                    x: x * depth,
                    y: y * depth,
                    rotation: x * 20,
                    ease: "power2.out"
                });
            });
        });
        
        heroDemo.addEventListener('mouseleave', () => {
            gsap.to([searchBar, particles], {
                duration: 0.8,
                x: 0,
                y: 0,
                rotationX: 0,
                rotationY: 0,
                rotation: 0,
                ease: "power2.out"
            });
        });

        // Typing Animation
        const text = "Annual_Report_2025.pdf";
        let i = 0;
        function typeHero() {
            if (i <= text.length) {
                typingText.textContent = text.substring(0, i);
                i++;
                setTimeout(typeHero, 100 + Math.random() * 50);
            } else {
                setTimeout(() => {
                    i = 0;
                    typingText.textContent = "";
                    typeHero();
                }, 3000);
            }
        }
        setTimeout(typeHero, 1000);
    }

    const searchSection = document.querySelector('#search');
    const searchDemo = document.querySelector('#search-demo');
    if (searchDemo) {
        const input = searchDemo.querySelector('.search-placeholder');
        const list = searchDemo.querySelector('.search-results-list');
        const items = searchDemo.querySelectorAll('.result-item');
        const inputBox = searchDemo.querySelector('.search-input-box');

        const tl = gsap.timeline({
            scrollTrigger: { trigger: searchSection, start: "top 60%" },
            repeat: -1, repeatDelay: 3
        });

        // Reset
        gsap.set(list, { autoAlpha: 0, y: -10, height: 0 });
        gsap.set(items, { autoAlpha: 0, x: -10 });
        input.textContent = "";

        // Type
        const text = "Project Report 2025";
        const typeObj = { len: 0 };
        tl.to(inputBox, { borderColor: "#00d2ff", duration: 0.3 });
        tl.to(typeObj, {
            len: text.length, duration: 1.5, ease: "none",
            onUpdate: () => input.textContent = text.substring(0, Math.round(typeObj.len))
        });

        // Show Results
        tl.to(list, { autoAlpha: 1, y: 0, height: "auto", duration: 0.4, ease: "power2.out" });
        tl.to(items, { autoAlpha: 1, x: 0, stagger: 0.1, duration: 0.4 }, "-=0.2");
        
        // Highlight 2nd item
        tl.to(items[1], { backgroundColor: "rgba(0, 210, 255, 0.1)", duration: 0.3 });
        tl.to({}, { duration: 2 }); // Hold

        // Fade out
        tl.to(list, { autoAlpha: 0, y: -10, height: 0, duration: 0.4 });
        tl.to(inputBox, { borderColor: "rgba(255,255,255,0.1)", duration: 0.3 }, "<");
        tl.add(() => { input.textContent = "Type to search..."; items[1].style.backgroundColor = ""; });
    }

    // --- 6. Preview Animation ---
    const previewSection = document.querySelector('#preview');
    const previewDemo = document.querySelector('#preview-demo');
    if (previewDemo) {
        const cursor = previewDemo.querySelector('.css-cursor');
        const file = previewDemo.querySelector('#preview-target');
        const menu = previewDemo.querySelector('.context-menu');
        const modal = previewDemo.querySelector('.preview-modal');
        const menuItem = previewDemo.querySelector('.ctx-item.active');

        // Initial States
        gsap.set(cursor, { x: 200, y: 200, opacity: 0 });
        gsap.set(menu, { autoAlpha: 0, scale: 0.8, x: 0, y: 0 });
        gsap.set(modal, { autoAlpha: 0, scale: 0.8 });

        const tl = gsap.timeline({
            scrollTrigger: { trigger: previewSection, start: "top 60%" },
            repeat: -1, repeatDelay: 2
        });

        // Move Cursor to File
        tl.to(cursor, { opacity: 1, duration: 0.1 });
        tl.to(cursor, { x: 50, y: 50, duration: 1, ease: "power2.out" });
        tl.to(file, { scale: 1.05, duration: 0.2 }, "-=0.2");

        // Right Click
        tl.to(cursor, { scale: 0.9, duration: 0.1 });
        tl.to(cursor, { scale: 1, duration: 0.1 });
        tl.to(menu, { autoAlpha: 1, scale: 1, x: 60, y: 60, duration: 0.3, ease: "back.out(1.7)" });

        // Move to Menu Item
        tl.to(cursor, { x: 100, y: 95, duration: 0.6, ease: "power2.inOut" });
        tl.to(menuItem, { backgroundColor: "#00d2ff", color: "#000", duration: 0.2 });

        // Click
        tl.to(cursor, { scale: 0.9, duration: 0.1 });
        tl.to(cursor, { scale: 1, duration: 0.1 });
        
        // Open Modal
        tl.to(menu, { autoAlpha: 0, duration: 0.2 }, "open");
        tl.to(modal, { autoAlpha: 1, scale: 1, duration: 0.5, ease: "back.out(1.2)" }, "open");
        tl.to(cursor, { opacity: 0, duration: 0.3 }, "open");

        // Hold & Close
        tl.to({}, { duration: 2.5 });
        tl.to(modal, { autoAlpha: 0, scale: 0.8, duration: 0.3 });
        tl.to(file, { scale: 1, duration: 0.3 });
        tl.set(menuItem, { clearProps: "all" });
    }

    // --- 7. Tags Animation ---
    const tagsSection = document.querySelector('#tags');
    const tagsDemo = document.querySelector('#tags-demo');
    if (tagsDemo) {
        const cursor = tagsDemo.querySelector('.css-cursor');
        const tagBtn = tagsDemo.querySelectorAll('.tag-btn')[0]; // "Work" (Red)
        const fileCard = tagsDemo.querySelectorAll('.file-card')[1]; // Middle file
        const dot = fileCard.querySelector('.tag-dot');

        gsap.set(cursor, { x: 200, y: 200, opacity: 0 });
        gsap.set(dot, { scale: 0 });
        gsap.set(tagBtn, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "transparent", color: "inherit" });

        const tl = gsap.timeline({
            scrollTrigger: { trigger: tagsSection, start: "top 60%" },
            repeat: -1, repeatDelay: 2
        });

        // Move to Tag Button
        tl.to(cursor, { opacity: 1, duration: 0.1 });
        tl.to(cursor, { x: 40, y: 30, duration: 1, ease: "power2.out" });
        
        // Click Tag
        tl.to(cursor, { scale: 0.9, duration: 0.1 });
        tl.to(cursor, { scale: 1, duration: 0.1 });
        tl.to(tagBtn, { backgroundColor: "rgba(255, 95, 86, 0.2)", borderColor: "#ff5f56", color: "#ff5f56", duration: 0.2 });

        // Move to File
        tl.to(cursor, { x: 140, y: 120, duration: 0.8, ease: "power2.inOut" });
        tl.to(fileCard, { backgroundColor: "rgba(255,255,255,0.1)", duration: 0.2 });

        // Click File
        tl.to(cursor, { scale: 0.9, duration: 0.1 });
        tl.to(cursor, { scale: 1, duration: 0.1 });
        tl.to(dot, { scale: 1, duration: 0.4, ease: "elastic.out(1, 0.5)" });

        // Move Away
        tl.to(cursor, { x: 250, y: 250, opacity: 0, duration: 0.8 });
        
        // Hold & Reset
        tl.to({}, { duration: 2 });
        tl.to(dot, { scale: 0, duration: 0.3 });
        tl.to(tagBtn, { clearProps: "all", duration: 0.3 });
        tl.to(fileCard, { backgroundColor: "", duration: 0.3 });
    }

    // --- 8. Drag Drop Animation ---
    const dragSection = document.querySelector('#dragdrop');
    const dragDemo = document.querySelector('#drag-demo');
    if (dragDemo) {
        const cursor = dragDemo.querySelector('.css-cursor');
        const folder = dragDemo.querySelector('.draggable-file');
        const zone = dragDemo.querySelector('.drop-zone');
        const check = dragDemo.querySelector('.success-check');
        const zoneText = dragDemo.querySelector('.drop-zone-text');

        gsap.set(cursor, { x: 200, y: 200, opacity: 0 });
        gsap.set(folder, { x: 0, y: 0, scale: 1, opacity: 1 });
        gsap.set(check, { scale: 0, opacity: 0 });
        gsap.set(zoneText, { opacity: 1 });

        const tl = gsap.timeline({
            scrollTrigger: { trigger: dragSection, start: "top 60%" },
            repeat: -1, repeatDelay: 2
        });

        // Move to Folder
        tl.to(cursor, { opacity: 1, duration: 0.1 });
        tl.to(cursor, { x: 50, y: 50, duration: 1, ease: "power2.out" });

        // Grab
        tl.to(cursor, { scale: 0.9, duration: 0.1 });
        tl.to([folder, cursor], { scale: 1.05, duration: 0.2 });
        
        // Drag
        tl.to([folder, cursor], { x: 180, y: 0, duration: 1, ease: "power2.inOut" });
        tl.to(zone, { borderColor: "#00d2ff", backgroundColor: "rgba(0, 210, 255, 0.1)", duration: 0.3 }, "-=0.5");

        // Release
        tl.to(cursor, { scale: 1, duration: 0.1 });
        tl.to(folder, { scale: 0.2, opacity: 0, x: 180, y: 0, duration: 0.3, ease: "back.in(1.7)" });
        
        // Success
        tl.to(zoneText, { opacity: 0, duration: 0.1 }, "<");
        tl.to(check, { opacity: 1, scale: 1, duration: 0.4, ease: "elastic.out(1, 0.5)" });

        // Reset
        tl.to(cursor, { opacity: 0, duration: 0.5 });
        tl.to({}, { duration: 2 });
        tl.set(folder, { clearProps: "all" }); // Reset folder pos
        tl.to([check, zone], { clearProps: "all", duration: 0.3 });
        tl.to(zoneText, { opacity: 1, duration: 0.3 });
    }
});
