import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { t } from '../i18n';
import { copyText } from '../lib/clipboard';

interface ToastApi {
  show: (message: string) => void;
}

const ToastContext = createContext<ToastApi>({ show: () => undefined });

const TOAST_MS = 1800;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const show = useCallback((msg: string) => {
    setMessage(msg);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMessage(null), TOAST_MS);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div aria-live="polite" role="status">
        {message && (
          <div className="toast">
            <span className="ok" aria-hidden="true">
              ✓
            </span>
            {message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

const COPIED_MS = 1500;

/** Copies text, shows the global toast and exposes a short-lived "copied" flag for the button label. */
export function useCopy(): [(text: string) => void, boolean] {
  const { show } = useContext(ToastContext);
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = useCallback(
    (text: string) => {
      void copyText(text).then((ok) => {
        show(ok ? t('copy.toast') : t('copy.failed'));
        if (!ok) return;
        setCopied(true);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setCopied(false), COPIED_MS);
      });
    },
    [show],
  );
  return [copy, copied];
}
