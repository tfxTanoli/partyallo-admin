import { useCallback, useState } from 'react';

export interface Disclosure {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setOpen: (value: boolean) => void;
}

export function useDisclosure(initial = false): Disclosure {
  const [isOpen, setOpen] = useState(initial);

  return {
    isOpen,
    open: useCallback(() => setOpen(true), []),
    close: useCallback(() => setOpen(false), []),
    toggle: useCallback(() => setOpen((value) => !value), []),
    setOpen,
  };
}

export interface EntityDisclosure<T> extends Omit<Disclosure, 'open'> {
  entity: T | null;
  open: (entity: T) => void;
}

/** Disclosure that carries the row it was opened for (edit / delete / view flows). */
export function useEntityDisclosure<T>(): EntityDisclosure<T> {
  const [entity, setEntity] = useState<T | null>(null);
  const [isOpen, setOpen] = useState(false);

  const open = useCallback((next: T) => {
    setEntity(next);
    setOpen(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  return {
    entity,
    isOpen,
    open,
    close,
    toggle: useCallback(() => setOpen((value) => !value), []),
    setOpen,
  };
}
