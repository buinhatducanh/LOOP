import { Link } from 'react-router-dom';
import { useI18n } from '@/i18n';

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="bg-[#020617] border-t border-white/10 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-3"
                style={{ fontFamily: 'Cinzel, serif' }}>
              LOOP Solutions
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              {t('footer.tagline')}
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">
              {t('navigation.services')}
            </h4>
            <ul className="space-y-2">
              {['Web Development', 'App & SaaS', 'Dashboard', 'SEO'].map((s) => (
                <li key={s}>
                  <Link to="/dich-vu" className="text-sm text-gray-400 hover:text-white transition-colors">
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">
              {t('navigation.team')}
            </h4>
            <ul className="space-y-2">
              {[
                { label: t('navigation.team'), path: '/doi-ngu' },
                { label: t('navigation.academy'), path: '/hoc-vien' },
                { label: t('navigation.blog'), path: '/blog' },
                { label: t('navigation.contact'), path: '/lien-he' },
              ].map((item) => (
                <li key={item.path}>
                  <Link to={item.path} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">
              {t('footer.contact')}
            </h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>📧 hello@loops.vn</li>
              <li>📞 +84 28 1234 5678</li>
              <li>📍 Ho Chi Minh City, Vietnam</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">
            © 2026 LOOP Solutions. {t('footer.rights')}
          </p>
          <div className="flex gap-4 text-xs text-gray-500">
            <Link to="/privacy" className="hover:text-white transition-colors">
              {t('footer.privacy')}
            </Link>
            <Link to="/terms" className="hover:text-white transition-colors">
              {t('footer.terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
