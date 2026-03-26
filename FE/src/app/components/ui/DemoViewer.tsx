import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Monitor, RefreshCw, X, Maximize2, Minimize2,
  ChevronLeft, ChevronRight, Lock, Shield, Loader,
  ExternalLink, Eye,
} from 'lucide-react';
import { DS, GRD } from '../layout/ds';

interface DemoViewerProps {
  /** Actual URL loaded in iframe – not shown to user */
  demoUrl: string;
  /** Fake URL displayed in the address bar */
  maskedUrl: string;
  /** Preview screenshot shown before entering fullscreen */
  previewImg: string;
  /** Human-readable name for the demo */
  title?: string;
  /** Accent colour for glows & borders */
  accentColor?: string;
  height?: number;
}

// Encode URL so it's not trivially visible in DOM attributes
function encodeUrl(url: string) {
  return btoa(unescape(encodeURIComponent(url)));
}
function decodeUrl(enc: string) {
  return decodeURIComponent(escape(atob(enc)));
}

export function DemoViewer({
  demoUrl,
  maskedUrl,
  previewImg,
  title = 'Demo Preview',
  accentColor = DS.blue,
  height = 480,
}: DemoViewerProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const encodedUrl = useRef(encodeUrl(demoUrl));
  const iframeSrc = decodeUrl(encodedUrl.current);

  const handleReload = useCallback(() => {
    setLoading(true);
    setReloadKey(k => k + 1);
  }, []);

  const preventContext = (e: React.MouseEvent) => e.preventDefault();

  // ── Browser Chrome ──────────────────────────────────────────────────────
  const BrowserChrome = ({ compact = false }: { compact?: boolean }) => (
    <div
      className="flex items-center gap-2 px-3"
      style={{
        height: compact ? 36 : 44,
        background: 'rgba(5,12,30,0.95)',
        borderBottom: `1px solid ${DS.border}`,
      }}
    >
      {/* Nav buttons */}
      <div className="flex items-center gap-1">
        {[ChevronLeft, ChevronRight, RefreshCw].map((Icon, i) => (
          <button
            key={i}
            onClick={i === 2 ? handleReload : undefined}
            style={{
              width: 26, height: 26, borderRadius: 6,
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${DS.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: i === 2 ? 'pointer' : 'default',
              opacity: i < 2 ? 0.4 : 1,
            }}
          >
            <Icon size={11} style={{ color: DS.text4 }} />
          </button>
        ))}
      </div>

      {/* Address bar */}
      <div
        className="flex items-center gap-2 flex-1 px-3 rounded-lg"
        style={{
          height: 28, background: 'rgba(15,23,42,0.8)',
          border: `1px solid rgba(255,255,255,0.07)`,
        }}
      >
        <Lock size={10} style={{ color: DS.green, flexShrink: 0 }} />
        <span
          style={{
            color: DS.text4, fontSize: 11,
            fontFamily: DS.mono, flex: 1,
            overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
            userSelect: 'none',
          }}
        >
          {maskedUrl}
        </span>
        {/* LOOP badge */}
        <span
          style={{
            background: `${accentColor}15`,
            border: `1px solid ${accentColor}30`,
            color: accentColor, fontSize: 8,
            fontFamily: DS.mono, letterSpacing: '0.1em',
            padding: '1px 5px', borderRadius: 3,
            flexShrink: 0,
          }}
        >
          LOOP
        </span>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1.5">
        {fullscreen && (
          <button
            onClick={() => setFullscreen(false)}
            style={{
              width: 26, height: 26, borderRadius: 6,
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${DS.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Minimize2 size={11} style={{ color: DS.text4 }} />
          </button>
        )}
        {fullscreen && (
          <button
            onClick={() => setFullscreen(false)}
            style={{
              width: 26, height: 26, borderRadius: 6,
              background: 'rgba(239,68,68,0.1)',
              border: `1px solid rgba(239,68,68,0.25)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={11} style={{ color: DS.red }} />
          </button>
        )}
      </div>
    </div>
  );

  // ── Iframe Viewport ─────────────────────────────────────────────────────
  const IframeViewport = ({ h }: { h: number }) => (
    <div className="relative" style={{ height: h, overflow: 'hidden' }} onContextMenu={preventContext}>
      {/* Loading overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3"
            style={{ background: 'rgba(2,6,23,0.95)' }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}30` }}
            >
              <Loader size={20} style={{ color: accentColor }} className="animate-spin" />
            </div>
            <div style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>Đang tải demo...</div>
            <div
              className="px-3 py-1 rounded-full"
              style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}
            >
              <span style={{ color: DS.green, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em' }}>
                🔒 KẾT NỐI BẢO MẬT
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actual iframe */}
      <iframe
        key={reloadKey}
        src={iframeSrc}
        style={{ width: '100%', height: '100%', border: 'none' }}
        onLoad={() => setLoading(false)}
        title={title}
        allow="fullscreen"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />

      {/* Protection watermark */}
      <div
        className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-lg pointer-events-none"
        style={{
          background: 'rgba(2,6,23,0.75)',
          border: `1px solid ${accentColor}25`,
          backdropFilter: 'blur(8px)',
        }}
      >
        <Shield size={9} style={{ color: accentColor }} />
        <span style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>LOOP Solutions · Protected Preview</span>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Preview Card (always shown) ──────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          border: `1px solid ${accentColor}30`,
          boxShadow: `0 0 40px ${accentColor}10`,
        }}
      >
        {/* Chrome bar */}
        <BrowserChrome />

        {/* Preview image + launch overlay */}
        <div className="relative" style={{ height, cursor: 'pointer' }} onClick={() => { setFullscreen(true); setLoading(true); }}>
          <img
            src={previewImg}
            alt={title}
            className="w-full h-full object-cover"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(2,6,23,0.1) 0%, rgba(2,6,23,0.55) 100%)' }} />

          {/* Launch button */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center gap-3"
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${accentColor}90, ${accentColor}50)`,
                  boxShadow: `0 0 30px ${accentColor}50`,
                  border: `1px solid ${accentColor}60`,
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Monitor size={28} style={{ color: '#fff' }} />
              </div>
              <div
                className="px-5 py-2 rounded-xl"
                style={{
                  background: 'rgba(2,6,23,0.8)',
                  border: `1px solid ${accentColor}40`,
                  backdropFilter: 'blur(12px)',
                }}
              >
                <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>Xem Demo Trực Tiếp</span>
              </div>
            </motion.div>

            {/* Info badges */}
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                style={{ background: 'rgba(2,6,23,0.75)', backdropFilter: 'blur(8px)' }}
              >
                <Eye size={10} style={{ color: DS.text4 }} />
                <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono }}>Preview only</span>
              </div>
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                style={{ background: 'rgba(2,6,23,0.75)', backdropFilter: 'blur(8px)' }}
              >
                <Shield size={10} style={{ color: DS.green }} />
                <span style={{ color: DS.green, fontSize: 10, fontFamily: DS.mono }}>URL bảo vệ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom info bar */}
        <div
          className="flex items-center justify-between px-4 py-2.5"
          style={{ background: 'rgba(5,12,30,0.9)', borderTop: `1px solid ${DS.border}` }}
        >
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: DS.green }} />
            <span style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{title}</span>
          </div>
          <button
            onClick={() => { setFullscreen(true); setLoading(true); }}
            className="flex items-center gap-1.5"
            style={{ color: accentColor, fontSize: 11, fontFamily: DS.mono, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <Maximize2 size={11} /> Toàn màn hình
          </button>
        </div>
      </div>

      {/* ── Fullscreen Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {fullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col"
            style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)' }}
          >
            {/* Top bar */}
            <div style={{ background: 'rgba(5,12,30,0.98)', borderBottom: `1px solid ${DS.border}` }}>
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-3 px-4 py-2">
                  {/* Window dots */}
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ background: '#EF4444' }} onClick={() => setFullscreen(false)} />
                    <div className="w-3 h-3 rounded-full" style={{ background: '#F59E0B' }} />
                    <div className="w-3 h-3 rounded-full" style={{ background: '#22C55E' }} />
                  </div>
                  {/* Browser chrome full */}
                  <div className="flex items-center gap-2 flex-1">
                    {[ChevronLeft, ChevronRight, RefreshCw].map((Icon, i) => (
                      <button
                        key={i}
                        onClick={i === 2 ? handleReload : undefined}
                        style={{
                          width: 26, height: 26, borderRadius: 6,
                          background: 'rgba(255,255,255,0.05)',
                          border: `1px solid ${DS.border}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: i === 2 ? 'pointer' : 'default',
                          opacity: i < 2 ? 0.35 : 1,
                        }}
                      >
                        <Icon size={11} style={{ color: DS.text4 }} />
                      </button>
                    ))}
                    {/* Address bar */}
                    <div
                      className="flex items-center gap-2 flex-1 px-3 rounded-lg"
                      style={{
                        height: 32, background: 'rgba(15,23,42,0.8)',
                        border: `1px solid rgba(255,255,255,0.08)`,
                      }}
                    >
                      <Lock size={11} style={{ color: DS.green }} />
                      <span
                        style={{
                          color: DS.text3, fontSize: 12,
                          fontFamily: DS.mono, flex: 1,
                          userSelect: 'none',
                        }}
                      >
                        {maskedUrl}
                      </span>
                      <span
                        style={{
                          background: `${accentColor}15`,
                          border: `1px solid ${accentColor}30`,
                          color: accentColor, fontSize: 9,
                          fontFamily: DS.mono, letterSpacing: '0.1em',
                          padding: '1px 6px', borderRadius: 3,
                        }}
                      >
                        LOOP PREVIEW
                      </span>
                    </div>
                    <button
                      onClick={() => setFullscreen(false)}
                      style={{
                        width: 30, height: 30, borderRadius: 8,
                        background: 'rgba(239,68,68,0.1)',
                        border: `1px solid rgba(239,68,68,0.3)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <X size={13} style={{ color: DS.red }} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Iframe content */}
            <div className="flex-1 relative" onContextMenu={preventContext}>
              {/* Loading */}
              <AnimatePresence>
                {loading && (
                  <motion.div
                    initial={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4"
                    style={{ background: 'rgba(2,6,23,0.97)' }}
                  >
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ background: GRD.primary, boxShadow: `0 0 30px ${accentColor}40` }}
                    >
                      <Loader size={28} style={{ color: '#fff' }} className="animate-spin" />
                    </div>
                    <div style={{ color: DS.text, fontSize: 15, fontWeight: 700 }}>Đang tải demo...</div>
                    <div style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>Kết nối bảo mật đến {maskedUrl}</div>
                    <div className="flex items-center gap-2">
                      <Shield size={12} style={{ color: DS.green }} />
                      <span style={{ color: DS.green, fontSize: 11, fontFamily: DS.mono }}>URL được mã hoá · Chỉ xem tại LOOP</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <iframe
                key={`full-${reloadKey}`}
                src={iframeSrc}
                style={{ width: '100%', height: '100%', border: 'none' }}
                onLoad={() => setLoading(false)}
                title={title}
                allow="fullscreen"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />

              {/* Watermark */}
              <div
                className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-2 rounded-xl pointer-events-none"
                style={{
                  background: 'rgba(2,6,23,0.8)',
                  border: `1px solid ${accentColor}20`,
                  backdropFilter: 'blur(12px)',
                }}
              >
                <Shield size={11} style={{ color: accentColor }} />
                <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono }}>
                  LOOP Solutions · Protected · {maskedUrl}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
