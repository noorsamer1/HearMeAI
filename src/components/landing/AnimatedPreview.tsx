"use client";

import { motion } from "framer-motion";
import { Mic, Send, MoreHorizontal } from "lucide-react";

export default function AnimatedPreview() {
  return (
    <section className="relative py-20 overflow-hidden">
      <div className="container px-6 mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 50, rotateX: 10 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1, type: "spring", bounce: 0.4 }}
          viewport={{ once: true, margin: "-100px" }}
          style={{ perspective: 1000 }}
          className="relative rounded-2xl glass-card overflow-hidden border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] bg-[#0f1117]/80"
        >
          {/* Toolbar Fake Mac Window */}
          <div className="flex items-center px-4 py-3 border-b border-white/5 bg-white/5">
            <div className="flex space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <div className="mx-auto text-xs font-medium text-slate-400 font-heading tracking-wider uppercase">
              Live Session
            </div>
            <div className="w-12 text-right">
              <MoreHorizontal className="w-4 h-4 inline-block text-slate-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 h-[500px]">
            {/* Sidebar Fake */}
            <div className="hidden md:flex flex-col border-r border-white/5 p-4 bg-slate-900/30">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded-full bg-slate-800" />
                    <div className="space-y-2 flex-1">
                      <div className="h-3 bg-slate-800 rounded w-full" />
                      <div className="h-3 bg-slate-800 rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Area Fake */}
            <div className="col-span-1 md:col-span-2 flex flex-col relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat bg-[length:200px] opacity-90">
              <div className="flex-1 p-6 space-y-6 overflow-hidden">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="flex gap-4 w-3/4"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent to-accent-light flex-shrink-0 mt-1" />
                  <div className="bg-surface-raised p-4 rounded-2xl rounded-tl-none border border-white/5 text-slate-200 shadow-sm font-sans text-[15px] leading-relaxed">
                    Hello! I'm ready to help you communicate seamlessly today. Please feel free to type or use the microphone.
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.5, duration: 0.5 }}
                  className="flex gap-4 w-3/4 ml-auto justify-end"
                >
                  <div className="bg-brand-600 p-4 rounded-2xl rounded-tr-none text-white shadow-md font-sans text-[15px] leading-relaxed">
                    Thank you! Can we test the live captioning feature?
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.5, duration: 0.5 }}
                  className="flex gap-4 w-3/4"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent to-accent-light flex-shrink-0 mt-1" />
                  <div className="bg-surface-raised px-4 py-3 rounded-2xl rounded-tl-none border border-white/5">
                    <div className="flex space-x-1.5 items-center h-6">
                      <motion.div className="w-2 h-2 bg-slate-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                      <motion.div className="w-2 h-2 bg-slate-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                      <motion.div className="w-2 h-2 bg-slate-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Input Area Fake */}
              <div className="p-4 bg-slate-900/80 backdrop-blur-md border-t border-white/10 m-4 rounded-2xl flex items-center gap-3">
                <button className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-brand-600 transition-colors">
                  <Mic className="w-5 h-5" />
                </button>
                <div className="flex-1 bg-slate-950/50 rounded-xl px-4 py-3 text-slate-500 font-sans text-sm">
                  Type a message...
                </div>
                <button className="w-12 h-12 rounded-full bg-brand-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
                  <Send className="w-5 h-5 ml-1" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
