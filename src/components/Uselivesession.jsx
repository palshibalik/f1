/**
 * useLiveSession.js
 * 
 * Drop-in replacement hook for live session detection in Header.jsx.
 * 
 * FIXES these console errors:
 *   - GET position?session_key=XXXXX&date%3E=... 404 (Not Found)
 *   - GET position?session_key=latest 429 (Too Many Requests)
 * 
 * HOW TO USE IN Header.jsx:
 *   Replace whatever OpenF1 polling logic you have with:
 * 
 *     import { useLiveSession } from "../services/useLiveSession";
 *     const { isLive, sessionType } = useLiveSession();
 *     // isLive: boolean — true when a session is actively running
 *     // sessionType: string | null — "Race", "Qualifying", "Practice 1", etc.
 */

import { useEffect, useState, useRef } from "react";

const OPENF1 = "https://api.openf1.org/v1";

async function safeFetch(url, ms = 8000) {
  const ctrl = new AbortController();
  const tid  = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(tid);
    if (!res.ok) return null;          // treat 404/429 as null, not an error
    return res.json();
  } catch {
    clearTimeout(tid);
    return null;
  }
}

export function useLiveSession() {
  const [isLive,      setIsLive]      = useState(false);
  const [sessionType, setSessionType] = useState(null);
  const cancelRef = useRef(false);

  useEffect(() => {
    cancelRef.current = false;
    let tid = null;

    async function check() {
      if (cancelRef.current) return;

      const now = Date.now();

      // Step 1: find a session that started in the last 8 hours
      const fromIso = new Date(now - 8 * 3600000).toISOString().slice(0, 19);

      // NOTE: do NOT add a date>= filter to the position query — it causes 404
      // when the session has ended (no positions in the requested window)
      const sessions = await safeFetch(
        `${OPENF1}/sessions?date_start>=${encodeURIComponent(fromIso)}`
      );

      let sess = null;
      if (sessions?.length) {
        const sorted = [...sessions].sort(
          (a, b) => new Date(b.date_start) - new Date(a.date_start)
        );
        // Prefer a session with no end date (still running)
        sess = sorted.find(s => !s.date_end || new Date(s.date_end).getTime() > now)
          || sorted[0];
      }

      if (!sess) {
        // No recent session found — definitely not live
        if (!cancelRef.current) {
          setIsLive(false);
          setSessionType(null);
          tid = setTimeout(check, 5 * 60 * 1000); // check again in 5 min
        }
        return;
      }

      // Step 2: check if the session is actually live
      const sessionOpen  = !sess.date_end;
      const startMs      = new Date(sess.date_start).getTime();
      const endMs        = sess.date_end
        ? new Date(sess.date_end).getTime()
        : startMs + 4 * 3600000;
      const withinWindow = now >= startMs - 15 * 60000 && now <= endMs + 3600000;

      const live = sessionOpen || withinWindow;

      if (!cancelRef.current) {
        setIsLive(live);
        setSessionType(live ? (sess.session_name || sess.session_type || null) : null);

        // Poll fast when live, slow when idle
        tid = setTimeout(check, live ? 15000 : 2 * 60 * 1000);
      }
    }

    check();
    return () => {
      cancelRef.current = true;
      if (tid) clearTimeout(tid);
    };
  }, []);

  return { isLive, sessionType };
}