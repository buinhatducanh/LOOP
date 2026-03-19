"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Play, ChevronLeft, ChevronRight, X, Volume2, VolumeX } from "lucide-react";

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
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Auto-advance slides
  useEffect(() => {
    if (sliders.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliders.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [sliders.length]);

  const goToSlide = (index: number) => setCurrentSlide(index);
  const goToPrev = () => setCurrentSlide((currentSlide - 1 + sliders.length) % sliders.length);
  const goToNext = () => setCurrentSlide((currentSlide + 1) % sliders.length);

  // Check if video is YouTube/Vimeo
  const isYouTube = video?.videoUrl?.includes("youtube.com") || video?.videoUrl?.includes("youtu.be");
  const isVimeo = video?.videoUrl?.includes("vimeo.com");

  // Get YouTube embed URL
  const getYouTubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1`;
    }
    return url;
  };

  // Nếu không có sliders, hiển thị placeholder
  if (sliders.length === 0) {
    return (
      <section className="relative min-h-[60vh] bg-slate-900 flex items-center justify-center">
        <div className="text-center text-slate-500">
          <p className="text-lg">Chưa có ảnh slider</p>
          <p className="text-sm mt-2">Vui lòng thêm ảnh từ admin</p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-screen bg-slate-950 overflow-hidden">
      {/* SLIDER */}
      <div className="relative h-screen">
        {/* Banner Images */}
        {sliders.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title || `Slide ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}

        {/* Navigation Arrows */}
        {sliders.length > 1 && (
          <>
            <button
              onClick={goToPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {/* Slide Indicators */}
        {sliders.length > 1 && (
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {sliders.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentSlide ? "bg-white w-8" : "bg-white/40"
                }`}
              />
            ))}
          </div>
        )}

        {/* Slide Content */}
        {sliders[currentSlide] && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="text-center max-w-4xl px-4">
              {sliders[currentSlide].title && (
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 animate-fade-in">
                  {sliders[currentSlide].title}
                </h1>
              )}
              {sliders[currentSlide].subtitle && (
                <p className="text-lg md:text-xl text-slate-300 mb-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
                  {sliders[currentSlide].subtitle}
                </p>
              )}
              {sliders[currentSlide].link && (
                <Link
                  href={sliders[currentSlide].link}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors animate-fade-in"
                  style={{ animationDelay: "0.2s" }}
                >
                  Xem thêm <ArrowRight size={20} />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* VIDEO MARKETING CARD */}
      {video && (
        <div className="absolute bottom-8 left-4 right-4 z-30 md:left-auto md:right-8 md:w-[400px]">
          <div className="bg-slate-900/95 backdrop-blur-sm rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
            {/* Video or Thumbnail */}
            <div className="relative aspect-video bg-slate-800">
              {isPlaying ? (
                isYouTube ? (
                  <iframe
                    src={getYouTubeEmbedUrl(video.videoUrl)}
                    className="w-full h-full"
                    allow="autoplay; encrypted-media"
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
                    className="w-full h-full object-cover"
                    autoPlay
                    muted={isMuted}
                    controls
                  />
                )
              ) : (
                <>
                  <img
                    src={video.thumbnail || "/images/video-placeholder.jpg"}
                    alt={video.title || "Video"}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => setIsPlaying(true)}
                    className="absolute inset-0 flex items-center justify-center bg-slate-900/50 hover:bg-slate-900/40 transition-colors group"
                  >
                    <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play size={28} className="text-white ml-1" fill="white" />
                    </div>
                  </button>
                </>
              )}

              {/* Close button when playing */}
              {isPlaying && (
                <button
                  onClick={() => setIsPlaying(false)}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-slate-900/80 flex items-center justify-center text-white hover:bg-slate-700 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Video Info */}
            <div className="p-4">
              {video.title && (
                <h3 className="font-semibold text-white mb-1">{video.title}</h3>
              )}
              {video.description && (
                <p className="text-sm text-slate-400 line-clamp-2">{video.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
