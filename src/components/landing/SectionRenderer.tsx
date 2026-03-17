"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Zap, Globe, Shield, Award, Star, Mail, Phone, MapPin } from "lucide-react";

interface SectionProps {
  content: any;
  styles?: any;
}

// Hero Section
export function HeroSection({ content }: SectionProps) {
  return (
    <section className="relative overflow-hidden bg-[#030712]">
      {content.backgroundImage && (
        <div className="absolute inset-0 z-0">
          <Image
            src={content.backgroundImage}
            alt="Background"
            fill
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#030712]/80 to-[#030712]" />
        </div>
      )}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-5xl md:text-7xl font-extrabold text-white mb-6"
        >
          {content.title || "Chào mừng"}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto"
        >
          {content.subtitle || "Chúng tôi tạo ra những trải nghiệm số tuyệt vời"}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          {content.ctaPrimaryLink && (
            <Link
              href={content.ctaPrimaryLink}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
            >
              {content.ctaPrimaryText || "Liên hệ"} <ArrowRight className="w-5 h-5" />
            </Link>
          )}
          {content.ctaSecondaryLink && (
            <Link
              href={content.ctaSecondaryLink}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 border border-white/20 text-white rounded-xl font-bold hover:bg-white/20 transition-all"
            >
              {content.ctaSecondaryText || "Xem thêm"}
            </Link>
          )}
        </motion.div>
      </div>
    </section>
  );
}

// Stats Section
export function StatsSection({ content }: SectionProps) {
  const stats = content.stats || [];

  return (
    <section className="bg-[#030712] border-y border-white/5">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat: any, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                {stat.value}
              </div>
              <div className="text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Features Section
export function FeaturesSection({ content }: SectionProps) {
  const features = content.features || [
    { icon: "Zap", title: "Nhanh chóng", desc: "Giao sản phẩm đúng hẹn" },
    { icon: "Globe", title: "Toàn cầu", desc: "Phục vụ khách hàng 30+ quốc gia" },
    { icon: "Shield", title: "Chất lượng", desc: "95+ điểm Lighthouse" },
    { icon: "Award", title: "Giải thưởng", desc: "Thiết kế đoạt giải" },
  ];

  const icons: Record<string, any> = { Zap, Globe, Shield, Award };

  return (
    <section className="bg-[#030712] py-24">
      <div className="max-w-7xl mx-auto px-6">
        {content.title && (
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">{content.title}</h2>
            {content.subtitle && <p className="text-gray-400">{content.subtitle}</p>}
          </div>
        )}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature: any, index: number) => {
            const IconComponent = icons[feature.icon] || Zap;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-indigo-500/30 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-4">
                  <IconComponent className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// CTA Section
export function CtaSection({ content }: SectionProps) {
  return (
    <section className="relative py-24 bg-[#030712] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-purple-600/5 to-cyan-600/10" />
      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          {content.title || "Sẵn sàng bắt đầu?"}
        </h2>
        <p className="text-xl text-gray-400 mb-10">
          {content.description || "Liên hệ ngay để nhận tư vấn miễn phí"}
        </p>
        {content.buttonLink && (
          <Link
            href={content.buttonLink}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
          >
            {content.buttonText || "Liên hệ ngay"} <ArrowRight className="w-5 h-5" />
          </Link>
        )}
      </div>
    </section>
  );
}

// Contact Section
export function ContactSection({ content }: SectionProps) {
  return (
    <section className="bg-[#030712] py-24 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">{content.title || "Liên hệ"}</h2>
          {content.subtitle && <p className="text-gray-400">{content.subtitle}</p>}
        </div>
        <div className="max-w-xl mx-auto">
          <div className="p-8 bg-white/5 border border-white/10 rounded-2xl">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">Email</div>
                  <div className="text-white">hello@loop.vn</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">Điện thoại</div>
                  <div className="text-white">+84 888 123 456</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">Địa chỉ</div>
                  <div className="text-white">TP. Hồ Chí Minh, Việt Nam</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Custom HTML Section
export function CustomSection({ content }: SectionProps) {
  return (
    <section
      className="bg-[#030712] py-12"
      dangerouslySetInnerHTML={{ __html: content.htmlContent || "" }}
    />
  );
}

// Main Section Renderer
export function SectionRenderer({ type, content, styles }: { type: string; content: any; styles?: any }) {
  switch (type) {
    case "hero":
      return <HeroSection content={content} styles={styles} />;
    case "stats":
      return <StatsSection content={content} styles={styles} />;
    case "features":
      return <FeaturesSection content={content} styles={styles} />;
    case "cta":
      return <CtaSection content={content} styles={styles} />;
    case "contact":
      return <ContactSection content={content} styles={styles} />;
    case "custom":
      return <CustomSection content={content} styles={styles} />;
    // For services, portfolio, testimonials - use existing components
    default:
      return (
        <div className="py-24 bg-[#030712]">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-gray-400">Section: {type}</p>
          </div>
        </div>
      );
  }
}
