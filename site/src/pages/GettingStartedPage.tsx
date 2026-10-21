import { CopyCommand } from '../components/CopyCommand';
import { t, type MessageKey } from '../i18n';
import { useCatalog } from '../lib/data';

interface Step {
  title: MessageKey;
  desc: MessageKey;
  commands: { lead?: MessageKey; cmd: string }[];
}

export function GettingStartedPage() {
  const { commands } = useCatalog().index.marketplace;
  const steps: Step[] = [
    {
      title: 'gs.step1Title',
      desc: 'gs.step1Desc',
      commands: [{ cmd: commands.addMarketplace }, { lead: 'gs.step1CliDesc', cmd: commands.addMarketplaceCli }],
    },
    {
      title: 'gs.step2Title',
      desc: 'gs.step2Desc',
      commands: [{ cmd: commands.installPlugin }, { lead: 'gs.step2CliDesc', cmd: commands.installPluginCli }],
    },
    { title: 'gs.step3Title', desc: 'gs.step3Desc', commands: [{ cmd: commands.updateMarketplace }, { cmd: commands.updatePlugin }] },
    { title: 'gs.step4Title', desc: 'gs.step4Desc', commands: [{ cmd: commands.reload }] },
  ];
  if (commands.rollback?.length) {
    steps.push({ title: 'gs.step5Title', desc: 'gs.step5Desc', commands: commands.rollback.map((cmd) => ({ cmd })) });
  }

  return (
    <main className="container guide">
      <a className="back-link" href="#/">
        {t('gs.back')}
      </a>
      <div className="guide">
        <h1>{t('gs.title')}</h1>
        <p className="muted" style={{ maxWidth: 560 }}>
          {t('gs.subtitle')}
        </p>
      </div>
      <ol className="steps" style={{ listStyle: 'none', padding: 0 }}>
        {steps.map((s, i) => (
          <li key={s.title} className="step">
            <div className="step-n" aria-hidden="true">
              {i + 1}
            </div>
            <div className="step-body">
              <h3>{t(s.title)}</h3>
              <p>{t(s.desc)}</p>
              {s.commands.map((c) => (
                <div key={c.cmd} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {c.lead && <p>{t(c.lead)}</p>}
                  <CopyCommand command={c.cmd} />
                </div>
              ))}
            </div>
          </li>
        ))}
      </ol>
      <div className="note" style={{ marginTop: 30 }}>
        <strong>{t('gs.noteTitle')}</strong> {t('gs.noteText')}
      </div>
    </main>
  );
}
