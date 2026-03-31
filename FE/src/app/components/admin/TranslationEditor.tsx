/**
 * TranslationEditor — Shared i18n field editor for Admin CMS tabs.
 *
 * Allows editing translations for 4 non-VI locales (EN/JA/KO/ZH)
 * alongside the read-only VI base values.
 *
 * Usage:
 *   <TranslationEditor
 *     baseValues={service}              // VI values (read-only display)
 *     translations={service.i18n ?? {}} // { en: {...}, ja: {...} }
 *     locales={LOCALES}
 *     fields={FIELDS}
 *     onChange={(t) => setI18n(t)}
 *   />
 *
 * Translations are stored as:
 *   { en: { title: "...", shortDescription: "..." }, ja: { ... }, ... }
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Plus, X, ChevronDown, ChevronUp, Eye, EyeOff, Languages } from 'lucide-react';
import { DS, GRD } from '../layout/ds';

// ── Types ────────────────────────────────────────────────────────────────────

export type FieldType = 'text' | 'textarea' | 'array';

export interface FieldDef {
  key: string;
  label: string;
  placeholder?: string;
  type: FieldType;
  /** For array fields: items currently in VI base */
  baseItems?: string[];
}

export interface LocaleDef {
  code: string;
  label: string;
  flag: string;
  nativeLabel: string;
}

/** translations[locale][fieldKey] */
export type TranslationsMap = Record<string, Record<string, string | string[]>>;

// ── Constants ────────────────────────────────────────────────────────────────

