import { t } from '../i18n';

export function NotFoundPage({ message }: { message: string }) {
  return (
    <main className="container narrow">
      <div className="state-box">
        <h2>{t('notFound.title')}</h2>
        <p>{message}</p>
        <a className="btn btn-primary" href="#/">
          {t('notFound.home')}
        </a>
      </div>
    </main>
  );
}
