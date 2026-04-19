"use client";

import { motion } from "framer-motion";
import { Activity, Mic, FileText, Sparkles } from "lucide-react";

export default function DashboardPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  return (
    <div className="p-8 md:p-12 w-full h-full overflow-y-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
        <h1 className="text-4xl font-heading font-bold mb-3 tracking-tight">Dashboard</h1>
        <p className="text-slate-400 font-sans text-base leading-relaxed">Overview of your recent communications and statistics.</p>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <motion.div variants={itemVariants} className="group relative bg-slate-900/40 backdrop-blur-xl p-8 rounded-[2rem] border border-white/5 overflow-hidden hover:border-brand-500/40 transition-all duration-500 hover:shadow-[0_0_40px_rgba(99,102,241,0.15)] hover:-translate-y-1 cursor-default object-cover">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 text-brand-400">
             <Activity className="w-16 h-16 -mr-2 -mt-2 drop-shadow-lg" />
          </div>
          <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/5 to-transparent w-full opacity-0 group-hover:animate-[waveform_2s_ease-in-out_infinite]" />
          
          <p className="text-slate-400 text-xs font-bold mb-3 relative z-10 uppercase tracking-[0.2em]">Total Sessions</p>
          <div className="text-5xl font-heading font-bold text-white relative z-10 group-hover:text-brand-300 transition-colors drop-shadow-md tracking-tight">24</div>
        </motion.div>

        <motion.div variants={itemVariants} className="group relative bg-slate-900/40 backdrop-blur-xl p-8 rounded-[2rem] border border-white/5 overflow-hidden hover:border-accent/40 transition-all duration-500 hover:shadow-[0_0_40px_rgba(168,85,247,0.15)] hover:-translate-y-1 cursor-default">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 text-accent">
             <Mic className="w-16 h-16 -mr-2 -mt-2 drop-shadow-lg" />
          </div>
          <p className="text-slate-400 text-xs font-bold mb-3 relative z-10 uppercase tracking-[0.2em]">Words Synthesized</p>
          <div className="text-5xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-400 group-hover:from-accent-light group-hover:to-brand-400 relative z-10 transition-all duration-500 tracking-tight">12.4k</div>
        </motion.div>

        <motion.div variants={itemVariants} className="group relative bg-slate-900/40 backdrop-blur-xl p-8 rounded-[2rem] border border-white/5 overflow-hidden hover:border-neon-green/40 transition-all duration-500 hover:shadow-[0_0_40px_rgba(16,185,129,0.15)] hover:-translate-y-1 cursor-default">
           <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 text-neon-green">
             <FileText className="w-16 h-16 -mr-2 -mt-2 drop-shadow-lg" />
          </div>
          <p className="text-slate-400 text-xs font-bold mb-3 relative z-10 uppercase tracking-[0.2em]">Saved Transcripts</p>
          <div className="text-5xl font-heading font-bold text-slate-100 group-hover:text-neon-green relative z-10 transition-colors duration-500 tracking-tight">8</div>
        </motion.div>
      </motion.div>
      
      {/* Empty State Chart Area */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, type: "spring" }}
        className="group relative bg-slate-900/20 backdrop-blur-md p-10 rounded-[2.5rem] border border-white/5 mt-10 min-h-[400px] flex items-center justify-center flex-col shadow-inner overflow-hidden hover:border-white/10 transition-colors duration-500"
      >
         <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
         
         <div className="relative z-10 flex flex-col items-center">
           <div className="mb-8 relative">
             <div className="absolute inset-0 bg-brand-500 blur-3xl opacity-20 group-hover:opacity-40 animate-pulse transition-opacity duration-700" />
             <div className="w-20 h-20 rounded-full bg-slate-800/80 border border-white/10 flex items-center justify-center shadow-2xl relative z-10 group-hover:scale-105 transition-transform duration-500 group-hover:border-brand-500/30">
               <Sparkles className="w-8 h-8 text-slate-500 group-hover:text-brand-400 transition-colors duration-500" />
             </div>
           </div>
           
           <h3 className="text-2xl font-heading font-medium text-slate-200 mb-3 tracking-wide">Telemetry Standby</h3>
           <p className="text-slate-500 font-sans text-sm max-w-md text-center mb-8 leading-relaxed">
             The activity chart will visualize data here once sufficient real-time metrics are gathered from your upcoming live sessions.
           </p>
           
           <div className="flex items-center gap-3 px-6 py-3 bg-slate-950/80 backdrop-blur-xl rounded-full border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.4)] relative overflow-hidden group-hover:border-brand-500/30 transition-colors duration-500">
             {/* Scanning line effect */}
             <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[waveform_2s_ease-in-out_infinite]" />
             
             <div className="w-2 h-2 rounded-full bg-brand-400 animate-ping absolute opacity-80" />
             <div className="w-2 h-2 rounded-full bg-brand-500 relative z-10 shadow-[0_0_8px_rgba(99,102,241,1)]" />
             <span className="text-xs text-brand-200 font-bold tracking-[0.15em] uppercase relative z-10">Connecting to stream...</span>
           </div>
         </div>
         
         {/* Background Grid Pattern */}
         <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,black,transparent)] pointer-events-none opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-700">
           <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
             <defs>
               <pattern id="pattern-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                 <path d="M0 32V.5H32" fill="none" stroke="currentColor"></path>
               </pattern>
             </defs>
             <rect width="100%" height="100%" fill="url(#pattern-grid)"></rect>
           </svg>
         </div>
      </motion.div>
    </div>
  );
}
