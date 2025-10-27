"use client";

import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef, createContext, useContext, useId } from "react";

export type AccordionHandle = {
  openAll: () => void;
  closeAll: () => void;
};

interface AccordionItemProps {
  id?: string; // optional stable id used to persist open state
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

interface AccordionContextValue {
  openIds: Set<string>;
  toggleId: (id: string) => void;
  registerId: (id: string, defaultOpen?: boolean) => void;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

export const AccordionItem: React.FC<AccordionItemProps> = ({ id, title, children, defaultOpen = false, className = "" }) => {
  const ctx = useContext(AccordionContext);
  const storageKey = id ? `accordion-open:${id}` : null;
  const [localOpen, setLocalOpen] = useState<boolean>(defaultOpen);
  const rid = useId();
  const contentId = id ? `${id}-content` : `accordion-content-${rid}`;

  useEffect(() => {
    if (id && ctx) {
      ctx.registerId(id, defaultOpen);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // persisted store for items without context or fallback
  useEffect(() => {
    if (!ctx && storageKey && typeof window !== "undefined") {
      try {
        const v = localStorage.getItem(storageKey);
        if (v !== null) setLocalOpen(v === "1");
      } catch {
        // ignore
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ctx && storageKey && typeof window !== "undefined") {
      try {
        localStorage.setItem(storageKey, localOpen ? "1" : "0");
      } catch {
        // ignore
      }
    }
  }, [localOpen, storageKey, ctx]);

  const isOpen = id && ctx ? ctx.openIds.has(id) : localOpen;

  const contentRef = React.useRef<HTMLDivElement | null>(null);

  const toggle = () => {
    if (id && ctx) {
      ctx.toggleId(id);
    } else {
      setLocalOpen(v => !v);
    }
  };

  // measured height animation: when opening, set explicit height to scrollHeight then after transition set to auto.
  React.useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    // ensure padding/border present when open
    if (isOpen) {
      el.style.display = 'block';
      const start = el.scrollHeight;
      el.style.height = '0px';
      // force reflow
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      el.offsetHeight;
      el.style.transition = 'height 200ms ease';
      el.style.height = `${start}px`;

      const onEnd = () => {
        el.style.height = 'auto';
        el.style.transition = '';
        el.removeEventListener('transitionend', onEnd);
      };
      el.addEventListener('transitionend', onEnd);
    } else {
      // closing
      const curHeight = el.scrollHeight;
      el.style.height = `${curHeight}px`;
      // force reflow
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      el.offsetHeight;
      el.style.transition = 'height 200ms ease';
      el.style.height = '0px';
      const onEnd2 = () => {
        el.style.transition = '';
        el.style.display = 'none';
        el.removeEventListener('transitionend', onEnd2);
      };
      el.addEventListener('transitionend', onEnd2);
    }
  }, [isOpen]);

  return (
    <div className={`border rounded-md ${className}`}>
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between p-3 text-left bg-white"
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <span className="font-medium">{title}</span>
        <span className="ml-2 text-sm text-gray-500">{isOpen ? "-" : "+"}</span>
      </button>
      <div
        id={contentId}
        role="region"
        aria-hidden={!isOpen}
        ref={contentRef}
        style={{ height: isOpen ? 'auto' : '0px', overflow: 'hidden', display: isOpen ? 'block' : 'none' }}
      >
        <div className="p-3 border-t bg-gray-50">
          {children}
        </div>
      </div>
    </div>
  );
};

interface AccordionProps {
  children: React.ReactNode;
  className?: string;
}

export const Accordion = forwardRef<AccordionHandle, AccordionProps>(({ children, className = "" }, ref) => {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const registered = useRef<Map<string, boolean>>(new Map());

  const registerId = (id: string, defaultOpen: boolean = false) => {
    registered.current.set(id, defaultOpen);
    setOpenIds(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      // read persisted value if exists
      try {
        const v = localStorage.getItem(`accordion-open:${id}`);
        if (v !== null) {
          if (v === '1') next.add(id);
        } else if (defaultOpen) {
          next.add(id);
        }
      } catch {
        if (defaultOpen) next.add(id);
      }
      return next;
    });
  };

  const toggleId = (id: string) => {
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        try { localStorage.setItem(`accordion-open:${id}`, '0'); } catch {}
      } else {
        next.add(id);
        try { localStorage.setItem(`accordion-open:${id}`, '1'); } catch {}
      }
      return next;
    });
  };

  const openAll = () => {
    const all = new Set<string>();
    for (const k of Array.from(registered.current.keys())) all.add(k);
    setOpenIds(all);
    try {
      for (const k of Array.from(registered.current.keys())) localStorage.setItem(`accordion-open:${k}`, '1');
    } catch {}
  };

  const closeAll = () => {
    setOpenIds(new Set());
    try {
      for (const k of Array.from(registered.current.keys())) localStorage.setItem(`accordion-open:${k}`, '0');
    } catch {}
  };

  useImperativeHandle(ref, () => ({ openAll, closeAll }));

  return (
    <AccordionContext.Provider value={{ openIds, toggleId, registerId }}>
      <div className={`space-y-3 ${className}`}>{children}</div>
    </AccordionContext.Provider>
  );
});

export default Accordion;
