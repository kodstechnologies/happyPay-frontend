import type { ReactNode } from "react";
import HappyPayLoader from "./HappyPayLoader";

export interface LoadingStateProps {
  message?: string;
  subtitle?: string;
  fullScreen?: boolean;
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  className?: string;
}

export default function LoadingState({
  message = "Loading...",
  subtitle,
  fullScreen = false,
  size = "md",
  className = "",
}: LoadingStateProps) {
  return (
    <HappyPayLoader
      message={message}
      subtitle={subtitle}
      variant={fullScreen ? "fullscreen" : "page"}
      size={size}
      className={className}
    />
  );
}