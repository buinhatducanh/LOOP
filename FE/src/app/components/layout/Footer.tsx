import { Link } from 'react-router';
import { DS, GRD } from './ds';
import { useLocaleStore } from '../../store/localeStore';
import { useI18n } from '../../../i18n/sync.tsx';
import { Mail, Phone, MapPin, Send, Zap, Globe, Shield, BookOpen, Settings } from 'lucide-react';

export function Footer() {
  const { locale } = useLocaleStore();
  const { t } = useI18n();

  const withLocale = (href: string) => {
    if (href.startsWith('/admin') || href.startsWith('/khach-hang') || href.startsWith('/nhan-vien') || href.startsWith('/dang-')) {
      return href;
    }
    if (href === '/') return `/${locale}`;
    return `/${locale}${href}`;
  };

  const cols = [
    {
      titleKey: 'footer.services',
      icon: <Globe size={14} />,
      links: [
        { labelKey: 'services.webDev', href: '/dich-vu' },
        { labelKey: 'services.appDev', href: '/dich-vu' },
        { labelKey: 'services.dashboard', href: '/dich-vu' },
        { labelKey: 'services.seo', href: '/dich-vu' },
        { labelKey: 'booking.title', href: '/dat-lich' },
      ],
    },
    {
      titleKey: 'footer.resources',
      icon: <BookOpen size={14} />,
      links: [
        { labelKey: 'academy.title', href: '/hoc-vien' },
        { labelKey: 'blog.title', href: '/blog' },
        { labelKey: 'portfolio.title', href: '/du-an' },
        { labelKey: 'customer.dashboard', href: '/khach-hang' },
        { labelKey: 'navigation.pricing', href: '/bao-gia' },
      ],
    },
    {
      titleKey: 'footer.company',
      icon: <Shield size={14} />,
      links: [
        { labelKey: 'about.title', href: '/' },
        { labelKey: 'navigation.team', href: '/doi-ngu' },
        { labelKey: 'navigation.contact', href: '/lien-he' },
        { labelKey: 'footer.privacyPolicy', href: '/' },
        { labelKey: 'navigation.contact', href: '/lien-he' },
      ],
    },
  ];

  return (
    <footer style={{ background: '#010410', borderTop: `1px solid ${DS.border}` }}>
      {/* CTA Banner */}
      <div
        className="py-16 px-8"
        style={{
          background: 'linear-gradient(135deg, rgba(29,78,216,0.15) 0%, rgba(129,140,248,0.08) 100%)',
          borderBottom: `1px solid ${DS.border}`,
        }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full"
            style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)' }}
          >
            <Zap size={12} style={{ color: DS.blue }} />
            <span style={{ color: DS.blue, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.18em' }}>START YOUR JOURNEY</span>
          </div>
          <h2
            style={{
              fontFamily: DS.heading,
              fontSize: 32,
              fontWeight: 900,
              letterSpacing: '0.06em',
              background: 'linear-gradient(135deg, #FFFFFF, #94A3B8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: 12,
            }}
          >
            {t('footer.ctaTitle', 'SẴN SÀNG NÂNG CẤP DIGITAL?')}
          </h2>
          <p style={{ color: DS.text3, fontSize: 15, marginBottom: 32, lineHeight: 1.7 }}>
            {t('footer.ctaDesc', 'Tư vấn miễn phí 30 phút. Nhận ngay điểm thưởng khi đăng ký hôm nay.')}
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              to={withLocale('/dat-lich')}
              style={{
                background: GRD.primary,
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                padding: '12px 28px',
                borderRadius: 10,
                textDecoration: 'none',
                boxShadow: '0 0 24px rgba(129,140,248,0.4)',
              }}
            >
              {t('booking.title', 'Đặt lịch tư vấn')} →
            </Link>
            <Link
              to={withLocale('/du-an')}
              style={{
                color: DS.text3,
                fontSize: 14,
                padding: '12px 28px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.1)',
                textDecoration: 'none',
              }}
            >
              {t('navigation.portfolio', 'Xem Portfolio')}
            </Link>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Brand column */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: GRD.primary, boxShadow: '0 0 20px rgba(129,140,248,0.4)' }}
              >
                <span style={{ color: '#fff', fontSize: 18, fontWeight: 900 }}>∞</span>
              </div>
              <div>
                <div style={{ color: DS.text, fontFamily: DS.heading, fontSize: 17, fontWeight: 900, letterSpacing: '0.1em' }}>
                  LOOP SOLUTIONS
                </div>
                <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.2em' }}>DIGITAL AGENCY OS</div>
              </div>
            </div>
            <p style={{ color: DS.text4, fontSize: 13, lineHeight: 1.8, marginBottom: 20 }}>
              {t('footer.description', 'Hệ điều hành số cho Digital Agency. Kết hợp công nghệ tiên tiến với hệ thống LP gamified, biến công việc thành trải nghiệm đáng nhớ.')}
            </p>
            {/* Contact info */}
            <div className="space-y-2.5">
              {[
                { icon: <Mail size={13} />, text: 'hello@loopsolutions.vn' },
                { icon: <Phone size={13} />, text: '+84 (0) 901 234 567' },
                { icon: <MapPin size={13} />, text: 'TP. Hồ Chí Minh, Việt Nam' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-2.5" style={{ color: DS.text4, fontSize: 12 }}>
                  <span style={{ color: DS.blue }}>{icon}</span>
                  {text}
                </div>
              ))}
            </div>
            {/* Newsletter */}
            <div className="mt-6">
              <div style={{ color: DS.text3, fontSize: 12, marginBottom: 8, fontFamily: DS.mono, letterSpacing: '0.1em' }}>
                ── {t('footer.stayConnected', 'NHẬN CẬP NHẬT').toUpperCase()}
              </div>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="email@company.vn"
                  style={{
                    flex: 1,
                    background: DS.bgCard2,
                    border: `1px solid ${DS.border}`,
                    borderRadius: 8,
                    padding: '8px 12px',
                    color: DS.text,
                    fontSize: 12,
                    outline: 'none',
                  }}
                />
                <button
                  style={{
                    background: GRD.primary,
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 12px',
                    cursor: 'pointer',
                    color: '#fff',
                  }}
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Link columns */}
          {cols.map((col) => (
            <div key={col.titleKey}>
              <div
                className="flex items-center gap-2 mb-5"
                style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.18em' }}
              >
                <span style={{ color: DS.blue }}>{col.icon}</span>
                {t(col.titleKey, col.titleKey).toUpperCase()}
              </div>
              <div className="space-y-2.5">
                {col.links.map((link) => (
                  <Link
                    key={link.labelKey}
                    to={withLocale(link.href)}
                    style={{ display: 'block', color: DS.text4, fontSize: 13, textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = DS.text; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = DS.text4; }}
                  >
                    {t(link.labelKey, link.labelKey)}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderTop: `1px solid ${DS.border}` }}
        >
          <div style={{ color: DS.text5, fontSize: 11 }}>
            {t('footer.rights', '© 2026 LOOP. All rights reserved.')}
          </div>
          <div className="flex gap-6">
            <Link
              to={withLocale('/')}
              style={{ color: DS.text5, fontSize: 11, textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = DS.text3; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = DS.text5; }}
            >
              {t('footer.privacyPolicy', 'Privacy Policy')}
            </Link>
            <Link
              to={withLocale('/')}
              style={{ color: DS.text5, fontSize: 11, textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = DS.text3; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = DS.text5; }}
            >
              {t('footer.termsOfService', 'Terms of Service')}
            </Link>
          </div>
          {/* Highlights */}
          <div className="flex gap-4 flex-wrap justify-center">
            {[
              t('footer.highlightGlobal', '30+ countries'),
              t('footer.highlightQuality', '95+ Lighthouse'),
              t('footer.highlightSupport', '12mo support'),
            ].map((h) => (
              <div
                key={h}
                className="flex items-center gap-1.5"
                style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}
              >
                <span style={{ color: DS.blue, fontSize: 8 }}>✦</span>
                {h}
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
