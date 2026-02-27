import { cn } from "@/lib/utils";
import { proxyImageUrl } from "@/lib/image-proxy";

export interface ImageProps {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  rounded?: boolean;
}

export function Image({ src, alt, width, height, rounded }: ImageProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={proxyImageUrl(src) || src}
      alt={alt || ""}
      width={width}
      height={height}
      className={cn("max-w-full", rounded && "rounded-lg")}
    />
  );
}
