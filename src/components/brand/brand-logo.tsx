import Image from "next/image";

import { cn } from "@/lib/utils";

const LOGO_SIZES = {
  light: { width: 840, height: 297 },
  dark: { width: 360, height: 121 },
} as const;

type BrandLogoProps = {
  width?: number;
  className?: string;
  priority?: boolean;
  /** Footer and dark sections use the dark mark. Light mark is for dark backgrounds. */
  variant?: "theme" | "dark" | "light";
};

function scaledHeight(
  targetWidth: number,
  source: (typeof LOGO_SIZES)[keyof typeof LOGO_SIZES],
) {
  return Math.round((targetWidth * source.height) / source.width);
}

export function BrandLogo({
  width = 160,
  className,
  priority,
  variant = "theme",
}: BrandLogoProps) {
  if (variant === "light") {
    return (
      <Image
        src="/brand/light-logo.webp"
        alt="Unique Sky Way"
        width={width}
        height={scaledHeight(width, LOGO_SIZES.light)}
        className={cn("h-auto w-auto", className)}
        priority={priority}
      />
    );
  }

  if (variant === "dark") {
    return (
      <Image
        src="/brand/dark-logo.webp"
        alt="Unique Sky Way"
        width={width}
        height={scaledHeight(width, LOGO_SIZES.dark)}
        className={cn("h-auto w-auto", className)}
        priority={priority}
      />
    );
  }

  return (
    <>
      <Image
        src="/brand/light-logo.webp"
        alt="Unique Sky Way"
        width={width}
        height={scaledHeight(width, LOGO_SIZES.light)}
        className={cn("h-auto w-auto dark:hidden", className)}
        priority={priority}
      />
      <Image
        src="/brand/dark-logo.webp"
        alt="Unique Sky Way"
        width={width}
        height={scaledHeight(width, LOGO_SIZES.dark)}
        className={cn("hidden h-auto w-auto dark:block", className)}
        priority={priority}
      />
    </>
  );
}
