import { Link } from 'react-router';
import { DS, GRD } from './ds';
import { useLocaleStore } from '../../store/localeStore';
import { Mail, Phone, MapPin, Send, Zap, Globe, Shield, BookOpen, Settings } from 'lucide-react';

export function Footer() {
  const { locale } = useLocaleStore();

  const withLocale = (href: string) => {
    if (href.startsWith('/admin') || href.startsWith('/khach-hang') || href.startsWith('/nhan-vien') || href.startsWith('/dang-')) {
      return href;
    }
    if (href === '/') return `/${locale}`;
    return `/${locale}${href}`;
  };

  const cols = [
    {
      title: 'Dịch vụ',
      icon: <Globe size={14} />,
      links: [
        { label: 'Thiết kế Website', href: '/dich-vu' },
        { label: 'Phát triển App', href: '/dich-vu' },
        { label: 'SaaS Platform', href: '/dich-vu' },
        { label: 'SEO & Marketing', href: '/dich-vu' },
        { label: 'Đặt lịch tư vấn', href: '/dat-lich' },
      ],
    },
    {
      title: 'Tài nguyên',
      icon: <BookOpen size={14} />,
      links: [
        { label: 'Học viện LOOP', href: '/hoc-vien' },
        { label: 'Blog & Insights', href: '/blog' },
        { label: 'Portfolio dự án', href: '/du-an' },
        { label: 'Hệ thống LP', href: '/khach-hang' },
        { label: 'Bảo giá dịch vụ', href: '/bao-gia' },
      ],
    },
    {
      title: 'Công ty',
      icon: <Shield size={14} />,
      links: [
        { label: 'Về chúng tôi', href: '/' },
        { label: 'Đội ngũ', href: '/doi-ngu' },
        { label: 'Tuyển dụng', href: '/lien-he' },
        { label: 'Quy trình công ty', href: '/quy-trinh' },
        { label: 'Điều khoản', href: '/' },
        { label: 'Liên hệ', href: '/lien-he' },
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
            <span style={{ color: DS.blue, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.18em' }}>BẮT ĐẦU HÀNH TRÌNH</span>
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
            SẴN SÀNG NÂNG CẤP DIGITAL?
          </h2>
          <p style={{ color: DS.text3, fontSize: 15, marginBottom: 32, lineHeight: 1.7 }}>
            Tư vấn miễn phí 30 phút. Nhận ngay <span style={{ color: DS.blue, fontWeight: 700 }}>500 LP</span> điểm thưởng khi đăng ký hôm nay.
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
              Đặt lịch tư vấn →
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
              Xem portfolio
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
              Hệ điều hành số cho Digital Agency. Kết hợp công nghệ tiên tiến với hệ thống LP gamified, biến công việc thành trải nghiệm đáng nhớ.
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
                ── NHẬN CẬP NHẬT
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
            <div key={col.title}>
              <div
                className="flex items-center gap-2 mb-5"
                style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.18em' }}
              >
                <span style={{ color: DS.blue }}>{col.icon}</span>
                {col.title.toUpperCase()}
              </div>
              <div className="space-y-2.5">
                {col.links.map((link) => (
                  <Link
                    key={link.label}
                    to={withLocale(link.href)}
                    style={{ display: 'block', color: DS.text4, fontSize: 13, textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = DS.text; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = DS.text4; }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="flex items-center justify-between flex-wrap gap-4 mt-12 pt-6"
          style={{ borderTop: `1px solid ${DS.border}` }}
        >
          <div style={{ color: DS.text5, fontSize: 12, fontFamily: DS.mono }}>
            © 2026 LOOP SOLUTIONS. All rights reserved.
          </div>

          <div className="flex items-center gap-2">
            {(['iron', 'bronze', 'silver', 'gold', 'platinum', 'ruby', 'diamond'] as const).map((r, i) => {
              const colors = ['#9CA3AF','#CD7F32','#CBD5E1','#FFD700','#14B8A6','#EF4444','#818CF8'];
              return (
                <div
                  key={r}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: colors[i], boxShadow: `0 0 4px ${colors[i]}` }}
                />
              );
            })}
          </div>

          {/* Admin link */}
          <Link
            to="/admin"
            className="flex items-center gap-1.5"
            style={{
              color: DS.text5,
              fontSize: 11,
              fontFamily: DS.mono,
              letterSpacing: '0.12em',
              textDecoration: 'none',
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.06)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = DS.blue; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = DS.text5; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
          >
            <Settings size={11} />
            ADMIN
          </Link>

          <div style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em' }}>
            SEASON III · 2026
          </div>
        </div>
      </div>
    </footer>
  );
}