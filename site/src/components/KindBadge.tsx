import type { Kind } from '../lib/data';
import { t } from '../i18n';

export function KindBadge({ kind, large = false }: { kind: Kind; large?: boolean }) {
  return <span className={`badge kind-${kind}${large ? ' badge-lg' : ''}`}>{t(`kind.${kind}`)}</span>;
}

export function KindDot({ kind }: { kind: Kind }) {
  return <span className={`dot kind-${kind}`} aria-hidden="true" />;
}
