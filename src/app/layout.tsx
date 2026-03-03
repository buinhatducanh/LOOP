import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://loop.vn"),
  title: {
    default: "LOOP - Thiết kế Website & Ứng dụng chuyên nghiệp",
    template: "%s | LOOP",
  },
  description:
    "LOOP - Công ty thiết kế website thương mại, ứng dụng di động, phần mềm quản lý doanh nghiệp. Tối ưu SEO, hiệu suất cao, hỗ trợ 24/7.",
  keywords: [
    "thiết kế website",
    "làm website",
    "website thương mại điện tử",
    "ứng dụng di động",
    "phần mềm quản lý",
    "web development",
    "LOOP",
  ],
  openGraph: {
    type: "website",
    locale: "vi_VN",
    alternateLocale: "en_US",
    siteName: "LOOP",
    title: "LOOP - Thiết kế Website & Ứng dụng chuyên nghiệp",
    description:
      "Công ty LOOP chuyên thiết kế website thương mại, app di động, phần mềm quản lý. Cam kết SEO top Google, hiệu suất 95+.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "LOOP - Web Development Agency",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LOOP - Thiết kế Website & Ứng dụng chuyên nghiệp",
    description:
      "Công ty LOOP chuyên thiết kế website thương mại, app di động, phần mềm quản lý doanh nghiệp.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://loop.vn",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "LOOP",
              url: "https://loop.vn",
              logo: "https://loop.vn/logo.png",
              description:
                "Công ty thiết kế website và ứng dụng chuyên nghiệp",
              foundingDate: "2016",
              numberOfEmployees: { "@type": "QuantitativeValue", value: 50 },
              sameAs: [
                "https://facebook.com/loop.vn",
                "https://linkedin.com/company/loop-vn",
              ],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "LOOP",
              url: "https://loop.vn",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://loop.vn/search?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
