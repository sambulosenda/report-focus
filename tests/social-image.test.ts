import assert from "node:assert/strict";
import { test } from "node:test";
import sharp from "sharp";
import { toSocialJpeg } from "../src/lib/social-jpeg";
import { SOCIAL_HEIGHT, SOCIAL_WIDTH, socialImagePath, socialImageSrc } from "../src/lib/social-image";

test("share crops stay on our pictures and come out 1200 by 630", async () => {
  delete process.env.MEDIA_HOST;
  delete process.env.S3_PUBLIC_URL;

  assert.equal(socialImageSrc(""), null);
  assert.equal(socialImageSrc("/demo/city.svg"), null);
  assert.equal(socialImageSrc("/media/../../.env"), null);
  assert.equal(socialImageSrc("http://media.reportfocusnews.com/2026/10/a.jpg"), null);
  assert.equal(socialImageSrc("https://example.com/a.jpg"), null);
  assert.equal(socialImageSrc("https://127.0.0.1/a.jpg"), null);
  assert.equal(socialImageSrc("/media/2026/10/a.jpg"), "/media/2026/10/a.jpg");
  assert.equal(
    socialImageSrc("https://media.reportfocusnews.com/2026/10/a.jpg"),
    "https://media.reportfocusnews.com/2026/10/a.jpg",
  );
  assert.equal(
    socialImageSrc("https://backend.reportfocusnews.com/wp-content/uploads/photo.jpeg"),
    "https://backend.reportfocusnews.com/wp-content/uploads/photo.jpeg",
  );
  assert.equal(
    socialImagePath("https://media.reportfocusnews.com/2026/10/a.jpg"),
    "/social-image?v=2&src=https%3A%2F%2Fmedia.reportfocusnews.com%2F2026%2F10%2Fa.jpg",
  );
  assert.equal(socialImagePath("https://example.com/a.jpg"), null);

  const tall = await sharp({
    create: { width: 400, height: 900, channels: 3, background: { r: 200, g: 16, b: 46 } },
  })
    .jpeg()
    .toBuffer();
  const jpeg = await toSocialJpeg(tall);
  const meta = await sharp(jpeg).metadata();
  assert.equal(meta.format, "jpeg");
  assert.equal(meta.width, SOCIAL_WIDTH);
  assert.equal(meta.height, SOCIAL_HEIGHT);

  // A tall photo keeps its top, where a person's head usually is, rather than the middle of the frame.
  const blue = await sharp({ create: { width: 400, height: 900, channels: 3, background: { r: 0, g: 0, b: 180 } } }).jpeg().toBuffer();
  const red = await sharp({ create: { width: 400, height: 180, channels: 3, background: { r: 200, g: 16, b: 46 } } }).jpeg().toBuffer();
  const portrait = await sharp(blue).composite([{ input: red, top: 0, left: 0 }]).jpeg().toBuffer();
  const cropped = await toSocialJpeg(portrait);
  const top = await sharp(cropped).extract({ left: 600, top: 8, width: 1, height: 1 }).raw().toBuffer();
  assert.ok(top[0] > 150 && top[2] < 80, "top of a portrait stays in the share crop");
});
