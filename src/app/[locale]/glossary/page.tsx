/**
 * /glossary — Knowledge base / glossary of web development terms.
 * Static page with ISR revalidation every 24h.
 * Supports vi/en bilingual content.
 */

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { BookOpen, Search, ArrowRight } from "lucide-react";
import JsonLd from "@/components/seo/JsonLd";

export const revalidate = 86400; // ISR — revalidate daily

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  const title = t.has("glossaryTitle")
    ? t("glossaryTitle")
    : locale === "vi"
      ? "Từ điển Thuật ngữ Web | LOOP"
      : "Web Development Glossary | LOOP";
  const description = t.has("glossaryDescription")
    ? t("glossaryDescription")
    : locale === "vi"
      ? "Hơn 30 thuật ngữ web development được giải thích ngắn gọn, dễ hiểu."
      : "30+ web development terms explained in plain language.";
  return {
    title,
    description,
    alternates: { canonical: `https://loop.vn/${locale}/glossary` },
  };
}

/* ─── Glossary Data ─────────────────────────────────────────────────────────── */

type Term = {
  term: string;
  termVi: string;
  definition: string;
  definitionVi: string;
  category: string;
  categoryVi: string;
  related?: string[];
  example?: string;
  exampleVi?: string;
};

const GLOSSARY_TERMS: Term[] = [
  // ── SEO & Marketing ──────────────────────────────────────────────────────
  {
    term: "SEO",
    termVi: "SEO",
    definition:
      "Search Engine Optimization — the practice of improving a website's visibility and ranking on search engines like Google, Bing, and others.",
    definitionVi:
      "Search Engine Optimization (Tối ưu hóa công cụ tìm kiếm) — việc cải thiện thứ hạng và khả năng hiển thị của website trên các công cụ tìm kiếm như Google, Bing.",
    category: "Marketing",
    categoryVi: "Marketing",
    related: [" SERP", "Backlink", "Sitemap", "Meta Tag", "CTR"],
  },
  {
    term: "SERP",
    termVi: "SERP",
    definition:
      "Search Engine Results Page — the page displayed by a search engine in response to a user's query. Higher SERP ranking = more visibility.",
    definitionVi:
      "Search Engine Results Page (Trang kết quả tìm kiếm) — trang hiển thị kết quả khi người dùng tìm kiếm. Thứ hạng SERP càng cao, khả năng hiển thị càng lớn.",
    category: "Marketing",
    categoryVi: "Marketing",
    related: ["SEO", "CTR", "Meta Tag"],
  },
  {
    term: "Meta Tag",
    termVi: "Thẻ Meta",
    definition:
      "An HTML element that provides structured metadata about a web page — including title, description, keywords, and Open Graph data for social sharing.",
    definitionVi:
      "Một phần tử HTML cung cấp dữ liệu meta về trang web — bao gồm tiêu đề, mô tả, từ khóa và dữ liệu Open Graph cho việc chia sẻ mạng xã hội.",
    category: "Marketing",
    categoryVi: "Marketing",
    related: ["SEO", "Open Graph", "Sitemap"],
    example: '<meta name="description" content="Your page description here">',
    exampleVi: '<meta name="description" content="Mô tả trang của bạn ở đây">',
  },
  {
    term: "Backlink",
    termVi: "Backlink",
    definition:
      "A link from another website pointing to your website. Backlinks are a key Google ranking factor — quality matters more than quantity.",
    definitionVi:
      "Liên kết từ website khác trỏ về website của bạn. Backlink là yếu tố xếp hạng Google quan trọng — chất lượng quan trọng hơn số lượng.",
    category: "Marketing",
    categoryVi: "Marketing",
    related: ["SEO", "Domain Authority", "SERP"],
  },
  {
    term: "CTR",
    termVi: "CTR",
    definition:
      "Click-Through Rate — the percentage of users who click on a link after seeing it. Calculated as (clicks ÷ impressions) × 100.",
    definitionVi:
      "Click-Through Rate (Tỷ lệ nhấp chuột) — phần trăm người dùng nhấp vào liên kết sau khi thấy nó. Công thức: (số nhấp ÷ số lần hiển thị) × 100.",
    category: "Marketing",
    categoryVi: "Marketing",
    related: ["SEO", "SERP"],
  },
  // ── Technology ────────────────────────────────────────────────────────────
  {
    term: "Next.js",
    termVi: "Next.js",
    definition:
      "A React framework by Vercel for building full-stack web applications. Supports Server-Side Rendering (SSR), Static Site Generation (SSG), and Incremental Static Regeneration (ISR).",
    definitionVi:
      "Một framework React của Vercel để xây dựng ứng dụng web full-stack. Hỗ trợ Server-Side Rendering (SSR), Static Site Generation (SSG), và Incremental Static Regeneration (ISR).",
    category: "Technology",
    categoryVi: "Công nghệ",
    related: ["React", "SSR", "SSG", "ISR", "TypeScript"],
    example: "export default function Page() { return <h1>Hello</h1>; }",
    exampleVi: "export default function Page() { return <h1>Xin chào</h1>; }",
  },
  {
    term: "React",
    termVi: "React",
    definition:
      "A JavaScript library for building user interfaces, maintained by Meta (Facebook). Uses a component-based architecture and a Virtual DOM for efficient updates.",
    definitionVi:
      "Thư viện JavaScript để xây dựng giao diện người dùng, được phát triển bởi Meta (Facebook). Sử dụng kiến trúc dựa trên component và Virtual DOM để cập nhật hiệu quả.",
    category: "Technology",
    categoryVi: "Công nghệ",
    related: ["Next.js", "TypeScript", "JSX", "Component"],
  },
  {
    term: "TypeScript",
    termVi: "TypeScript",
    definition:
      "A strongly-typed superset of JavaScript that compiles to plain JS. Adds optional static types, interfaces, and generics for better code quality and IDE support.",
    definitionVi:
      "Một superset có kiểu mạnh của JavaScript, biên dịch thành JS thuần. Thêm kiểu tĩnh tùy chọn, interfaces, và generics để cải thiện chất lượng code và hỗ trợ IDE.",
    category: "Technology",
    categoryVi: "Công nghệ",
    related: ["JavaScript", "Next.js", "React"],
    example: "const add = (a: number, b: number): number => a + b;",
  },
  {
    term: "Server-Side Rendering (SSR)",
    termVi: "Server-Side Rendering (SSR)",
    definition:
      "A rendering technique where the server generates the complete HTML for a page on each request, enabling dynamic content and better SEO compared to client-side rendering.",
    definitionVi:
      "Kỹ thuật render mà server tạo HTML hoàn chỉnh cho trang trên mỗi yêu cầu, cho phép nội dung động và SEO tốt hơn so với client-side rendering.",
    category: "Technology",
    categoryVi: "Công nghệ",
    related: ["SSG", "ISR", "Next.js"],
  },
  {
    term: "Static Site Generation (SSG)",
    termVi: "Static Site Generation (SSG)",
    definition:
      "A rendering technique where HTML pages are pre-built at compile time. Results in extremely fast load times and excellent SEO, ideal for content that doesn't change frequently.",
    definitionVi:
      "Kỹ thuật render mà các trang HTML được tạo sẵn tại thời điểm biên dịch. Kết quả là thời gian tải cực nhanh và SEO tuyệt vời, lý tưởng cho nội dung ít thay đổi.",
    category: "Technology",
    categoryVi: "Công nghệ",
    related: ["ISR", "SSR", "CDN"],
  },
  {
    term: "ISR",
    termVi: "ISR",
    definition:
      "Incremental Static Regeneration — a Next.js feature that allows pages to be statically generated at build time but revalidated (regenerated) on a time-based or on-demand basis.",
    definitionVi:
      "Incremental Static Regeneration — tính năng của Next.js cho phép trang được tạo tĩnh tại build time nhưng được tái tạo theo thời gian hoặc theo yêu cầu.",
    category: "Technology",
    categoryVi: "Công nghệ",
    related: ["SSG", "SSR", "Next.js", "CDN"],
  },
  {
    term: "API",
    termVi: "API",
    definition:
      "Application Programming Interface — a set of rules that allows two software applications to communicate with each other. REST and GraphQL are common API architectures.",
    definitionVi:
      "Application Programming Interface (Giao diện lập trình ứng dụng) — tập hợp quy tắc cho phép hai ứng dụng phần mềm giao tiếp với nhau. REST và GraphQL là các kiến trúc API phổ biến.",
    category: "Technology",
    categoryVi: "Công nghệ",
    related: ["REST API", "GraphQL", "Endpoint"],
    example: "GET /api/users — fetch all users",
    exampleVi: "GET /api/users — lấy tất cả người dùng",
  },
  {
    term: "REST API",
    termVi: "REST API",
    definition:
      "Representational State Transfer — an architectural style for web APIs using standard HTTP methods (GET, POST, PUT, DELETE) to perform CRUD operations on resources.",
    definitionVi:
      "Representational State Transfer — kiến trúc API web sử dụng các phương thức HTTP chuẩn (GET, POST, PUT, DELETE) để thực hiện các thao tác CRUD trên tài nguyên.",
    category: "Technology",
    categoryVi: "Công nghệ",
    related: ["API", "GraphQL", "Endpoint"],
  },
  {
    term: "GraphQL",
    termVi: "GraphQL",
    definition:
      "A query language and runtime for APIs that allows clients to request exactly the data they need — nothing more, nothing less. Developed by Meta.",
    definitionVi:
      "Ngôn ngữ truy vấn và runtime cho API cho phép clients yêu cầu chính xác dữ liệu cần thiết. Được phát triển bởi Meta.",
    category: "Technology",
    categoryVi: "Công nghệ",
    related: ["API", "REST API"],
  },
  {
    term: "Database",
    termVi: "Cơ sở dữ liệu",
    definition:
      "An organized collection of structured data stored electronically. Common types include relational (PostgreSQL, MySQL) and NoSQL (MongoDB) databases.",
    definitionVi:
      "Tập hợp dữ liệu có tổ chức được lưu trữ điện tử. Các loại phổ biến bao gồm relational (PostgreSQL, MySQL) và NoSQL (MongoDB).",
    category: "Technology",
    categoryVi: "Công nghệ",
    related: ["PostgreSQL", "SQL", "NoSQL"],
  },
  {
    term: "PostgreSQL",
    termVi: "PostgreSQL",
    definition:
      "A powerful, open-source relational database system known for reliability, data integrity, and advanced features like JSON support and full-text search.",
    definitionVi:
      "Hệ thống cơ sở dữ liệu quan hệ mã nguồn mở, nổi tiếng về độ tin cậy, tính toàn vẹn dữ liệu và các tính năng nâng cao như hỗ trợ JSON và tìm kiếm toàn văn.",
    category: "Technology",
    categoryVi: "Công nghệ",
    related: ["Database", "SQL", "Neon"],
  },
  // ── Infrastructure ──────────────────────────────────────────────────────
  {
    term: "Hosting",
    termVi: "Hosting",
    definition:
      "A service that stores your website's files and makes them accessible on the internet. Options range from shared hosting (cheap, shared resources) to dedicated servers (expensive, full control).",
    definitionVi:
      "Dịch vụ lưu trữ các tệp website của bạn và cung cấp quyền truy cập trên internet. Các lựa chọn từ shared hosting (giá rẻ, tài nguyên chia sẻ) đến dedicated server (đắt tiền, kiểm soát hoàn toàn).",
    category: "Infrastructure",
    categoryVi: "Hạ tầng",
    related: ["Domain", "SSL", "CDN", "VPS"],
  },
  {
    term: "Domain",
    termVi: "Tên miền",
    definition:
      "The human-readable address of your website (e.g., loop.vn). It maps to an IP address via DNS, making websites easy to find and remember.",
    definitionVi:
      "Địa chỉ có thể đọc được của website (ví dụ: loop.vn). Nó ánh xạ tới địa chỉ IP thông qua DNS, giúp website dễ tìm và nhớ.",
    category: "Infrastructure",
    categoryVi: "Hạ tầng",
    related: ["DNS", "Hosting", "SSL"],
  },
  {
    term: "SSL / TLS",
    termVi: "SSL / TLS",
    definition:
      "Secure Sockets Layer / Transport Layer Security — encryption protocols that secure data transmitted between a user's browser and a website server, indicated by HTTPS in the URL.",
    definitionVi:
      "Secure Sockets Layer / Transport Layer Security — giao thức mã hóa bảo mật dữ liệu truyền giữa trình duyệt người dùng và server website, được chỉ ra bởi HTTPS trong URL.",
    category: "Infrastructure",
    categoryVi: "Hạ tầng",
    related: ["HTTPS", "Domain", "Hosting"],
    example: "https://loop.vn — the 's' in https means SSL is active",
    exampleVi: "https://loop.vn — chữ 's' trong https có nghĩa SSL đang hoạt động",
  },
  {
    term: "CDN",
    termVi: "CDN",
    definition:
      "Content Delivery Network — a geographically distributed network of servers that caches and delivers web content from the nearest server to the user, reducing latency.",
    definitionVi:
      "Content Delivery Network — mạng lưới server phân bố địa lý giúp cache và cung cấp nội dung web từ server gần nhất tới người dùng, giảm độ trễ.",
    category: "Infrastructure",
    categoryVi: "Hạ tầng",
    related: ["Hosting", "SSG", "Cache"],
  },
  {
    term: "DNS",
    termVi: "DNS",
    definition:
      "Domain Name System — the internet's phone book that translates human-readable domain names (loop.vn) into IP addresses (192.0.2.1) that computers use to communicate.",
    definitionVi:
      "Domain Name System — hệ thống ánh xạ tên miền (loop.vn) thành địa chỉ IP (192.0.2.1) mà máy tính sử dụng để giao tiếp.",
    category: "Infrastructure",
    categoryVi: "Hạ tầng",
    related: ["Domain", "Hosting"],
  },
  {
    term: "VPS",
    termVi: "VPS",
    definition:
      "Virtual Private Server — a virtual machine that provides dedicated resources within a larger physical server. Offers more control and performance than shared hosting at moderate cost.",
    definitionVi:
      "Virtual Private Server — máy ảo cung cấp tài nguyên riêng trong một server vật lý lớn hơn. Cung cấp nhiều kiểm soát và hiệu suất hơn shared hosting với chi phí vừa phải.",
    category: "Infrastructure",
    categoryVi: "Hạ tầng",
    related: ["Hosting", "Cloud"],
  },
  {
    term: "Cache",
    termVi: "Cache",
    definition:
      "A temporary storage layer that keeps frequently accessed data in memory for faster retrieval. Browsers, CDNs, and servers all use caching to improve performance.",
    definitionVi:
      "Lớp lưu trữ tạm thời giữ dữ liệu thường xuyên truy cập trong bộ nhớ để truy xuất nhanh hơn. Trình duyệt, CDN và server đều sử dụng caching để cải thiện hiệu suất.",
    category: "Infrastructure",
    categoryVi: "Hạ tầng",
    related: ["CDN", "ISR", "SSG"],
  },
  // ── Design & UX ──────────────────────────────────────────────────────────
  {
    term: "UI",
    termVi: "UI",
    definition:
      "User Interface — the visual design of a digital product: buttons, forms, typography, colors, and layout. Focuses on how things look.",
    definitionVi:
      "User Interface (Giao diện người dùng) — thiết kế hình ảnh của sản phẩm số: nút bấm, biểu mẫu, typography, màu sắc và bố cục. Tập trung vào cách mọi thứ trông như thế nào.",
    category: "Design",
    categoryVi: "Thiết kế",
    related: ["UX", "Responsive", "Wireframe"],
  },
  {
    term: "UX",
    termVi: "UX",
    definition:
      "User Experience — the overall experience of a person using a product, including usability, accessibility, and satisfaction. Focuses on how things work.",
    definitionVi:
      "User Experience (Trải nghiệm người dùng) — trải nghiệm tổng thể của người dùng khi sử dụng sản phẩm, bao gồm khả năng sử dụng, khả năng tiếp cận và sự hài lòng. Tập trung vào cách mọi thứ hoạt động.",
    category: "Design",
    categoryVi: "Thiết kế",
    related: ["UI", "Wireframe", "Prototype"],
  },
  {
    term: "Responsive Design",
    termVi: "Thiết kế Responsive",
    definition:
      "An approach where websites automatically adapt their layout and content to fit any screen size — desktop, tablet, or mobile — using CSS media queries and flexible grids.",
    definitionVi:
      "Phương pháp thiết kế website tự động điều chỉnh bố cục và nội dung để phù hợp với mọi kích thước màn hình — desktop, tablet, hoặc mobile — sử dụng CSS media queries và lưới linh hoạt.",
    category: "Design",
    categoryVi: "Thiết kế",
    related: ["UI", "Mobile-First", "CSS"],
  },
  {
    term: "Wireframe",
    termVi: "Wireframe",
    definition:
      "A simple visual guide showing the skeletal structure of a web page — layout, content blocks, and navigation — without colors, images, or styling details.",
    definitionVi:
      "Hướng dẫn trực quan đơn giản thể hiện cấu trúc xương của trang web — bố cục, khối nội dung và điều hướng — không có màu sắc, hình ảnh hoặc chi tiết styling.",
    category: "Design",
    categoryVi: "Thiết kế",
    related: ["UI", "UX", "Prototype"],
  },
  // ── Performance ─────────────────────────────────────────────────────────
  {
    term: "LCP",
    termVi: "LCP",
    definition:
      "Largest Contentful Paint — a Core Web Vital metric measuring how long it takes for the largest visible element (image, video, or block-level text) to load.",
    definitionVi:
      "Largest Contentful Paint — chỉ số Core Web Vital đo thời gian tải phần tử lớn nhất hiển thị (hình ảnh, video, hoặc khối văn bản) trên trang.",
    category: "Performance",
    categoryVi: "Hiệu suất",
    related: ["CLS", "FID", "Core Web Vitals"],
  },
  {
    term: "CLS",
    termVi: "CLS",
    definition:
      "Cumulative Layout Shift — a Core Web Vital metric measuring visual stability. A good CLS score (< 0.1) means page elements don't unexpectedly shift during loading.",
    definitionVi:
      "Cumulative Layout Shift — chỉ số Core Web Vital đo lường sự ổn định hình ảnh. CLS tốt (< 0.1) có nghĩa là các phần tử trang không bị dịch chuyển bất ngờ khi tải.",
    category: "Performance",
    categoryVi: "Hiệu suất",
    related: ["LCP", "Core Web Vitals", "Next.js"],
  },
  {
    term: "Core Web Vitals",
    termVi: "Core Web Vitals",
    definition:
      "A set of specific factors Google uses to assess user experience: LCP (loading), CLS (visual stability), and INP/FID (interactivity). Essential for SEO ranking.",
    definitionVi:
      "Tập hợp các yếu tố cụ thể Google dùng để đánh giá trải nghiệm người dùng: LCP (tải), CLS (ổn định hình ảnh), và INP/FID (tương tác). Thiết yếu cho xếp hạng SEO.",
    category: "Performance",
    categoryVi: "Hiệu suất",
    related: ["LCP", "CLS", "SEO"],
  },
  {
    term: "Lighthouse",
    termVi: "Lighthouse",
    definition:
      "An open-source tool by Google integrated into Chrome DevTools that audits web pages for performance, accessibility, SEO, PWA compliance, and best practices.",
    definitionVi:
      "Công cụ mã nguồn mở của Google tích hợp trong Chrome DevTools, kiểm tra trang web về hiệu suất, khả năng tiếp cận, SEO, tuân thủ PWA và best practices.",
    category: "Performance",
    categoryVi: "Hiệu suất",
    related: ["Core Web Vitals", "SEO", "Performance"],
  },
  {
    term: "Lazy Loading",
    termVi: "Lazy Loading",
    definition:
      "A performance technique that delays loading non-critical resources (images, components, or data) until they're actually needed — reducing initial page load time.",
    definitionVi:
      "Kỹ thuật hiệu suất trì hoãn việc tải các tài nguyên không quan trọng (hình ảnh, component, hoặc dữ liệu) cho đến khi thực sự cần thiết — giảm thời gian tải trang ban đầu.",
    category: "Performance",
    categoryVi: "Hiệu suất",
    related: ["LCP", "Cache", "Next.js"],
    example: 'import dynamic from "next/dynamic"; const Modal = dynamic(() => import("./Modal"));',
  },
  // ── Security ─────────────────────────────────────────────────────────────
  {
    term: "HTTPS",
    termVi: "HTTPS",
    definition:
      "Hypertext Transfer Protocol Secure — the secure version of HTTP that encrypts all data between the browser and server using SSL/TLS certificates.",
    definitionVi:
      "Hypertext Transfer Protocol Secure — phiên bản bảo mật của HTTP mã hóa tất cả dữ liệu giữa trình duyệt và server sử dụng chứng chỉ SSL/TLS.",
    category: "Security",
    categoryVi: "Bảo mật",
    related: ["SSL", "Domain", "SEO"],
    example: "https://loop.vn — the padlock icon means HTTPS is active",
  },
  {
    term: "CORS",
    termVi: "CORS",
    definition:
      "Cross-Origin Resource Sharing — a browser security mechanism that controls whether web pages can request resources from a different origin (domain, protocol, or port).",
    definitionVi:
      "Cross-Origin Resource Sharing — cơ chế bảo mật trình duyệt kiểm soát liệu trang web có thể yêu cầu tài nguyên từ origin khác (domain, protocol, hoặc port) hay không.",
    category: "Security",
    categoryVi: "Bảo mật",
    related: ["API", "Caching"],
  },
  {
    term: "SQL Injection",
    termVi: "SQL Injection",
    definition:
      "A code injection attack where malicious SQL statements are inserted into input fields to manipulate or access the database. Prevented by parameterized queries or ORMs.",
    definitionVi:
      "Tấn công chèn mã khi câu lệnh SQL độc hại được chèn vào các trường input để thao túng hoặc truy cập cơ sở dữ liệu. Được ngăn chặn bằng parameterized queries hoặc ORMs.",
    category: "Security",
    categoryVi: "Bảo mật",
    related: ["Database", "API"],
  },
  // ── Ecommerce ─────────────────────────────────────────────────────────────
  {
    term: "E-Commerce",
    termVi: "Thương mại điện tử",
    definition:
      "The buying and selling of goods or services over the internet. Includes B2C (business-to-consumer), B2B (business-to-business), C2C, and D2C models.",
    definitionVi:
      "Việc mua bán hàng hóa hoặc dịch vụ qua internet. Bao gồm các mô hình B2C (doanh nghiệp với người tiêu dùng), B2B (doanh nghiệp với doanh nghiệp), C2C và D2C.",
    category: "Business",
    categoryVi: "Kinh doanh",
    related: ["CMS", "Payment Gateway", "CRM"],
  },
  {
    term: "CMS",
    termVi: "CMS",
    definition:
      "Content Management System — software that allows non-technical users to create, manage, and modify website content without coding. Examples: WordPress, Sanity, Strapi.",
    definitionVi:
      "Hệ thống quản lý nội dung — phần mềm cho phép người dùng không kỹ thuật tạo, quản lý và chỉnh sửa nội dung website mà không cần lập trình. Ví dụ: WordPress, Sanity, Strapi.",
    category: "Technology",
    categoryVi: "Công nghệ",
    related: ["Headless CMS", "Sanity", "Content Strategy"],
  },
  {
    term: "Headless CMS",
    termVi: "Headless CMS",
    definition:
      "A content management system that provides content via API without dictating how it should be presented. Content is decoupled from the frontend, enabling omnichannel delivery.",
    definitionVi:
      "Hệ thống quản lý nội dung cung cấp nội dung qua API mà không quy định cách hiển thị. Nội dung tách rời khỏi frontend, cho phép phân phối đa kênh.",
    category: "Technology",
    categoryVi: "Công nghệ",
    related: ["CMS", "Sanity", "API"],
  },
  {
    term: "Sanity",
    termVi: "Sanity",
    definition:
      "A real-time, headless CMS with a fully customizable content studio. Uses structured content (Portable Text), real-time collaboration, and powerful GROQ query language.",
    definitionVi:
      "CMS headless thời gian thực với studio nội dung có thể tùy chỉnh hoàn toàn. Sử dụng nội dung có cấu trúc (Portable Text), cộng tác thời gian thực và ngôn ngữ truy vấn GROQ mạnh mẽ.",
    category: "Technology",
    categoryVi: "Công nghệ",
    related: ["Headless CMS", "CMS", "GROQ"],
  },
  {
    term: "Payment Gateway",
    termVi: "Cổng thanh toán",
    definition:
      "A technology that collects and transfers payment data from the customer to the acquirer and back. Examples: Stripe, PayPal, VNPay, MoMo.",
    definitionVi:
      "Công nghệ thu thập và chuyển dữ liệu thanh toán từ khách hàng đến acquirer và ngược lại. Ví dụ: Stripe, PayPal, VNPay, MoMo.",
    category: "Business",
    categoryVi: "Kinh doanh",
    related: ["E-Commerce", "SSL"],
  },
  {
    term: "CRM",
    termVi: "CRM",
    definition:
      "Customer Relationship Management — software that manages a company's interactions with current and potential customers, tracking leads, deals, and communication history.",
    definitionVi:
      "Quản lý quan hệ khách hàng — phần mềm quản lý tương tác của công ty với khách hàng hiện tại và tiềm năng, theo dõi leads, deals và lịch sử giao tiếp.",
    category: "Business",
    categoryVi: "Kinh doanh",
    related: ["E-Commerce", "CMS"],
  },
  // ── Development ───────────────────────────────────────────────────────────
  {
    term: "Component",
    termVi: "Component",
    definition:
      "A reusable, self-contained piece of UI in frameworks like React. Components can be simple (a button) or complex (an entire form), and accept props to customize their behavior.",
    definitionVi:
      "Một phần UI có thể tái sử dụng, khép kín trong các framework như React. Components có thể đơn giản (một nút) hoặc phức tạp (toàn bộ form), và nhận props để tùy chỉnh hành vi.",
    category: "Technology",
    categoryVi: "Công nghệ",
    related: ["React", "Next.js", "TypeScript"],
  },
  {
    term: "Docker",
    termVi: "Docker",
    definition:
      "An open platform for developing, shipping, and running applications inside lightweight, portable containers — ensuring consistency across development and production environments.",
    definitionVi:
      "Nền tảng mã nguồn mở để phát triển, đóng gói và chạy ứng dụng trong các container nhẹ, di động — đảm bảo tính nhất quán giữa môi trường phát triển và production.",
    category: "Technology",
    categoryVi: "Công nghệ",
    related: ["CI/CD", "DevOps", "Hosting"],
  },
  {
    term: "CI/CD",
    termVi: "CI/CD",
    definition:
      "Continuous Integration / Continuous Deployment — a DevOps practice where code changes are automatically tested (CI) and deployed (CD) to production via a pipeline.",
    definitionVi:
      "Tích hợp liên tục / Triển khai liên tục — thực hành DevOps mà các thay đổi code được tự động kiểm tra (CI) và triển khai (CD) lên production qua một pipeline.",
    category: "Technology",
    categoryVi: "Công nghệ",
    related: ["Docker", "GitHub Actions", "DevOps"],
  },
  {
    term: "Git",
    termVi: "Git",
    definition:
      "A distributed version control system for tracking code changes and coordinating work among developers. GitHub, GitLab, and Bitbucket are platforms that host Git repositories.",
    definitionVi:
      "Hệ thống kiểm soát phiên bản phân tán để theo dõi các thay đổi code và điều phối công việc giữa các developer. GitHub, GitLab và Bitbucket là các nền tảng lưu trữ Git repositories.",
    category: "Technology",
    categoryVi: "Công nghệ",
    related: ["GitHub Actions", "CI/CD"],
  },
  {
    term: "GitHub Actions",
    termVi: "GitHub Actions",
    definition:
      "A CI/CD platform built into GitHub that automates workflows: running tests, building applications, and deploying code whenever code is pushed to a repository.",
    definitionVi:
      "Nền tảng CI/CD tích hợp sẵn trong GitHub tự động hóa các workflow: chạy tests, build ứng dụng và deploy code bất cứ khi nào code được push lên repository.",
    category: "Technology",
    categoryVi: "Công nghệ",
    related: ["CI/CD", "Git", "DevOps"],
  },
  {
    term: "DevOps",
    termVi: "DevOps",
    definition:
      "A culture and practice that bridges software development (Dev) and IT operations (Ops) — emphasizing automation, continuous delivery, and rapid iteration.",
    definitionVi:
      "Văn hóa và thực hành kết nối phát triển phần mềm (Dev) và vận hành IT (Ops) — nhấn mạnh tự động hóa, phân phối liên tục và lặp nhanh.",
    category: "Technology",
    categoryVi: "Công nghệ",
    related: ["CI/CD", "Docker", "GitHub Actions"],
  },
];

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function groupByCategory(terms: Term[], locale: string) {
  const groups: Record<string, Term[]> = {};
  for (const term of terms) {
    const key = locale === "vi" ? term.categoryVi : term.category;
    if (!groups[key]) groups[key] = [];
    groups[key].push(term);
  }
  // Sort categories alphabetically
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
}

