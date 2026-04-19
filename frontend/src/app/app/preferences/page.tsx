export default function PreferencesPage() {
  return (
    <div className="p-8 md:p-12 w-full max-w-4xl">
      <h1 className="text-3xl font-heading font-bold mb-2">Preferences</h1>
      <p className="text-slate-400 font-sans text-sm mb-12">Manage your communication and accessibility settings.</p>

      <div className="space-y-8">
        <div className="glass-card p-8 rounded-3xl border border-white/5">
          <h2 className="text-xl font-bold font-heading mb-6 border-b border-white/10 pb-4">Theme Settings</h2>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-semibold">High Contrast Mode</p>
              <p className="text-sm text-slate-400">Forces maximum WCAG compliant saturation.</p>
            </div>
            <div className="w-12 h-6 bg-brand-500 rounded-full flex items-center p-1 cursor-pointer">
              <div className="w-4 h-4 bg-white rounded-full translate-x-6 shadow-sm"></div>
            </div>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-semibold">Reduce Animation</p>
              <p className="text-sm text-slate-400">Disables non-essential motion graphics.</p>
            </div>
            <div className="w-12 h-6 bg-slate-700/50 rounded-full flex items-center p-1 cursor-pointer">
              <div className="w-4 h-4 bg-slate-400 rounded-full shadow-sm"></div>
            </div>
          </div>
        </div>

        <div className="glass-card p-8 rounded-3xl border border-white/5">
          <h2 className="text-xl font-bold font-heading mb-6 border-b border-white/10 pb-4">Translation Engine</h2>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-semibold">Primary Language</p>
              <p className="text-sm text-slate-400">Your default communication dialect.</p>
            </div>
            <select className="bg-slate-900 border border-white/10 text-white rounded-lg px-4 py-2 text-sm outline-none">
              <option>English (US)</option>
              <option>Arabic</option>
              <option>Spanish</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
