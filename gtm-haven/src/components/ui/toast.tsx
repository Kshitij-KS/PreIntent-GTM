"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertTriangle, Info, Bell } from "lucide-react";

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────

const C = {
  bg: "#07090f",
  surface: "#0c1018",
  surface2: "#111820",
  border: "#18232f",
  border2: "#1e2d3e",
  text: "#c2d0de",
  muted: "#4a6070",
  dim: "#243040",
  conv: "#9060ff",
  void: "#ff5a52",
  compliance: "#f0a000",
  pain: "#24c038",
};

// ─── TOAST TYPES ─────────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// ─── TOAST ICONS ─────────────────────────────────────────────────────────────

const toastIcons = {
  success: CheckCircle,
  error: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
};

const toastColors = {
  success: C.pain,
  error: C.void,
  warning: C.compliance,
  info: C.conv,
};

const toastGradients = {
  success: "linear-gradient(135deg, rgba(36, 192, 56, 0.1) 0%, rgba(36, 192, 56, 0.05) 100%)",
  error: "linear-gradient(135deg, rgba(255, 90, 82, 0.1) 0%, rgba(255, 90, 82, 0.05) 100%)",
  warning: "linear-gradient(135deg, rgba(240, 160, 0, 0.1) 0%, rgba(240, 160, 0, 0.05) 100%)",
  info: "linear-gradient(135deg, rgba(144, 96, 255, 0.1) 0%, rgba(144, 96, 255, 0.05) 100%)",
};

// ─── TOAST PROVIDER ──────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);

    // Auto remove after duration
    if (toast.duration !== Infinity) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, toast.duration || 4000);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

// ─── USE TOAST HOOK ────────────────────────────────────────────────────────────

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

// ─── TOAST CONTAINER ───────────────────────────────────────────────────────────

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        maxWidth: "380px",
      }}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── TOAST ITEM COMPONENT ────────────────────────────────────────────────────

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const Icon = toastIcons[toast.type];
  const color = toastColors[toast.type];
  const gradient = toastGradients[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95, x: 20 }}
      animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
      exit={{ opacity: 0, y: 10, scale: 0.95, x: 20 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30,
      }}
      role="alert"
      aria-live={toast.type === "error" ? "assertive" : "polite"}
      style={{
        background: C.surface,
        backgroundImage: gradient,
        border: `1px solid ${color}30`,
        borderLeft: `3px solid ${color}`,
        borderRadius: "6px",
        padding: "12px 14px",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        cursor: "default",
      }}
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 25, delay: 0.1 }}
        style={{
          color,
          flexShrink: 0,
          marginTop: "2px",
        }}
      >
        <Icon size={16} />
      </motion.div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: C.text,
            letterSpacing: "0.02em",
            marginBottom: toast.message ? "4px" : 0,
          }}
        >
          {toast.title}
        </div>
        {toast.message && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.2, delay: 0.15 }}
            style={{
              fontSize: "10px",
              color: C.muted,
              lineHeight: 1.4,
            }}
          >
            {toast.message}
          </motion.div>
        )}
      </div>

      {/* Close button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onClose}
        aria-label="Close notification"
        style={{
          background: "transparent",
          border: "none",
          padding: "2px",
          cursor: "pointer",
          color: C.muted,
          flexShrink: 0,
          marginTop: "2px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <X size={14} />
      </motion.button>

      {/* Progress bar */}
      <motion.div
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{
          duration: (toast.duration || 4000) / 1000,
          ease: "linear",
        }}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: "2px",
          background: color,
          opacity: 0.5,
          borderBottomLeftRadius: "6px",
        }}
      />
    </motion.div>
  );
}

// ─── PRESET TOAST HELPERS ────────────────────────────────────────────────────

export function createToastHelpers(addToast: (toast: Omit<Toast, "id">) => void) {
  return {
    success: (title: string, message?: string) =>
      addToast({ title, message, type: "success" }),
    
    error: (title: string, message?: string) =>
      addToast({ title, message, type: "error", duration: 6000 }),
    
    warning: (title: string, message?: string) =>
      addToast({ title, message, type: "warning", duration: 5000 }),
    
    info: (title: string, message?: string) =>
      addToast({ title, message, type: "info" }),
    
    // GTM-specific toast helpers
    signalDetected: (account: string, engine: string) =>
      addToast({
        title: `Signal detected: ${account}`,
        message: `${engine} identified a new convergence signal`,
        type: "info",
      }),
    
    convergenceAlert: (account: string, score: number) =>
      addToast({
        title: `Convergence Alert: ${account}`,
        message: `Score reached ${score}/100 — ALERT status triggered`,
        type: "warning",
      }),
    
    briefGenerated: (account: string) =>
      addToast({
        title: "Intel Brief ready",
        message: `AI-generated brief for ${account} is ready to view`,
        type: "success",
      }),
    
    scanComplete: (signals: number, accounts: number) =>
      addToast({
        title: "Full scan complete",
        message: `Processed ${signals} signals across ${accounts} accounts`,
        type: "success",
      }),
    
    triggerWareFired: (account: string) =>
      addToast({
        title: "TriggerWare workflow fired",
        message: `CRM + Slack notifications sent for ${account}`,
        type: "success",
      }),
    
    cogneeUpdated: (account: string) =>
      addToast({
        title: "Cognee memory updated",
        message: `Account intelligence profile refreshed for ${account}`,
        type: "info",
      }),
  };
}

// ─── TOAST BELL BUTTON ─────────────────────────────────────────────────────────

export function ToastBell({ count = 0 }: { count?: number }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{
        position: "relative",
        background: "transparent",
        border: `1px solid ${C.border}`,
        borderRadius: "6px",
        padding: "8px 10px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: C.text,
      }}
    >
      <Bell size={16} />
      {count > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
          style={{
            position: "absolute",
            top: "-6px",
            right: "-6px",
            background: C.void,
            color: "#fff",
            fontSize: "9px",
            fontWeight: 600,
            width: "18px",
            height: "18px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `2px solid ${C.bg}`,
          }}
        >
          {count > 9 ? "9+" : count}
        </motion.span>
      )}
    </motion.button>
  );
}
