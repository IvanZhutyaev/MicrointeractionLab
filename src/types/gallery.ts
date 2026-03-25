import type { AnimationConfig } from "./animation";
import type { UIComponentType } from "./ui";

export type CustomGalleryItem = {
  id: string;
  name: string;
  createdAt: number;
  componentType: UIComponentType;
  config: AnimationConfig;
};

