import { useEffect } from 'react';

export interface ShortcutOptions {
  key: string;
  meta?: boolean;
  shift?: boolean;
  /** Skip while the user is typing in an input / textarea / contenteditable. */
  ignoreInputs?: boolean;
}

export function useKeyboardShortcut(
  { key, meta = false, shift = false, ignoreInputs = true }: ShortcutOptions,
  handler: (event: KeyboardEvent) => void,
): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== key.toLowerCase()) return;
      if (meta && !(event.metaKey || event.ctrlKey)) return;
      if (!meta && (event.metaKey || event.ctrlKey)) return;
      if (shift !== event.shiftKey) return;

      if (ignoreInputs) {
        const target = event.target as HTMLElement | null;
        const tag = target?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;
      }

      handler(event);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [key, meta, shift, ignoreInputs, handler]);
}
