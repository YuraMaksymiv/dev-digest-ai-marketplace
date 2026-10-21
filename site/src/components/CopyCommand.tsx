import { t } from '../i18n';
import { useCopy } from './Toast';

export function CopyCommand({ command }: { command: string }) {
  const [copy, copied] = useCopy();
  return (
    <div className="terminal">
      <span className="prompt" aria-hidden="true">
        $
      </span>
      <code className="cmd" tabIndex={0}>
        {command}
      </code>
      <button
        type="button"
        className="copy-btn"
        data-copied={copied}
        onClick={() => copy(command)}
        aria-label={t('copy.label', { cmd: command })}
      >
        {copied ? t('copy.copied') : t('copy.copy')}
      </button>
    </div>
  );
}
