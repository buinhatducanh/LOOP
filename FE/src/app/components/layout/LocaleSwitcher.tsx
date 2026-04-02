/**
 * LocaleSwitcher — dropdown to switch between VI/EN/JA/KO/ZH
 * Used in Navbar and Footer.
 */
import { useState, useRef, useEffect } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { LOCALE_FLAGS, LOCALE_LABELS, SUPPORTED_LOCALES } from '@/store/localeStore';
import type { Locale } from '@/store/localeStore';
import { DS } from './ds';

export function LocaleSwitcher() {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Switch language"
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 10px',
          background: 'rgba(255,255,255,0.06)',
          border: `1px solid ${DS.border}`,
          borderRadius: '8px',
          color: DS.text2,
          fontSize: '13px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          fontFamily: DS.fonts.mono,
          letterSpacing: '0.05em',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)';
          (e.currentTarget as HTMLButtonElement).style.color = DS.text;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
          (e.currentTarget as HTMLButtonElement).style.color = DS.text2;
        }}
      >
        <span style={{ fontSize: '16px' }}>{LOCALE_FLAGS[locale]}</span>
        <span>{LOCALE_LABELS[locale]}</span>
        <svg
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            opacity: 0.6,
          }}
        >
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            minWidth: '130px',
            background: DS.bgCard,
            border: `1px solid ${DS.border}`,
            borderRadius: '10px',
            padding: '4px',
            zIndex: 1000,
            boxShadow: `0 8px 32px rgba(0,0,0,0.5)`,
          }}
        >
          {SUPPORTED_LOCALES.map((l: Locale) => (
            <button
              key={l}
              onClick={() => {
                setLocale(l);
                setOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 12px',
                background: l === locale ? 'rgba(59,130,246,0.15)' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                color: l === locale ? DS.blue : DS.text2,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s',
                fontFamily: DS.fonts.mono,
              }}
              onMouseEnter={(e) => {
                if (l !== locale) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
                }
              }}
              onMouseLeave={(e) => {
                if (l !== locale) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }
              }}
            >
              <span style={{ fontSize: '16px' }}>{LOCALE_FLAGS[l]}</span>
              <span>{LOCALE_LABELS[l]}</span>
              {l === locale && (
                <span style={{ marginLeft: 'auto', color: DS.blue, fontSize: '11px' }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
