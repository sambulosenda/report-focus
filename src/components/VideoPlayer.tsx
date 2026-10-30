"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { videoEmbedUrl } from "@/lib/video";
import { PlayIcon } from "./icons";

const AUTOPLAY_KEY = "rf-autoplay";
const readAutoplay = () => {
  try {
    return localStorage.getItem(AUTOPLAY_KEY) !== "off";
  } catch {
    return true;
  }
};

type Props = { src?: string | null; poster?: string | null; title: string; nextHref?: string };

/** Plays an uploaded file with native controls, or embeds YouTube and Vimeo links. */
export function VideoPlayer({ src, poster, title, nextHref }: Props) {
  const router = useRouter();
  const embed = src ? videoEmbedUrl(src) : null;
  const frame = "relative aspect-video w-full overflow-hidden rounded-md bg-black";

  if (embed) {
    return (
      <div className={frame}>
        <iframe src={embed} title={title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen className="absolute inset-0 h-full w-full" />
      </div>
    );
  }
  if (src) {
    return (
      <div className={frame}>
        <video
          src={src}
          poster={poster ?? undefined}
          controls
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full"
          onEnded={() => nextHref && readAutoplay() && router.push(nextHref)}
        >
          Your browser can’t play this video.
        </video>
      </div>
    );
  }
  return (
    <div className={frame}>
      {poster && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover opacity-85" />
      )}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <span aria-hidden className="inline-flex h-[84px] w-[84px] items-center justify-center rounded-full bg-brand opacity-70">
          <PlayIcon size={26} color="#fff" />
        </span>
        <span className="rounded bg-black/65 px-3 py-1.5 text-[13px] font-semibold text-white">Video not attached yet</span>
      </div>
    </div>
  );
}

export function AutoplaySwitch() {
  const [on, setOn] = useState(true);
  useEffect(() => setOn(readAutoplay()), []);
  const toggle = () => {
    const next = !on;
    setOn(next);
    try {
      localStorage.setItem(AUTOPLAY_KEY, next ? "on" : "off");
    } catch {
      /* private mode: keep the in-memory choice */
    }
  };
  return (
    <span className="flex items-center gap-2 text-[13px] text-on-teal">
      Autoplay
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Autoplay the next video"
        onClick={toggle}
        className={`inline-flex h-[26px] w-11 rounded-full p-[3px] transition-colors ${on ? "justify-end bg-brand" : "justify-start bg-teal-line"}`}
      >
        <span className="block h-5 w-5 rounded-full bg-white" />
      </button>
    </span>
  );
}
