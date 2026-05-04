"use client";

import { MessageSquare, LayoutDashboard, Settings, HelpCircle, LogOut, Menu, ChevronLeft, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { getStoredToken } from "@/lib/api/client";
import { fetchMe, logoutAccount } from "@/lib/api/authApi";

/** Up to two letters for the avatar from display name (or email). */
function initialsFromDisplayName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    const w = parts[0];
    return w.length >= 2 ? w.slice(0, 2).toUpperCase() : w[0].toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function profileRoleLabel(userType: string | null): string {
  if (!userType) return "";
  switch (userType) {
    case "deaf":
      return "Listener";
    case "mute":
      return "Speaker";
    case "both":
      return "Listener & speaker";
    default:
      return userType;
  }
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [userType, setUserType] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const loadProfile = useCallback(() => {
    const token = getStoredToken();
    if (!token) {
      setDisplayName("");
      setEmail("");
      setUserType(null);
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    fetchMe(token)
      .then((u) => {
        setDisplayName(u.display_name);
        setEmail(u.email);
        setUserType(u.user_type);
      })
      .catch(() => {
        setDisplayName("");
        setEmail("");
        setUserType(null);
      })
      .finally(() => setProfileLoading(false));
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Close mobile drawer when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    const token = getStoredToken();
    await logoutAccount(token);
    router.push("/login");
  };

  const avatarLabel = profileLoading
    ? "…"
    : initialsFromDisplayName(displayName || email);
  const primaryLine = profileLoading ? "…" : displayName || email || "Account";
  const secondaryLine = profileLoading ? "…" : profileRoleLabel(userType) || email;

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/app/dashboard" },
    { icon: MessageSquare, label: "Sessions", href: "/app/sessions" },
    { icon: Settings, label: "Preferences", href: "/app/preferences" },
    { icon: HelpCircle, label: "Help & Support", href: "/app/help" },
  ];

  const SidebarContent = ({ isMobile = false }) => {
    const collapsed = !isMobile && isCollapsed;

    return (
      <>
        {/* Header */}
        <div className={`px-6 mb-10 flex items-center ${collapsed ? 'justify-center px-0' : 'gap-3'} transition-all duration-300`}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-500 to-accent flex items-center justify-center shrink-0 shadow-lg shadow-brand-500/20">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          {(!collapsed || isMobile) && (
            <motion.span 
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="font-heading font-bold text-lg tracking-wide text-white whitespace-nowrap overflow-hidden"
            >
              HearME <span className="text-brand-400">AI</span>
            </motion.span>
          )}
        </div>

        {/* Menu Items */}
        <div className={`flex-1 ${collapsed ? 'px-2' : 'px-4'} space-y-2`}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                href={item.href}
                key={`${item.href}-${item.label || "menu-item"}`}
                className="block group"
              >
                <div
                  className={`w-full flex items-center ${collapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'} rounded-xl text-sm font-medium transition-all duration-300 relative ${
                    isActive 
                      ? "bg-brand-500/15 text-brand-300 border border-brand-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 transition-transform duration-300 ${isActive ? 'scale-110 text-brand-400' : 'group-hover:scale-110'}`} />
                  {(!collapsed || isMobile) && (
                    <span className="whitespace-nowrap z-10">{item.label}</span>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId={isMobile ? "activeTabMobile" : "activeTabDesktop"}
                      className={`absolute ${collapsed ? 'left-0 w-1 h-3/5 rounded-r-lg' : 'inset-0 w-full h-full rounded-xl'} bg-brand-500/5 -z-0`}
                    />
                  )}
                  {/* Tooltip for collapsed state */}
                  {collapsed && (
                    <div className="absolute top-1/2 -translate-y-1/2 left-full ml-4 px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl border border-white/10">
                      {item.label}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Footer Profile & Logout */}
        <div className={`mt-auto ${collapsed ? 'px-2' : 'px-4'} pb-4`}>
          <div className={`transition-all duration-300 ${collapsed ? 'p-2' : 'p-4'} rounded-xl bg-slate-800/40 border border-white/5 mb-4 backdrop-blur-md`}>
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent to-brand-500 p-0.5 shrink-0 shadow-lg shadow-brand-500/20">
                <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center border-2 border-slate-900">
                  <span className="text-xs font-bold text-white tracking-wider" aria-hidden>
                    {avatarLabel}
                  </span>
                </div>
              </div>
              {(!collapsed || isMobile) && (
                <div className="overflow-hidden min-w-0">
                  <p className="text-sm font-medium text-white truncate">{primaryLine}</p>
                  <p className="text-xs text-brand-300/80 truncate">{secondaryLine}</p>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleSignOut()}
            className={`group w-full flex items-center ${collapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'} rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/20 text-left`}
          >
            <LogOut className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" aria-hidden />
            {(!collapsed || isMobile) && (
              <span className="whitespace-nowrap">Sign Out</span>
            )}
          </button>
        </div>
      </>
    );
  };

  return (
    <>
      {/* ── Mobile Trigger ───────────────────────────────────────────────────────────── */}
      <div className="md:hidden fixed top-4 left-4 z-40">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2.5 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-xl text-slate-200 hover:text-white shadow-lg hover:shadow-brand-500/20 transition-all active:scale-95"
          aria-label="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* ── Mobile Drawer ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 md:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 left-0 w-[280px] bg-slate-900/95 backdrop-blur-2xl border-r border-white/5 flex flex-col pt-6 shadow-2xl z-50 md:hidden"
            >
              <button
                onClick={() => setIsMobileOpen(false)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Close Menu"
              >
                <X className="w-5 h-5" />
              </button>
              <SidebarContent isMobile={true} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Desktop Sidebar ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={false}
        animate={{ width: isCollapsed ? 88 : 260 }} // 88px = w-22, 260px ~ w-64
        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        className="hidden md:flex h-screen bg-slate-900/50 backdrop-blur-xl border-r border-white/5 flex-col pt-6 relative z-20 shadow-[4px_0_24px_rgba(0,0,0,0.2)]"
      >
        <SidebarContent isMobile={false} />

        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-4 top-10 p-1.5 bg-slate-800 border border-white/10 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 shadow-lg transition-all hover:scale-110 z-50"
          aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </motion.div>
    </>
  );
}
