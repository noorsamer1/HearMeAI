"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Copy, Volume2, User, Mic } from "lucide-react";

interface Message {
  id: string;
  sender: "ai" | "user";
  text: string;
  isStreaming?: boolean;
}

export default function ChatArea() {
  const messages: Message[] = [
    {
      id: "1",
      sender: "ai",
      text: "Hello! I am ready to translate and synthesize speech for you. Shall we begin?"
    },
    {
      id: "2",
      sender: "user",
      text: "Yes, thank you. Let's test the new high-contrast UI."
    },
    {
      id: "3",
      sender: "ai",
      text: "Perfect. The interface is optimized for maximum readability and visual feedback.",
      isStreaming: true
    }
  ];

  return (
    <div className="flex-1 flex flex-col pt-8 pb-4 px-4 md:px-8 lg:px-12 max-w-5xl mx-auto w-full">
      {/* Messages Feed */}
      <div className="flex-1 space-y-6 overflow-y-auto mb-8 pr-2 custom-scrollbar">
        <AnimatePresence>
          {messages.map((msg, index) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`flex gap-4 max-w-[85%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : ""}`}
            >
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center -mt-1 shadow-md ${
                msg.sender === "user" ? "bg-slate-800" : "bg-gradient-to-tr from-brand-600 to-accent"
              }`}>
                {msg.sender === "user" ? <User className="w-5 h-5 text-slate-300" /> : <Mic className="w-5 h-5 text-white" />}
              </div>

              {/* Bubble Wrapper */}
              <div className={`group flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                <div className={`p-4 md:p-5 rounded-3xl font-sans text-[17px] leading-relaxed relative ${
                  msg.sender === "user" 
                    ? "bg-slate-800 text-slate-200 border border-slate-700/50 rounded-tr-sm shadow-[0_4px_20px_-10px_rgba(0,0,0,0.5)]" 
                    : "glass text-slate-100 rounded-tl-sm shadow-[0_4px_20px_-10px_rgba(0,0,0,0.5)] border-white/5"
                }`}>
                  {msg.text}
                  {msg.isStreaming && (
                    <motion.span
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="inline-block w-2.5 h-4 ml-1.5 bg-brand-400 rounded-[1px] align-middle"
                    />
                  )}
                </div>

                {/* Micro Actions */}
                <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="text-slate-500 hover:text-slate-300 p-1 transition-colors">
                    <Copy className="w-4 h-4" />
                  </button>
                  {msg.sender === "ai" && (
                    <button className="text-slate-500 hover:text-slate-300 p-1 transition-colors">
                      <Volume2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
