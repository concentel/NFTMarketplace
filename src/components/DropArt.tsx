/* A drop's artwork, or a generated stand-in when the media route would refuse
   the image (a drop that reuses a work not yet listed — see getMediaInfo).
   Requesting it anyway would show a broken image and log a 404 in the console. */

import Image from "next/image";
import { assetSrc } from "@/lib/media";
import { seedFrom } from "@/lib/hash";
import type { DropView } from "@/lib/repo";
import { TokenArt } from "./visuals/TokenArt";

export function DropArt({ drop, sizes, alt = "", eager = false }: { drop: DropView; sizes: string; alt?: string; eager?: boolean }) {
  if (!drop.imageShown) {
    return <TokenArt seed={drop.id} hue={seedFrom(drop.id) % 360} label={alt ? `${alt} — artwork not yet revealed` : undefined} />;
  }
  return <Image suppressHydrationWarning src={assetSrc(drop.id)} alt={alt} fill unoptimized sizes={sizes} loading={eager ? "eager" : undefined} />;
}
