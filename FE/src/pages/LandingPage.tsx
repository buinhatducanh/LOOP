import { useI18n } from '@/i18n';

export function LandingPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative flex items-center justify-center min-h-[80vh] px-6">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent"
              style={{ fontFamily: 'Cinzel, serif' }}>
            {t('home.hero.title')}
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            {t('home.hero.subtitle')}
          </p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="/dich-vu"
              className="px-8 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors font-semibold"
            >
              {t('navigation.services')}
            </a>
            <a
              href="/lien-he"
              className="px-8 py-3 rounded-lg border border-white/20 hover:border-white/40 transition-colors"
            >
              {t('navigation.contact')}
            </a>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 px-6">
        <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: 'Cinzel, serif' }}>
          {t('services.title')}
        </h2>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(['web', 'app', 'dashboard', 'seo'] as const).map((key) => (
            <div
              key={key}
              className="p-6 rounded-xl bg-[#0F172A] border border-white/10 hover:border-blue-500/50 transition-all"
            >
              <div className="text-3xl mb-3">{t(`services.items.${key}.icon`)}</div>
              <h3 className="text-lg font-semibold mb-2">{t(`services.items.${key}.title`)}</h3>
              <p className="text-sm text-gray-400">{t(`services.items.${key}.desc`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Cinzel, serif' }}>
          {t('home.cta.title')}
        </h2>
        <p className="text-gray-400 mb-6">{t('home.cta.subtitle')}</p>
        <a
          href="/dat-lich"
          className="inline-block px-10 py-4 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-bold text-lg transition-all"
        >
          {t('common.bookNow')}
        </a>
      </section>
    </div>
  );
}
