"use client";

import { useReportWebVitals } from "next/web-vitals";

export function WebVitals() {
  useReportWebVitals((metric) => {
    const body = JSON.stringify(metric);
    const url = "/api/telemetry";

    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(url, body);
    } else {
      fetch(url, { body, method: "POST", keepalive: true }).catch(() => {});
    }
  });

  return null;
}
