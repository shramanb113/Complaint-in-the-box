"use client";

import { useEffect, useRef } from "react";
import { track, type AnalyticsEvent, type AnalyticsProps } from "./track";

export interface TrackOnMountProps {
  event: AnalyticsEvent;
  props?: AnalyticsProps;
}

/** Fires `track()` exactly once, the first time this mounts. Renders nothing — drop it anywhere in the tree. */
export function TrackOnMount({ event, props }: TrackOnMountProps) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    track(event, props);
  }, [event, props]);
  return null;
}
