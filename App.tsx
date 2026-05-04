import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'motion/react';
import { ArrowRight, Mail, Instagram, Linkedin, ExternalLink } from 'lucide-react';
import { Project, projects } from './constants';
import ScrollReveal from './components/ScrollReveal';
import { LiquidDistortion } from './components/LiquidDistortion';

/**
 * Cinematic Reveal Component
 */
function CinematicReveal({ children, delay = 0, duration = 1.2 }: { children: React.ReactNode, delay?: number, duration?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Project Scene Component
 */
function ProjectScene({ project, index, key }: { project: Project, index: number, key?: any }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const imageY = useTransform(scrollYProgress, [0, 1], [-5, 5], { clamp: false });

  return (
    <section ref={containerRef} className="relative h-screen w-full flex items-center justify-center overflow-hidden snap-start">
      <motion.div 
        style={{ opacity, scale }}
        className="relative w-[90%] max-w-7xl aspect-video md:aspect-[21/9] glass-surface rounded-2xl overflow-hidden group"
      >
        <motion.img 
          src={project.image} 
          alt={project.title}
          referrerPolicy="no-referrer"
          style={{ y: `${imageY.get()}%`, scale: 1.1 }}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full flex flex-col md:flex-row items-end justify-between gap-6">
          <div className="max-w-2xl">
            <span className="text-[10px] font-mono tracking-widest text-white/50 mb-2 block">{project.category}</span>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 text-glow">{project.title}</h2>
            <p className="text-white/70 text-lg md:text-xl font-light leading-relaxed max-w-xl">
              {project.description}
            </p>
          </div>
          <motion.a 
            href={project.link}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-6 py-4 bg-white text-black font-medium rounded-full cursor-pointer transition-colors hover:bg-white/90"
          >
            BEHANCE <ExternalLink size={18} />
          </motion.a>
        </div>
      </motion.div>
    </section>
  );
}

export default function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  useEffect(() => {
    // Artificial delay to simulate asset loading for cinematic effect
    const timer = setTimeout(() => setIsLoaded(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative bg-[#050505] text-white select-none min-h-screen overflow-x-hidden">
      <AnimatePresence>
        {!isLoaded && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 1.5, ease: [0.16, 1, 0.3, 1] } }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black"
          >
            <div className="relative overflow-hidden">
              <motion.h1 
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="text-2xl font-mono tracking-[0.4em] text-white/80"
              >
                VIGNESH KUMAR
              </motion.h1>
            </div>
            <div className="mt-8 w-48 h-[1px] bg-white/10 relative overflow-hidden">
              <motion.div 
                initial={{ x: "-100%" }}
                animate={{ x: "0%" }}
                transition={{ duration: 2, ease: "easeInOut" }}
                className="absolute inset-0 bg-white"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FIXED ASSETS (Background Visuals) */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent" />
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150 brightness-150" />
      </div>

      {/* HEADER */}
      <header className="fixed top-0 left-0 w-full z-50 p-8 flex justify-between items-center mix-blend-difference">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 2.8 }}
          className="text-xl font-bold tracking-tighter"
        >
          VK
        </motion.div>
        <nav className="hidden md:flex items-center gap-12 text-[10px] font-mono tracking-widest text-white/60">
          {['WORK', 'ABOUT', 'SHOWREEL', 'CONTACT'].map((item, i) => (
            <motion.a 
              key={item}
              href={`#${item.toLowerCase()}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 3 + i * 0.1 }}
              className="hover:text-white transition-colors duration-300"
            >
              {item}
            </motion.a>
          ))}
        </nav>
      </header>

      {/* SOCIALS RAIL */}
      <div className="fixed bottom-8 left-8 z-50 hidden lg:flex flex-col gap-6 text-white/40">
        {[
          { Icon: Instagram, href: "https://www.instagram.com/vigneshtimeline?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" },
          { Icon: Linkedin, href: "#" },
          { Icon: Mail, href: "mailto:vickykalai82880@gmail.com" }
        ].map((social, i) => (
          <motion.a
            key={i}
            href={social.href}
            target={social.href.startsWith('http') ? "_blank" : undefined}
            rel={social.href.startsWith('http') ? "noopener noreferrer" : undefined}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 3.5 + i * 0.1 }}
            className="hover:text-white transition-colors duration-300"
          >
            <social.Icon size={20} />
          </motion.a>
        ))}
        <div className="w-[1px] h-24 bg-white/20 mx-auto" />
      </div>

      {/* SCROLL PROGRESS */}
      <motion.div 
        style={{ scaleX: smoothProgress }}
        className="fixed top-0 left-0 right-0 h-[2px] bg-white z-[60] origin-left"
      />

      {/* MAIN CONTENT */}
      <main className="relative z-30 pt-[50px]">
        
        {/* HERO SECTION */}
        <section id="hero" className="relative h-screen flex flex-col items-center justify-center snap-start px-8">
          <div className="text-center max-w-5xl mt-5">
            <CinematicReveal delay={2.6}>
              <span className="text-[12px] font-mono tracking-[0.5em] text-white/50 uppercase mb-8 block">
                3D GENERALIST / VFX ARTIST
              </span>
            </CinematicReveal>
            <CinematicReveal delay={2.8}>
              <h2 className="text-[clamp(3.5rem,10vw,8rem)] font-bold tracking-tighter leading-[0.9] mb-12">
                CRAFTING VISUALS
              </h2>
            </CinematicReveal>
            <CinematicReveal delay={3}>
              <p className="text-white/60 text-lg md:text-2xl font-light max-w-3xl mx-auto leading-loose tracking-wide mb-12">
                Building cinematic visuals that blend atmosphere, depth, and emotion to tell powerful stories.
              </p>
            </CinematicReveal>
            
            <CinematicReveal delay={3.2}>
              <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="flex flex-col items-center gap-6 text-white/30"
              >
                <div className="w-px h-16 bg-white/10" />
                <span className="text-[10px] font-mono tracking-[0.4em] uppercase">Scroll to explore</span>
              </motion.div>
            </CinematicReveal>
          </div>

          {/* BACKGROUND 3D (Subtle) */}
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.03)_0%,_transparent_70%)]" />
        </section>

        {/* ABOUT / INTRO */}
        <section id="about" className="relative py-64 px-8 flex items-center justify-center bg-transparent snap-start overflow-hidden">
          <div className="max-w-5xl">
            <ScrollReveal
              baseOpacity={0.05}
              enableBlur={true}
              blurStrength={10}
              textClassName="text-2xl md:text-4xl lg:text-5xl leading-[1.6] md:leading-[1.8] font-light text-white/80 text-center tracking-normal"
            >
              "I build cinematic visuals blending 3D, motion, and storytelling. My focus is on creating atmosphere, depth, and emotion through digital mediums."
            </ScrollReveal>
          </div>
        </section>

        {/* PROJECTS SECTION */}
        <div id="work" className="bg-[#050505]">
          <div className="sticky top-0 h-screen flex items-center justify-center pointer-events-none">
            <motion.h2 
              style={{ opacity: useTransform(scrollYProgress, [0.1, 0.2], [0, 0.05]) }}
              className="text-[20vw] font-bold text-white tracking-tighter absolute"
            >
              PROJECTS
            </motion.h2>
          </div>
          
          <div className="relative">
            {projects.map((project, i) => (
              <ProjectScene key={project.id} project={project} index={i} />
            ))}
          </div>
        </div>

        {/* SHOWREEL SECTION */}
        <section id="showreel" className="relative h-screen flex flex-center items-center justify-center snap-start px-8 overflow-hidden">
          <div className="absolute inset-0 z-0 scale-105 opacity-60">
            <video 
              autoPlay 
              muted 
              loop 
              playsInline 
              className="w-full h-full object-cover grayscale"
              poster="https://picsur.org/i/77c4ebcf-8980-426f-9d70-de3236ae5230.jpg"
            >
              <source src="/bg-video.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-black/60" />
          </div>
          
          <div className="relative z-10 text-center">
            <CinematicReveal>
              <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8">THE SHOWREEL</h2>
              <div className="w-24 h-[2px] bg-white mx-auto mb-8" />
              <p className="text-white/60 text-lg md:text-xl font-light tracking-widest uppercase">A piece of work</p>
            </CinematicReveal>
          </div>
        </section>

        {/* CONTACT SECTION */}
        <footer id="contact" className="relative min-h-screen flex flex-col items-center justify-center snap-start px-8 bg-black">
          <div className="text-center max-w-4xl">
            <CinematicReveal>
              <span className="text-[12px] font-mono tracking-[0.5em] text-white/50 uppercase mb-8 block">
                AVAILABLE FOR NEW MISSIONS
              </span>
              <h2 className="text-[clamp(3.5rem,8vw,7rem)] font-bold tracking-tighter leading-[0.9] mb-12">
                LET'S BUILD SOMETHING <br />
                <span className="italic font-light opacity-80">CINEMATIC</span>
              </h2>
            </CinematicReveal>
            
            <CinematicReveal delay={0.2}>
              <a 
                href="mailto:vickykalai82880@gmail.com" 
                className="inline-flex items-center gap-4 text-2xl md:text-4xl font-light hover:text-white/60 transition-all group"
              >
                vickykalai82880@gmail.com
                <ArrowRight className="group-hover:translate-x-2 transition-transform" />
              </a>
            </CinematicReveal>

            <div className="mt-32 grid grid-cols-2 md:grid-cols-4 gap-12 text-center md:text-left">
              <div>
                <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest block mb-4">Location</span>
                <p className="text-white/80">Chennai / Remote</p>
              </div>
              <div>
                <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest block mb-4">Social</span>
                <div className="flex flex-col gap-2">
                  <a href="https://www.behance.net/vickykalai" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white transition-colors">Behance</a>
                  <a href="https://www.instagram.com/vigneshtimeline?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white transition-colors">Instagram</a>
                </div>
              </div>
              <div>
                <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest block mb-4">Focus</span>
                <p className="text-white/80">VFX / 3D / Motion</p>
              </div>
              <div>
                <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest block mb-4">Copyright</span>
                <p className="text-white/80">© 2001</p>
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-8 text-[10px] font-mono text-white/20 tracking-widest">
            VIGNESH KUMAR PORTFOLIO — BUILT WITH PASSION
          </div>
        </footer>
      </main>

      {/* CUSTOM CURSOR */}
      <LiquidDistortion />
    </div>
  );
}
