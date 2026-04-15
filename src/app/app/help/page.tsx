import { PhoneCall, Mail, BookOpen } from "lucide-react";

export default function HelpPage() {
  return (
    <div className="p-8 md:p-12 w-full max-w-4xl mx-auto flex flex-col items-center">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-heading font-bold mb-2">Help & Support</h1>
        <p className="text-slate-400 font-sans text-sm max-w-md mx-auto">
          Need assistance navigating the HearME AI interface? We're here to help ensure seamless accessibility.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <div className="glass-card p-8 rounded-3xl border-t border-brand-500/50 hover:bg-slate-800/50 transition-colors cursor-pointer text-center group">
           <div className="w-16 h-16 mx-auto bg-brand-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
             <BookOpen className="w-8 h-8 text-brand-400" />
           </div>
           <h3 className="text-xl font-bold font-heading mb-2">Documentation</h3>
           <p className="text-slate-400 text-sm">Read guides on managing your communication profile and testing microphones.</p>
        </div>

        <div className="glass-card p-8 rounded-3xl border-t border-accent/50 hover:bg-slate-800/50 transition-colors cursor-pointer text-center group">
           <div className="w-16 h-16 mx-auto bg-accent/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
             <Mail className="w-8 h-8 text-accent-light" />
           </div>
           <h3 className="text-xl font-bold font-heading mb-2">Contact Accessibility Team</h3>
           <p className="text-slate-400 text-sm">Dedicated 24/7 text support for account or billing issues.</p>
        </div>
      </div>
    </div>
  );
}
