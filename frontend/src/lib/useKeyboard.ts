import { useEffect } from "react";

interface Shortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  handler: () => void;
}

export function useKeyboard(shortcuts: Shortcut[], enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      for (const s of shortcuts) {
        const ctrlOrMeta = s.ctrl || s.meta;
        const matchCtrl = ctrlOrMeta ? (e.ctrlKey || e.metaKey) : true;
        const matchShift = s.shift ? e.shiftKey : !e.shiftKey;
        const matchKey = e.key.toLowerCase() === s.key.toLowerCase();

        if (matchCtrl && matchShift && matchKey) {
          e.preventDefault();
          s.handler();
          return;
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shortcuts, enabled]);
}
