import { useEffect, useState } from "react";

const currentHash = (): string => window.location.hash.replace(/^#/, "");

/** Tracks `location.hash` (without the leading `#`) as React state, the single
 *  source of truth for which docs Example is active. */
export const useHash = (): string => {
  const [hash, setHash] = useState(currentHash);
  useEffect(() => {
    const onChange = () => setHash(currentHash());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash;
};
