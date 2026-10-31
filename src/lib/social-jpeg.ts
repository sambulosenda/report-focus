import sharp from "sharp";
import { SOCIAL_HEIGHT, SOCIAL_WIDTH } from "@/lib/social-image";

/** Cover-crops a photo to the share frame, keeping the top so a head is not cut off. Phone pictures are rotated from their EXIF data first. */
export function toSocialJpeg(input: Buffer) {
  return sharp(input, { failOn: "none", animated: false, limitInputPixels: 40_000_000 })
    .rotate()
    .resize(SOCIAL_WIDTH, SOCIAL_HEIGHT, { fit: "cover", position: "north" })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
}
