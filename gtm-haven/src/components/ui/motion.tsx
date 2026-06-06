"use client";

import { motion, AnimatePresence, Variants, Transition } from "framer-motion";
import { ReactNode } from "react";

// ─── PREMIUM ANIMATION VARIANTS ─────────────────────────────────────────────

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } 
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

export const fadeInScale: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } 
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: { 
    opacity: 1, 
    x: 0, 
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } 
  },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: { 
    opacity: 1, 
    x: 0, 
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } 
  },
  exit: { opacity: 0, x: 20, transition: { duration: 0.2 } },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }
  },
};

export const springScale: Variants = {
  initial: { scale: 1 },
  hover: { 
    scale: 1.02, 
    transition: { type: "spring", stiffness: 400, damping: 25 } 
  },
  tap: { 
    scale: 0.98, 
    transition: { type: "spring", stiffness: 500, damping: 30 } 
  },
};

export const cardHover: Variants = {
  initial: { y: 0, boxShadow: "0 0 0 rgba(144, 96, 255, 0)" },
  hover: { 
    y: -4, 
    boxShadow: "0 8px 30px rgba(144, 96, 255, 0.12)",
    transition: { type: "spring", stiffness: 300, damping: 25 }
  },
};

// ─── CONVERGENCE GAUGE ANIMATION ────────────────────────────────────────────

export const gaugeSpring = {
  type: "spring",
  stiffness: 60,
  damping: 15,
  mass: 1,
};

export const counterSpring = {
  type: "spring",
  stiffness: 100,
  damping: 30,
};

// ─── PREMIUM MOTION COMPONENTS ──────────────────────────────────────────────

interface MotionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function FadeIn({ children, className, delay = 0 }: MotionProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={fadeIn}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function FadeInUp({ children, className, delay = 0 }: MotionProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={fadeInUp}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerContainer({ children, className }: Omit<MotionProps, 'delay'>) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: Omit<MotionProps, 'delay'>) {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  );
}

interface HoverCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function HoverCard({ children, className, onClick }: HoverCardProps) {
  return (
    <motion.div
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      variants={cardHover}
      onClick={onClick}
      className={className}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      {children}
    </motion.div>
  );
}

export function SpringButton({ children, className, onClick, disabled }: HoverCardProps & { disabled?: boolean }) {
  return (
    <motion.button
      initial="initial"
      whileHover={disabled ? undefined : "hover"}
      whileTap={disabled ? undefined : "tap"}
      variants={springScale}
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{ 
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </motion.button>
  );
}

// ─── PAGE TRANSITION WRAPPER ────────────────────────────────────────────────

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── PREMIUM LOADING STATES ─────────────────────────────────────────────────

export function PulseGlow({ children, active = true }: { children: ReactNode; active?: boolean }) {
  return (
    <motion.div
      animate={active ? {
        boxShadow: [
          "0 0 0px rgba(144, 96, 255, 0)",
          "0 0 20px rgba(144, 96, 255, 0.3)",
          "0 0 0px rgba(144, 96, 255, 0)",
        ],
      } : {}}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
}

export function Shimmer({ width = "100%", height = "100%" }: { width?: string; height?: string }) {
  return (
    <motion.div
      style={{
        width,
        height,
        background: "linear-gradient(90deg, #0c1018 0%, #1e2d3e 50%, #0c1018 100%)",
        backgroundSize: "200% 100%",
      }}
      animate={{
        backgroundPosition: ["200% 0", "-200% 0"],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  );
}

// ─── ANIMATED COUNTER ───────────────────────────────────────────────────────

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  suffix?: string;
}

export function AnimatedCounter({ value, duration = 1.2, className, suffix = "" }: AnimatedCounterProps) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={className}
    >
      <motion.span
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        className={className}
      >
        {value}{suffix}
      </motion.span>
    </motion.span>
  );
}

// ─── PROGRESS BAR WITH SPRING ───────────────────────────────────────────────

interface SpringProgressProps {
  value: number;
  color: string;
  height?: number;
  className?: string;
}

export function SpringProgress({ value, color, height = 3, className }: SpringProgressProps) {
  return (
    <div
      className={className}
      style={{
        background: "#18232f",
        borderRadius: "2px",
        height,
        overflow: "hidden",
      }}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{
          type: "spring",
          stiffness: 60,
          damping: 15,
          mass: 0.8,
        }}
        style={{
          background: color,
          height: "100%",
          borderRadius: "2px",
        }}
      />
    </div>
  );
}

// ─── SCANNING STEP ANIMATION ─────────────────────────────────────────────────

export function ScanStep({ active, completed, children }: { active: boolean; completed: boolean; children: ReactNode }) {
  return (
    <motion.span
      initial={{ opacity: 0.5, x: -5 }}
      animate={{
        opacity: active ? 1 : completed ? 1 : 0.5,
        x: active ? 0 : 0,
        scale: active ? 1.02 : 1,
      }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
      }}
    >
      <motion.span
        animate={{
          rotate: active ? [0, 360] : 0,
        }}
        transition={{
          duration: 1,
          repeat: active ? Infinity : 0,
          ease: "linear",
        }}
        style={{
          display: "inline-block",
          width: "10px",
          height: "10px",
        }}
      >
        {completed ? "✓" : active ? "� - �" : ""}
      </motion.span>
      {children}
    </motion.span>
  );
}

// ─── ALERT BADGE PULSE ───────────────────────────────────────────────────────

export function AlertPulse({ children, color }: { children: ReactNode; color: string }) {
  return (
    <motion.span
      animate={{
        boxShadow: [
          `0 0 0px ${color}00`,
          `0 0 8px ${color}60`,
          `0 0 0px ${color}00`,
        ],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      style={{
        padding: "2px 8px",
        borderRadius: "2px",
        background: `${color}15`,
        color,
        border: `1px solid ${color}40`,
        letterSpacing: "0.08em",
        fontSize: "9px",
      }}
    >
      {children}
    </motion.span>
  );
}

// ─── EXPORT ANIMATE PRESENCE ────────────────────────────────────────────────

export { AnimatePresence, motion };
