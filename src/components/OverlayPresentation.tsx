import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";

/** Shared presentation only: no gameplay or progression state. */
export function OverlayCard({ children, ...props }: HTMLMotionProps<"div">) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      {...props}
      initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.92, y: reducedMotion ? 0 : 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.98, y: reducedMotion ? 0 : 4 }}
      transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 26 }}
    >{children}</motion.div>
  );
}