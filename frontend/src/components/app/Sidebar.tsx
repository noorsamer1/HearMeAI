"use client";

import {
  MessageSquare,
  LayoutDashboard,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
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
  const labels: Record<string, string> = {
    deaf: "Deaf",
    mute: "Mute",
    both: "Deaf & Mute",
    normal: "Normal",
  };
  return labels[userType] ?? userType;
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
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-[var(--color-brand)] to-[var(--color-accent-500)] shadow-[var(--shadow-brand)]">
            <MessageSquare className="h-4 w-4 text-[var(--color-text-inverse)]" />
          </div>
          {(!collapsed || isMobile) && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="font-heading font-bold text-lg tracking-wide text-[var(--color-text-primary)] whitespace-nowrap overflow-hidden"
            >
              Hear<span className="text-[var(--color-brand)]">ME</span>{" "}
              <span className="text-[var(--color-text-secondary)]">AI</span>
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
                  className={`w-full flex items-center ${collapsed ? "justify-center p-3" : "gap-3 px-4 py-3"} rounded-xl text-sm font-medium transition-all duration-300 relative ${
                    isActive
                      ? "border border-[var(--color-border-focus)] bg-[var(--color-brand-muted)] text-[var(--color-text-primary)] shadow-[var(--shadow-card)]"
                      : "border border-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-transform duration-300 ${
                      isActive
                        ? "scale-110 text-[var(--color-brand)]"
                        : "text-[var(--color-text-muted)] group-hover:scale-110 group-hover:text-[var(--color-brand)]"
                    }`}
                  />
                  {(!collapsed || isMobile) && (
                    <span className="whitespace-nowrap z-10">{item.label}</span>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId={isMobile ? "activeTabMobile" : "activeTabDesktop"}
                      className={`absolute ${collapsed ? "left-0 h-3/5 w-1 rounded-r-lg" : "inset-0 h-full w-full rounded-xl"} -z-0 bg-[var(--color-brand-muted)]`}
                    />
                  )}
                  {/* Tooltip for collapsed state */}
                  {collapsed && (
                    <div className="invisible absolute left-full top-1/2 z-50 ml-4 -translate-y-1/2 whitespace-nowrap rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-primary)] opacity-0 shadow-[var(--shadow-card)] transition-all group-hover:visible group-hover:opacity-100">
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
          <div
            className={`mb-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)] backdrop-blur-md transition-all duration-300 ${collapsed ? "p-2" : "p-4"}`}
          >
            <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
              <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-tr from-[var(--color-accent-500)] to-[var(--color-brand)] p-0.5 shadow-[var(--shadow-brand)]">
                <div className="flex h-full w-full items-center justify-center rounded-full border-2 border-[var(--color-surface)] bg-[var(--color-surface)]">
                  <span
                    className="text-xs font-bold tracking-wider text-[var(--color-text-primary)]"
                    aria-hidden
                  >
                    {avatarLabel}
                  </span>
                </div>
              </div>
              {(!collapsed || isMobile) && (
                <div className="min-w-0 overflow-hidden">
                  <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                    {primaryLine}
                  </p>
                  <p className="truncate text-xs text-[var(--color-text-muted)]">{secondaryLine}</p>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleSignOut()}
            className={`group flex w-full items-center rounded-xl border border-transparent text-left text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-error)]/25 hover:bg-[var(--color-error-bg)] hover:text-[var(--color-error)] ${collapsed ? "justify-center p-3" : "gap-3 px-4 py-3"}`}
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
          className="rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-2.5 text-[var(--color-text-primary)] shadow-[var(--shadow-card)] backdrop-blur-xl transition-all hover:border-[var(--color-border-focus)] hover:bg-[var(--color-surface-raised)] active:scale-95"
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
              className="fixed inset-0 z-50 bg-[var(--color-bg)]/75 backdrop-blur-sm md:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] pt-6 shadow-[var(--shadow-xl)] backdrop-blur-2xl md:hidden"
            >
              <button
                onClick={() => setIsMobileOpen(false)}
                className="absolute right-6 top-6 rounded-lg p-2 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text-primary)]"
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
        className="relative z-20 hidden h-screen flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] pt-6 shadow-[var(--shadow-sm)] backdrop-blur-xl md:flex"
      >
        <SidebarContent isMobile={false} />

        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-4 top-10 z-50 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] p-1.5 text-[var(--color-text-secondary)] shadow-[var(--shadow-md)] transition-all hover:scale-110 hover:border-[var(--color-border-focus)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text-primary)]"
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
