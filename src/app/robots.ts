import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/login", "/register"],
      },
    ],
    sitemap: "https://loop.vn/sitemap.xml",
  };
}
