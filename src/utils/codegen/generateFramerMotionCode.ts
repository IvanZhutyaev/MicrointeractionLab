import type { AnimationConfig, EasingConfig } from "../../types/animation";
import { shadowToCss } from "../../features/animation/mapConfigToMotion";
import type { UIComponentType } from "../../types/ui";

function easingToFramerCode(easing: EasingConfig): string {
  if (easing.kind === "preset") return `"${easing.preset}"`;
  return `[${easing.x1.toFixed(2)}, ${easing.y1.toFixed(2)}, ${easing.x2.toFixed(2)}, ${easing.y2.toFixed(2)}]`;
}

function seconds(ms: number) {
  return (ms / 1000).toFixed(3).replace(/\.?0+$/, "");
}

export function generateFramerMotionCode(
  config: AnimationConfig,
  componentType: UIComponentType = "button",
): string {
  const transition = `transition={{ duration: ${seconds(config.duration)}, delay: ${seconds(config.delay)}, ease: ${easingToFramerCode(config.easing)} }}`;

  const shadow0 = shadowToCss(0);
  const shadow1 = shadowToCss(config.shadow);

  const motionTag = componentType === "button" ? "motion.button" : componentType === "input" ? "motion.input" : "motion.div";
  const content = componentType === "card" ? "Card" : "Button";
  const inputProps = componentType === "input" ? `placeholder="Input"` : "";

  const targetPart = `scale: ${config.scale}, opacity: ${config.opacity}, x: ${config.translateX}, y: ${config.translateY}, rotate: ${config.rotate}, boxShadow: "${shadow1}"`;
  const initialPart = `scale: 1, opacity: 1, x: 0, y: 0, rotate: 0, boxShadow: "${shadow0}"`;

  if (config.trigger === "hover") {
    if (componentType === "input") {
      return `<motion.input
  whileHover={{ ${targetPart} }}
  whileFocus={{ ${targetPart} }}
  ${transition}
  ${inputProps}
/>`.trim();
    }

    return `<${motionTag}
  whileHover={{ ${targetPart} }}
  whileFocus={{ ${targetPart} }}
  ${transition}
>
  ${content}
</${motionTag}>`;
  }

  if (config.trigger === "click") {
    if (componentType === "input") {
      return `<motion.input
  whileTap={{ ${targetPart} }}
  whileFocus={{ ${targetPart} }}
  ${transition}
  ${inputProps}
/>`.trim();
    }

    return `<${motionTag}
  whileTap={{ ${targetPart} }}
  whileFocus={{ ${targetPart} }}
  ${transition}
>
  ${content}
</${motionTag}>`;
  }

  // auto / loading
  if (componentType === "input") {
    return `<motion.input
  initial={{ ${initialPart} }}
  animate={{
    scale: [1, ${config.scale}, 1],
    opacity: [1, ${config.opacity}, 1],
    x: [0, ${config.translateX}, 0],
    y: [0, ${config.translateY}, 0],
    rotate: [0, ${config.rotate}, 0],
    boxShadow: ["${shadow0}", "${shadow1}", "${shadow0}"],
  }}
  transition={{ duration: ${seconds(config.duration)}, delay: ${seconds(config.delay)}, ease: ${easingToFramerCode(config.easing)}, times: [0, 0.55, 1] }}
  ${inputProps}
/>`.trim();
  }

  return `<${motionTag}
  initial={{ ${initialPart} }}
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
  ${content}
</${motionTag}>`;
}