/* ─── Page ─────────────────────────────────────────────────────────────────── */

export default async function GlossaryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isVi = locale === "vi";

  const grouped = groupByCategory(GLOSSARY_TERMS, locale);

  const categoryColors: Record<string, string> = {
    Marketing: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    Technology: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    Infrastructure: "bg-green-500/10 text-green-400 border-green-500/20",
    Design: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    Performance: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    Security: "bg-red-500/10 text-red-400 border-red-500/20",
    Business: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* JSON-LD for glossary */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "TechArticle",
          name: isVi ? "Từ điển Thuật ngữ Web" : "Web Development Glossary",
          description: isVi
            ? "Hơn 30 thuật ngữ web development được giải thích dễ hiểu."
            : "30+ web development terms explained in plain language.",
          about: GLOSSARY_TERMS.slice(0, 10).map((t) => ({
            "@type": "DefinedTerm",
            name: isVi ? t.termVi : t.term,
            description: isVi ? t.definitionVi : t.definition,
          })),
        }}
      />

      <div className="mx-auto max-w-4xl px-4 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-2 text-sm text-blue-400">
            <BookOpen size={16} />
            {isVi ? "Kiến thức Web" : "Web Knowledge"}
          </div>
          <h1 className="mb-4 text-4xl font-bold">
            {isVi ? "Từ điển Thuật ngữ" : "Web Glossary"}
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            {isVi
              ? `${GLOSSARY_TERMS.length} thuật ngữ web development được giải thích ngắn gọn, dễ hiểu. Từ SEO đến Docker — tất cả trong một trang.`
              : `${GLOSSARY_TERMS.length} web development terms explained simply. From SEO to Docker — all in one page.`}
          </p>
        </div>

        {/* Category navigation */}
        <nav className="mb-10 flex flex-wrap gap-2" aria-label="Glossary categories">
          {grouped.map(([category]) => (
            <a
              key={category}
              href={`#cat-${category.toLowerCase().replace(/\s+/g, "-")}`}
              className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-400 transition-colors hover:border-blue-500 hover:text-blue-400"
            >
              {category}
            </a>
          ))}
        </nav>

        {/* Terms */}
        <div className="space-y-12">
          {grouped.map(([category, terms]) => {
            const colorClass = categoryColors[category] ?? "bg-slate-500/10 text-slate-400 border-slate-500/20";
            return (
              <section
                key={category}
                id={`cat-${category.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {/* Category header */}
                <div className="mb-6 flex items-center gap-3">
                  <span className={`rounded-full border px-3 py-1 text-sm font-medium ${colorClass}`}>
                    {category}
                  </span>
                  <div className="flex-1 border-t border-slate-800" />
                  <span className="text-sm text-slate-600">{terms.length} terms</span>
                </div>

                {/* Term cards */}
                <div className="grid gap-4 md:grid-cols-1">
                  {terms.map((term) => (
                    <article
                      key={isVi ? term.term : term.termVi}
                      className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 transition-colors hover:border-slate-700"
                    >
                      <div className="mb-2 flex items-start justify-between gap-4">
                        <h2 className="text-xl font-semibold text-white">
                          <span className="text-blue-400">{isVi ? term.termVi : term.term}</span>
                          {isVi && term.term !== term.termVi && (
                            <span className="ml-2 text-sm font-normal text-slate-500">
                              ({term.term})
                            </span>
                          )}
                        </h2>
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${colorClass}`}>
                          {isVi ? term.categoryVi : term.category}
                        </span>
                      </div>
                      <p className="mb-3 leading-relaxed text-slate-400">
                        {isVi ? term.definitionVi : term.definition}
                      </p>
                      {term.example && (
                        <div className="mt-3">
                          <p className="mb-1 text-xs font-medium text-slate-600 uppercase tracking-wide">
                            {isVi ? "Ví dụ" : "Example"}
                          </p>
                          <code className="block overflow-x-auto rounded-lg bg-slate-950 px-3 py-2 text-sm text-green-400">
                            {isVi && term.exampleVi ? term.exampleVi : term.example}
                          </code>
                        </div>
                      )}
                      {term.related && term.related.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="text-xs text-slate-600">
                            {isVi ? "Liên quan:" : "Related:"}
                          </span>
                          {term.related.map((r) => (
                            <span
                              key={r}
                              className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-400"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-900/50 p-8 text-center">
          <Search size={32} className="mx-auto mb-4 text-blue-400" />
          <h2 className="mb-2 text-xl font-bold">
            {isVi ? "Cần tư vấn dự án?" : "Need a project consultation?"}
          </h2>
          <p className="mb-6 text-slate-400">
            {isVi
              ? "Đội ngũ LOOP sẵn sàng hỗ trợ bạn từ concept đến launch."
              : "The LOOP team is ready to help you from concept to launch."}
          </p>
          <Link
            href={`/${locale}/contact`}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-500"
          >
            {isVi ? "Liên hệ ngay" : "Contact Us"}
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