export const CMS_LOCALES: LocaleDef[] = [
  { code: 'en', label: 'EN', flag: '🇬🇧', nativeLabel: 'English' },
  { code: 'ja', label: 'JA', flag: '🇯🇵', nativeLabel: '日本語' },
  { code: 'ko', label: 'KO', flag: '🇰🇷', nativeLabel: '한국어' },
  { code: 'zh', label: 'ZH', flag: '🇨🇳', nativeLabel: '中文' },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

const rgba = (hex: string, a: number) => {
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
};

// ── Array Input (for features[], technologies[], tags[]) ─────────────────────

function ArrayField({
  label,
  items,
  baseItems = [],
  onChange,
}: {
  label: string;
  items: string[];
  baseItems?: string[];
  onChange: (items: string[]) => void;
}) {
  const [input, setInput] = useState('');

  const addItem = () => {
    const trimmed = input.trim();
    if (trimmed && !items.includes(trimmed)) {
      onChange([...items, trimmed]);
      setInput('');
    }
  };

  const removeItem = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); addItem(); }
    if (e.key === ',') { e.preventDefault(); addItem(); }
  };

  const allItems = [...new Set([...baseItems, ...items])];

  return (
    <div>
      <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: 'block', marginBottom: 6 }}>
        {label}
      </label>

      {/* Tag display */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {allItems.map((item) => {
          const isTranslated = items.includes(item);
          return (
            <span
              key={item}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
              style={{
                background: isTranslated ? `${DS.purple}20` : `${DS.text4}15`,
                border: `1px solid ${isTranslated ? `${DS.purple}40` : `${DS.border}`}`,
                color: isTranslated ? DS.purple : DS.text4,
                fontFamily: DS.mono,
              }}
            >
              {isTranslated ? '✓' : '·'} {item}
              {isTranslated && (
                <button
                  onClick={() => removeItem(items.indexOf(item))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, color: DS.purple }}
                >
                  <X size={10} />
                </button>
              )}
            </span>
          );
        })}
        {allItems.length === 0 && (
          <span style={{ color: DS.text4, fontSize: 11, fontStyle: 'italic' }}>
            No items yet
          </span>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type and press Enter or comma to add..."
          style={{
            flex: 1,
            background: DS.bgCard2,
            border: `1px solid ${DS.border}`,
            borderRadius: 8,
            padding: '6px 10px',
            color: DS.text,
            fontSize: 12,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <button
          onClick={addItem}
          className="px-3 py-1 rounded-lg text-xs font-bold"
          style={{
            background: `${DS.purple}20`,
            border: `1px solid ${DS.purple}40`,
            color: DS.purple,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <Plus size={12} />
        </button>
      </div>
      <div style={{ color: DS.text4, fontSize: 10, marginTop: 4 }}>
        Press Enter or comma to add. Shows all base VI items as reference.
      </div>
    </div>
  );
}

// ── Main TranslationEditor ────────────────────────────────────────────────────

interface TranslationEditorProps {
  /** VI base values — read-only reference */
  baseValues: Record<string, unknown>;
  /** Current translations: { en: { title: "..." }, ja: {...} } */
  translations: TranslationsMap;
  /** Available locales to edit */
  locales?: LocaleDef[];
  /** Field definitions */
  fields: FieldDef[];
  /** Called when translations change */
  onChange: (translations: TranslationsMap) => void;
  /** Section label (e.g. "Service", "Project") */
  sectionLabel?: string;
}

export function TranslationEditor({
  baseValues,
  translations,
  locales = CMS_LOCALES,
  fields,
  onChange,
  sectionLabel = 'Content',
}: TranslationEditorProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [showAllFields, setShowAllFields] = useState(false);
  const [showBaseRef, setShowBaseRef] = useState(true);

  const activeLocale = locales[activeTab];
  const localeValues = translations[activeLocale.code] ?? {};

  const updateField = useCallback(
    (key: string, value: string | string[]) => {
      const next: TranslationsMap = {
        ...translations,
        [activeLocale.code]: {
          ...(translations[activeLocale.code] ?? {}),
          [key]: value,
        },
      };
      onChange(next);
    },
    [activeLocale.code, translations, onChange]
  );

  // Short fields (first 2-3) shown by default; rest behind "Show all"
  const VISIBLE_DEFAULT = 3;
  const visibleFields = showAllFields ? fields : fields.slice(0, VISIBLE_DEFAULT);
  const hiddenFields = fields.slice(VISIBLE_DEFAULT);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: `${DS.bgCard2}`,
        border: `1px solid ${DS.border}`,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ borderBottom: `1px solid ${DS.border}` }}
      >
        <Languages size={14} style={{ color: DS.purple }} />
        <span style={{ color: DS.text, fontSize: 13, fontWeight: 600, fontFamily: DS.mono, letterSpacing: '0.08em' }}>
          TRANSLATIONS — {sectionLabel.toUpperCase()}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowBaseRef(v => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs"
            style={{
              background: showBaseRef ? `${DS.blue}15` : 'transparent',
              border: `1px solid ${showBaseRef ? `${DS.blue}30` : DS.border}`,
              color: showBaseRef ? DS.blue : DS.text4,
              cursor: 'pointer',
            }}
          >
            <Eye size={10} /> VI ref
          </button>
        </div>
      </div>

      {/* Locale tabs */}
      <div
        className="flex"
        style={{ borderBottom: `1px solid ${DS.border}`, background: `${DS.bgCard}` }}
      >
        {locales.map((locale, idx) => {
          const hasAny = Object.keys(translations[locale.code] ?? {}).length > 0;
          return (
            <button
              key={locale.code}
              onClick={() => setActiveTab(idx)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 transition-all relative"
              style={{
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${activeTab === idx ? DS.purple : 'transparent'}`,
                color: activeTab === idx ? DS.purple : DS.text4,
                cursor: 'pointer',
                fontSize: 12,
                fontFamily: DS.mono,
                fontWeight: activeTab === idx ? 700 : 400,
                padding: '8px 4px',
              }}
            >
              <span style={{ fontSize: 14 }}>{locale.flag}</span>
              <span>{locale.label}</span>
              <span style={{ fontSize: 10, opacity: 0.7 }}>{locale.nativeLabel}</span>
              {hasAny && (
                <span
                  className="absolute top-1.5 right-3 w-1.5 h-1.5 rounded-full"
                  style={{ background: DS.green }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Fields */}
      <div className="p-4 space-y-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeLocale.code}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            {visibleFields.map(field => {
              const baseVal = String(baseValues[field.key] ?? '');
              const currentVal = localeValues[field.key] as string | string[] | undefined;

              if (field.type === 'array') {
                return (
                  <div key={field.key}>
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono }}>
                        {field.label.toUpperCase()}
                      </span>
                      {showBaseRef && baseVal && (
                        <span style={{ color: DS.blue, fontSize: 10, fontFamily: DS.mono }}>
                          VI: "{String(baseValues[field.key] ?? '').split(',')[0]}"
                        </span>
                      )}
                    </div>
                    <ArrayField
                      label=""
                      items={Array.isArray(currentVal) ? currentVal : []}
                      baseItems={Array.isArray(baseValues[field.key]) ? baseValues[field.key] as string[] : []}
                      onChange={val => updateField(field.key, val)}
                    />
                  </div>
                );
              }

              if (field.type === 'textarea') {
                return (
                  <div key={field.key}>
                    <div className="flex items-center gap-2 mb-1">
                      <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>
                        {field.label.toUpperCase()}
                      </label>
                      {showBaseRef && baseVal && (
                        <div className="ml-auto flex items-center gap-1">
                          <Eye size={10} style={{ color: DS.blue }} />
                          <span style={{ color: DS.blue, fontSize: 10 }}>VI ref</span>
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <textarea
                        value={(currentVal as string) ?? ''}
                        onChange={e => updateField(field.key, e.target.value)}
                        rows={4}
                        placeholder={showBaseRef ? baseVal || `Enter ${field.label}...` : `Enter ${field.label}...`}
                        style={{
                          width: '100%',
                          background: DS.bgCard,
                          border: `1px solid ${DS.border}`,
                          borderRadius: 10,
                          padding: '9px 12px',
                          color: DS.text,
                          fontSize: 12,
                          outline: 'none',
                          resize: 'vertical',
                          fontFamily: 'inherit',
                          boxSizing: 'border-box',
                          minHeight: 80,
                        }}
                      />
                      {showBaseRef && baseVal && (
                        <div
                          className="mt-1 p-2 rounded-lg text-xs"
                          style={{
                            background: `${DS.blue}08`,
                            border: `1px solid ${DS.blue}20`,
                            color: DS.text4,
                            fontStyle: 'italic',
                          }}
                        >
                          <div style={{ color: DS.blue, fontWeight: 600, marginBottom: 2 }}>VI base:</div>
                          {baseVal.length > 200 ? baseVal.slice(0, 200) + '...' : baseVal}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              // text
              return (
                <div key={field.key}>
                  <div className="flex items-center gap-2 mb-1">
                    <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>
                      {field.label.toUpperCase()}
                    </label>
                    {showBaseRef && baseVal && (
                      <div className="ml-auto flex items-center gap-1">
                        <Eye size={10} style={{ color: DS.blue }} />
                        <span style={{ color: DS.blue, fontSize: 10 }}>VI ref</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    value={(currentVal as string) ?? ''}
                    onChange={e => updateField(field.key, e.target.value)}
                    placeholder={showBaseRef ? baseVal || `Enter ${field.label}...` : `Enter ${field.label}...`}
                    style={{
                      width: '100%',
                      background: DS.bgCard,
                      border: `1px solid ${DS.border}`,
                      borderRadius: 10,
                      padding: '9px 12px',
                      color: DS.text,
                      fontSize: 13,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {showBaseRef && baseVal && (
                    <div
                      className="mt-1 px-2 py-1 rounded text-xs"
                      style={{
                        background: `${DS.blue}08`,
                        border: `1px solid ${DS.blue}20`,
                        color: DS.blue,
                      }}
                    >
                      VI: {baseVal}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Show more / fewer */}
            {hiddenFields.length > 0 && (
              <button
                onClick={() => setShowAllFields(v => !v)}
                className="flex items-center gap-1.5 w-full justify-center py-2 rounded-lg text-xs"
                style={{
                  background: `${DS.purple}08`,
                  border: `1px solid ${DS.purple}20`,
                  color: DS.purple,
                  cursor: 'pointer',
                }}
              >
                {showAllFields ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {showAllFields ? 'Show fewer fields' : `Show ${hiddenFields.length} more field${hiddenFields.length > 1 ? 's' : ''}`}
              </button>
            )}

            {/* Summary bar */}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
              style={{
                background: `${DS.purple}10`,
                border: `1px solid ${DS.purple}25`,
                color: DS.purple,
                fontFamily: DS.mono,
              }}
            >
              <Globe size={11} />
              <span>
                {activeLocale.nativeLabel}:{' '}
                {Object.values(localeValues).filter(v => v !== '' && v != null && (typeof v !== 'string' || v.length > 0)).length} / {fields.length} fields translated
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
