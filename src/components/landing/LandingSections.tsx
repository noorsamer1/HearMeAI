"use client";

import { motion } from "framer-motion";
import { Mic, Eye, Zap, Shield, Fingerprint, Activity } from "lucide-react";

export default function LandingSections() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 100 } },
  };

  return (
    <div className="relative z-10 w-full">
      {/* Features Section */}
      <section id="features" className="py-24 relative">
        <div className="container px-6 mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-heading font-bold mb-4">Core <span className="text-brand-400">Features</span></h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Intuitive tools built from the ground up for seamless visual communication.</p>
          </div>
          
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              { icon: Mic, title: "Instant Live Captions", desc: "Follow any conversation effortlessly. Our AI instantly translates spoken words into highly readable, flowing text." },
              { icon: Activity, title: "Natural Voice Synthesis", desc: "Express yourself clearly. Type your thoughts and let our advanced AI speak them aloud in natural, human-like voices." },
              { icon: Eye, title: "Smart AI Assistance", desc: "Need to simplify or clarify complex sentences? Our AI rephrases content instantly to ensure perfect understanding." },
            ].map((feature, i) => (
              <motion.div key={i} variants={itemVariants} className="glass-card p-8 rounded-3xl hover:border-brand-500/50 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-brand-400" />
                </div>
                <h3 className="text-xl font-bold font-heading mb-3">{feature.title}</h3>
                <p className="text-slate-400 font-sans leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Technology Section */}
      <section id="technology" className="py-24 relative bg-slate-900/30 border-y border-white/5">
        <div className="absolute left-0 top-0 w-1/3 h-full bg-accent/5 blur-[120px] pointer-events-none" />
        <div className="container px-6 mx-auto max-w-6xl flex flex-col md:flex-row items-center gap-12">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex-1"
          >
            <h2 className="text-4xl font-heading font-bold mb-6">Lightning Fast. Completely <span className="text-accent-light">Private.</span></h2>
            <p className="text-lg text-slate-400 mb-6 leading-relaxed">
              Conversations happen in the moment. That's why we've engineered HearME to process language with zero perceived delay, all while keeping your data absolutely secure.
            </p>
            <ul className="space-y-4 text-slate-300">
              <li className="flex items-center gap-3"><Zap className="w-5 h-5 text-neon-yellow" /> <span className="font-medium">&lt; 200ms processing latency</span></li>
              <li className="flex items-center gap-3"><Shield className="w-5 h-5 text-brand-400" /> <span className="font-medium">End-to-end encryption for all sessions</span></li>
              <li className="flex items-center gap-3"><Fingerprint className="w-5 h-5 text-accent" /> <span className="font-medium">Adaptive voice profile learning</span></li>
            </ul>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex-1 relative"
          >
            <div className="aspect-square max-w-md mx-auto relative flex items-center justify-center">
              {/* Expanding Sonar Waves */}
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-32 h-32 rounded-full border border-brand-500/60 shadow-[0_0_20px_rgba(99,102,241,0.4)_inset]"
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: 4, opacity: 0 }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeOut",
                    delay: i * 1,
                  }}
                />
              ))}

              <div className="absolute inset-0 bg-gradient-to-tr from-brand-600/10 to-accent/10 blur-3xl rounded-full" />
              
              {/* Center Box with Equalizer Wave */}
              <div className="relative z-10 w-32 h-32 rounded-[2rem] bg-slate-900/80 backdrop-blur-2xl border border-white/10 flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.6)] overflow-hidden">
                {/* Animated Audio Equalizer Bars */}
                <div className="flex items-center gap-1.5 h-12 relative z-10">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 bg-brand-400 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]"
                      initial={{ height: "20%" }}
                      animate={{ height: ["20%", "100%", "20%"] }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.15,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Accessibility Section */}
      <section id="accessibility" className="py-24 relative">
        <div className="container px-6 mx-auto max-w-4xl text-center">
          <motion.div
             initial={{ opacity: 0, y: 30 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
          >
            <h2 className="text-4xl font-heading font-bold mb-6">Designed Without <span className="text-neon-green">Compromise</span></h2>
            <p className="text-xl text-slate-400 mb-10 leading-relaxed">
              True inclusion means visual clarity for everyone. We built HearME from the ground up to exceed WCAG AAA standards, ensuring every interaction feels effortless.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="px-6 py-3 rounded-full bg-slate-800 text-slate-300 font-medium">AAA Contrast</div>
              <div className="px-6 py-3 rounded-full bg-slate-800 text-slate-300 font-medium">Reduced Motion Flags</div>
              <div className="px-6 py-3 rounded-full bg-slate-800 text-slate-300 font-medium">Keyboard Navigable</div>
              <div className="px-6 py-3 rounded-full bg-slate-800 text-slate-300 font-medium">Screen Reader Targetings</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 relative bg-slate-900 border-t border-white/5">
        <div className="container px-6 mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-heading font-bold mb-6">Our <span className="text-brand-400">Mission</span></h2>
          <p className="text-lg text-slate-400 mb-10 leading-relaxed">
            We believe everyone deserves to be understood. HearME AI was created by a passionate team of accessibility advocates to eliminate conversational barriers globally.
          </p>
          <a href="/auth" className="inline-flex items-center justify-center rounded-full bg-white text-slate-950 font-semibold px-8 py-4 hover:scale-105 active:scale-95 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.2)]">
            Join Platform Now
          </a>
        </div>
      </section>
    </div>
  );
}
