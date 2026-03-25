import type { AnimationConfig, EasingConfig } from "../../types/animation";
import { shadowToCss } from "../../features/animation/mapConfigToMotion";

function easingToFramerCode(easing: EasingConfig): string {
  if (easing.kind === "preset") return `"${easing.preset}"`;
  return `[${easing.x1.toFixed(2)}, ${easing.y1.toFixed(2)}, ${easing.x2.toFixed(2)}, ${easing.y2.toFixed(2)}]`;
}

function seconds(ms: number) {
  return (ms / 1000).toFixed(3).replace(/\.?0+$/, "");
}

export function generateFramerMotionCode(config: AnimationConfig): string {
  const transition = `transition={{ duration: ${seconds(config.duration)}, delay: ${seconds(config.delay)}, ease: ${easingToFramerCode(config.easing)} }}`;

  const shadow0 = shadowToCss(0);
  const shadow1 = shadowToCss(config.shadow);

  const transformPartHoverClick = `scale: ${config.scale}, opacity: ${config.opacity}, x: ${config.translateX}, y: ${config.translateY}, rotate: ${config.rotate}, boxShadow: "${shadow1}"`;

  if (config.trigger === "hover") {
    return `<motion.button
  whileHover={{ ${transformPartHoverClick} }}
  whileFocus={{ ${transformPartHoverClick} }}
  ${transition}
>
  Button
</motion.button>`;
  }

  if (config.trigger === "click") {
    return `<motion.button
  whileTap={{ ${transformPartHoverClick} }}
  whileFocus={{ ${transformPartHoverClick} }}
  ${transition}
>
  Button
</motion.button>`;
  }

  return `<motion.button
  initial={{ scale: 1, opacity: 1, x: 0, y: 0, rotate: 0, boxShadow: "${shadow0}" }}
  animate={{
    scale: [1, ${config.scale}, 1],
    opacity: [1, ${config.opacity}, 1],
    x: [0, ${config.translateX}, 0],
    y: [0, ${config.translateY}, 0],
    rotate: [0, ${config.rotate}, 0],
    boxShadow: ["${shadow0}", "${shadow1}", "${shadow0}"],
  }}
  transition={{ duration: ${seconds(config.duration)}, delay: ${seconds(config.delay)}, ease: ${easingToFramerCode(config.easing)}, times: [0, 0.55, 1] }}
>
  Button
</motion.button>`;
}

