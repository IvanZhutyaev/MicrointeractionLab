import type { AnimationConfig, EasingConfig } from "../../types/animation";
import { shadowToCss } from "../../features/animation/mapConfigToMotion";

function easingToCss(easing: EasingConfig): string {
  if (easing.kind === "preset") {
    switch (easing.preset) {
      case "easeOut":
        return "ease-out";
      case "easeIn":
        return "ease-in";
      case "easeInOut":
        return "ease-in-out";
      case "linear":
        return "linear";
    }
  }
  return `cubic-bezier(${easing.x1}, ${easing.y1}, ${easing.x2}, ${easing.y2})`;
}

function ms(ms: number) {
  return Math.round(ms);
}

function transformCss(config: AnimationConfig) {
  return `translate(${Math.round(config.translateX)}px, ${Math.round(config.translateY)}px) rotate(${Math.round(
    config.rotate,
  )}deg) scale(${config.scale})`;
}

export function generateCssCode(config: AnimationConfig, _componentType: "button" | "card" | "input" = "button"): string {
  const easeCss = easingToCss(config.easing);
  const durationMs = ms(config.duration);
  const delayMs = ms(config.delay);

  const shadow0 = shadowToCss(0);
  const shadow1 = shadowToCss(config.shadow);

  const targetTransform = transformCss(config);
  const baseTransform = `translate(0px, 0px) rotate(0deg) scale(1)`;

  if (config.trigger === "hover") {
    return `.microinteraction {
  transition:
    transform ${durationMs}ms ${easeCss} ${delayMs}ms,
    opacity ${durationMs}ms ${easeCss} ${delayMs}ms,
    box-shadow ${durationMs}ms ${easeCss} ${delayMs}ms;
  opacity: 1;
  box-shadow: ${shadow0};
}

.microinteraction:hover, .microinteraction:focus-visible {
  transform: ${targetTransform};
  opacity: ${config.opacity};
  box-shadow: ${shadow1};
}`;
  }

  if (config.trigger === "click") {
    return `.microinteraction {
  transition:
    transform ${durationMs}ms ${easeCss} ${delayMs}ms,
    opacity ${durationMs}ms ${easeCss} ${delayMs}ms,
    box-shadow ${durationMs}ms ${easeCss} ${delayMs}ms;
  opacity: 1;
  box-shadow: ${shadow0};
}

.microinteraction:active {
  transform: ${targetTransform};
  opacity: ${config.opacity};
  box-shadow: ${shadow1};
}`;
  }

  if (config.trigger === "hoverClick") {
    return `.microinteraction {
  transition:
    transform ${durationMs}ms ${easeCss} ${delayMs}ms,
    opacity ${durationMs}ms ${easeCss} ${delayMs}ms,
    box-shadow ${durationMs}ms ${easeCss} ${delayMs}ms;
  opacity: 1;
  box-shadow: ${shadow0};
}

.microinteraction:hover, .microinteraction:focus-visible {
  transform: ${targetTransform};
  opacity: ${config.opacity};
  box-shadow: ${shadow1};
}

.microinteraction:active {
  transform: ${targetTransform};
  opacity: ${config.opacity};
  box-shadow: ${shadow1};
}`;
  }

  // auto/loading
  return `@keyframes microinteractionAuto {
  0%, 100% {
    transform: ${baseTransform};
    opacity: 1;
    box-shadow: ${shadow0};
  }
  ${Math.round(config.autoPeak * 100)}% {
    transform: ${targetTransform};
    opacity: ${config.opacity};
    box-shadow: ${shadow1};
  }
}

.microinteraction {
  animation: microinteractionAuto ${durationMs}ms ${easeCss} ${delayMs}ms 1 both;
}`;
}

