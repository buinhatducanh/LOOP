"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Play, ChevronLeft, ChevronRight, X, Volume2, VolumeX, Mouse } from "lucide-react";

interface HomeSliderData {
  id: string;
  image: string;
  title: string | null;
  subtitle: string | null;
  link: string | null;
  sortOrder: number;
}

interface HomeVideoData {
  id: string;
  videoUrl: string;
  thumbnail: string | null;
  title: string | null;
  description: string | null;
}

interface HomeSliderSectionProps {
  sliders: HomeSliderData[];
  video: HomeVideoData | null;
}

export function HomeSliderSection({ sliders, video }: HomeSliderSectionProps) {
  const [current, setCurrent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Hide scroll hint after first interaction
  useEffect(() => {
    const hide = () => setShowHint(false);
    window.addEventListener("scroll", hide, { once: true });
    return () => window.removeEventListener("scroll", hide);
  }, []);

  // Auto-advance slides
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (sliders.length <= 1) return;
    timerRef.current = setInterval(() => {
      goTo((current + 1) % sliders.length);
    }, 6000);
  }, [current, sliders.length]);

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [resetTimer]);

  const goTo = (index: number) => {
    if (isTransitioning || index === current) return;
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), 800);
    setCurrent(index);
  };

  const prev = () => goTo((current - 1 + sliders.length) % sliders.length);
  const next = () => goTo((current + 1) % sliders.length);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Touch/swipe support
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 50) { diff < 0 ? next() : prev(); }
    touchStartX.current = null;
  };

  const isYouTube = video?.videoUrl?.includes("youtube.com") || video?.videoUrl?.includes("youtu.be");
  const isVimeo = video?.videoUrl?.includes("vimeo.com");

  const getYouTubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=${isMuted ? 1 : 0}` : url;
  };

  if (sliders.length === 0) {
    return (
      <section className="relative min-h-[70vh] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center overflow-hidden">
        {/* Ambient background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        </div>
        <div className="text-center z-10 px-4">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 flex items-center justify-center">
            <Mouse size={32} className="text-indigo-400" />
          </div>
          <p className="text-xl font-semibold text-white/80">Chưa có slider nào</p>
          <p className="text-sm text-white/40 mt-2">Thêm slider từ trang Admin</p>
        </div>
      </section>
    );
  }

  const slide = sliders[current];

  return (
    <section
      className="relative min-h-screen pt-[72px] bg-slate-950 overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── SLIDE IMAGES ── */}
      <div className="absolute inset-0">
        {sliders.map((s, i) => (
          <div
            key={s.id}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{ opacity: i === current ? 1 : 0 }}
          >
            <div
              className={`absolute inset-0 bg-cover bg-center ${i === current ? "ken-burns-active" : ""}`}
              style={{ backgroundImage: `url(${s.image})` }}
            />
            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950/60" />
          </div>
        ))}

        {/* Ambient glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      </div>

      {/* ── CONTENT — bottom of the slider ── */}
      <div className="absolute inset-x-0 bottom-0 z-10">
        {/* Gradient fade top */}
        <div className="h-48 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pointer-events-none" />

        {/* Content area */}
        <div className="relative px-6 md:px-16 lg:px-24 pb-6">
          <div
            style={{
              opacity: isTransitioning ? 0 : 1,
              transform: isTransitioning ? "translateY(12px)" : "translateY(0)",
              transition: "opacity 0.5s ease, transform 0.5s ease",
            }}
          >
            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-[1.1] tracking-tight mb-2">
              <span className="text-white">{slide.title}</span>
            </h1>

            {/* Subtitle */}
            {slide.subtitle && (
              <p className="text-sm sm:text-base lg:text-lg text-white/40 mb-5 leading-relaxed max-w-xl">
                {slide.subtitle}
              </p>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {slide.link && (
                <Link
                  href={slide.link}
                  className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-900 font-semibold text-sm hover:bg-slate-100 transition-all duration-200 shadow-lg shadow-white/10 hover:shadow-white/20 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Khám phá ngay
                  <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              )}
              {video && !isPlaying && (
                <button
                  onClick={() => setIsPlaying(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white font-medium text-sm hover:bg-white/20 transition-all backdrop-blur-sm"
                >
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <Play size={11} fill="currentColor" />
                  </div>
                  Xem video giới thiệu
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── PROGRESS BARS ── */}
      <div className="absolute bottom-0 left-0 right-0 z-20 flex">
        {sliders.map((s, i) => (
          <button
            key={s.id}
            onClick={() => goTo(i)}
            className="relative h-0.5 flex-1 overflow-hidden group"
            aria-label={`Go to slide ${i + 1}`}
          >
            {/* Background */}
            <div className="absolute inset-0 bg-white/10" />
            {/* Active fill */}
            <div
              className="absolute inset-y-0 left-0 bg-white/80 transition-all duration-100"
              style={{
                width: i === current ? "100%" : i < current ? "100%" : "0%",
                transitionDuration: i === current ? `${6000}ms` : "0ms",
              }}
            />
            {/* Hover preview */}
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>

      {/* ── NAV ARROWS ── */}
      {sliders.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200 hover:scale-110 active:scale-95"
            aria-label="Previous slide"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200 hover:scale-110 active:scale-95"
            aria-label="Next slide"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* ── VIDEO MODAL ── */}
      {isPlaying && video && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setIsPlaying(false)}
        >
          <div
            className="relative w-full max-w-4xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setIsPlaying(false)}
              className="absolute -top-10 right-0 flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-colors z-10"
            >
              <X size={16} />
              Đóng
            </button>

            <div className="aspect-video bg-black">
              {isYouTube ? (
                <iframe
                  src={getYouTubeEmbedUrl(video.videoUrl)}
                  className="w-full h-full"
                  allow="autoplay; encrypted-media; fullscreen"
                  allowFullScreen
                />
              ) : isVimeo ? (
                <iframe
                  src={video.videoUrl.replace("vimeo.com", "player.vimeo.com/video")}
                  className="w-full h-full"
                  allow="autoplay; fullscreen"
                  allowFullScreen
                />
              ) : (
                <video
                  src={video.videoUrl}
                  autoPlay
                  muted={isMuted}
                  controls
                  className="w-full h-full"
                />
              )}
            </div>

            {/* Video info */}
            <div className="bg-slate-900 p-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  {video.title && <p className="font-semibold text-white">{video.title}</p>}
                  {video.description && <p className="text-sm text-slate-400 mt-1">{video.description}</p>}
                </div>
                {(isYouTube || isVimeo) && (
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 rounded-lg bg-white/10 text-white/70 hover:text-white transition-colors"
                    aria-label={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SCROLL HINT ── */}
      {showHint && sliders.length > 0 && (
        <div className="absolute left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 animate-fade-in"
          style={{ bottom: "calc(0.5rem + 4px)" }}>
          <span className="text-[10px] text-white/30 uppercase tracking-widest font-medium">
            Cuộn xuống
          </span>
          <div className="w-5 h-7 rounded-full border border-white/20 flex justify-center pt-0.5">
            <div className="w-0.5 h-1.5 bg-white/30 rounded-full animate-bounce" />
          </div>
        </div>
      )}

      {/* ── STYLES ── */}
      <style>{`
        @keyframes kenBurns {
          0%   { transform: scale(1) translate(0, 0); }
          50%  { transform: scale(1.06) translate(-0.5%, -0.3%); }
          100% { transform: scale(1.04) translate(0.3%, 0.2%); }
        }
        .ken-burns-active.ken-burns {
          animation: kenBurns 12s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}
