"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { DS, GLOW } from "@/lib/design-tokens";
import { useTranslations } from "next-intl";
import { BookOpen, ArrowRight, Feather } from "lucide-react";
import type { MediaStoryItem } from "./types";

export function StoriesTab({
  stories,
  locale,
}: {
  stories: MediaStoryItem[];
  locale: string;
}) {
  const t = useTranslations("MediaPage");

  if (stories.length === 0) {
    return (
      <section style={{ padding: "0 1.5rem 4rem" }}>
        <div
          style={{
            textAlign: "center",
            color: DS.text4,
            padding: "4rem 2rem",
            maxWidth: 400,
            margin: "0 auto",
            background: DS.bgCard,
            borderRadius: 16,
            border: `1px solid ${DS.border}`,
          }}
        >
          <BookOpen size={40} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
            {t("storyEmpty")}
          </p>
          <p style={{ fontSize: 13 }}>{t("storyEmptyDesc")}</p>
        </div>
      </section>
    );
  }

  return (
    <section style={{ padding: "0 1.5rem 4rem" }}>
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: 20,
        }}
      >
        {stories.map((story, i) => (
          <motion.div
            key={story.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.35 }}
          >
            <Link
              href={`/${locale}/media/stories/${story.slug}`}
              style={{ textDecoration: "none", display: "block" }}
            >
              <div
                style={{
                  borderRadius: 16,
                  overflow: "hidden",
                  background: DS.bgCard,
                  border: `1px solid ${DS.border}`,
                  transition: "border-color 0.2s, box-shadow 0.3s",
                  cursor: "pointer",
                }}
                className="story-card"
              >
                {/* Cover */}
                <div
                  style={{
                    position: "relative",
                    height: 200,
                    overflow: "hidden",
                  }}
                >
                  {story.coverImage ? (
                    <img
                      src={story.coverImage}
                      alt={story.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transition: "transform 0.5s",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "grid",
                        placeItems: "center",
                        background: `linear-gradient(160deg, ${DS.bgCard}, ${DS.bgCard3})`,
                        color: DS.text5,
                      }}
                    >
                      <Feather size={32} />
                    </div>
                  )}

                  {/* Gradient overlay at bottom */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 60,
                      background: `linear-gradient(transparent, ${DS.bgCard})`,
                    }}
                  />
                </div>

                {/* Content */}
                <div style={{ padding: "12px 16px 16px" }}>
                  {/* Title */}
                  <h3
                    style={{
                      color: DS.text,
                      fontSize: 16,
                      fontWeight: 700,
                      lineHeight: 1.4,
                      marginBottom: 8,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {story.title}
                  </h3>

                  {/* Excerpt */}
                  {story.excerpt && (
                    <p
                      style={{
                        color: DS.text4,
                        fontSize: 13,
                        lineHeight: 1.6,
                        marginBottom: 12,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {story.excerpt}
                    </p>
                  )}

                  {/* Author + date + read more */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {story.author.image ? (
                        <img
                          src={story.author.image}
                          alt={story.author.name}
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: `1px solid ${DS.border}`,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            background: DS.cosmicPurple,
                            display: "grid",
                            placeItems: "center",
                            color: "#fff",
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          {story.author.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p
                          style={{
                            color: DS.text3,
                            fontSize: 11,
                            fontWeight: 600,
                            lineHeight: 1.2,
                          }}
                        >
                          {story.author.name}
                        </p>
                        {story.publishedAt && (
                          <p style={{ color: DS.text5, fontSize: 10 }}>
                            {new Date(story.publishedAt).toLocaleDateString(locale)}
                          </p>
                        )}
                      </div>
                    </div>

                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        color: DS.pink,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {t("storyReadMore")} <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Hover effects */}
      <style>{`
        .story-card:hover {
          border-color: ${DS.pink} !important;
          box-shadow: ${GLOW.cardPinkGlow} !important;
        }
        .story-card:hover img {
          transform: scale(1.05);
        }
      `}</style>
    </section>
  );
}
