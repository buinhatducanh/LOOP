import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/vi/login", "/vi/register", "/en/login", "/en/register"],
      },
    ],
    sitemap: "https://loop.vn/sitemap.xml",
  };
}
