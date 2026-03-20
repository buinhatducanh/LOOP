import { describe, it, expect } from "vitest";
import {
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
  buildServiceJsonLd,
  buildPortfolioJsonLd,
  buildTeamMemberJsonLd,
  buildBlogPostJsonLd,
  buildFaqJsonLd,
  buildBreadcrumbJsonLd,
  buildProductJsonLd,
} from "@/lib/json-ld";

describe("json-ld", () => {
  describe("buildOrganizationJsonLd", () => {
    it("returns valid JSON-LD with required fields", () => {
      const org = buildOrganizationJsonLd();

      expect(org["@context"]).toBe("https://schema.org");
      expect(org["@type"]).toBe("Organization");
      expect(org.name).toBe("LOOP");
      expect(org.url).toBe("https://loop.vn");
      expect(org.logo).toBe("https://loop.vn/logo.png");
      expect(org.foundingDate).toBe("2016");
    });

    it("includes social links", () => {
      const org = buildOrganizationJsonLd();

      expect(org.sameAs).toContain("https://facebook.com/loop.vn");
      expect(org.sameAs).toContain("https://www.linkedin.com/company/loop-vn");
    });
  });

  describe("buildWebSiteJsonLd", () => {
    it("includes search action", () => {
      const ws = buildWebSiteJsonLd();

      expect(ws["@type"]).toBe("WebSite");
      expect(ws.name).toBe("LOOP");
      expect(ws.potentialAction["@type"]).toBe("SearchAction");
      expect(ws.potentialAction["query-input"]).toBe("required name=search_term_string");
    });
  });

  describe("buildServiceJsonLd", () => {
    it("builds service schema with optional price", () => {
      const svc = buildServiceJsonLd({
        name: "Thiết kế Website",
        description: "Professional web design service",
        price: "5000000",
        areaServed: "Vietnam",
      });

      expect(svc["@type"]).toBe("Service");
      expect(svc.name).toBe("Thiết kế Website");
      expect(svc.offers?.price).toBe("5000000");
      expect(svc.offers?.priceCurrency).toBe("VND");
      expect(svc.areaServed).toBe("Vietnam");
      expect(svc.provider["@type"]).toBe("Organization");
    });

    it("omits offers when price is not provided", () => {
      const svc = buildServiceJsonLd({
        name: "Consulting",
        description: "Expert consultation",
      });

      expect(svc.offers).toBeUndefined();
    });
  });

  describe("buildPortfolioJsonLd", () => {
    it("builds creative work schema", () => {
      const portfolio = buildPortfolioJsonLd({
        name: "E-Commerce Platform",
        description: "Full-featured e-commerce solution",
        dateCreated: "2024-01-15",
        genre: "E-Commerce",
      });

      expect(portfolio["@type"]).toBe("CreativeWork");
      expect(portfolio.name).toBe("E-Commerce Platform");
      expect(portfolio.dateCreated).toBe("2024-01-15");
      expect(portfolio.genre).toBe("E-Commerce");
      expect(portfolio.author["@type"]).toBe("Organization");
    });
  });

  describe("buildTeamMemberJsonLd", () => {
    it("builds person schema with social links", () => {
      const member = buildTeamMemberJsonLd({
        name: "Nguyễn Văn A",
        role: "Frontend Developer",
        shortBio: "React expert with 5 years experience",
        slug: "nguyen-van-a",
        socialLinks: ["https://linkedin.com/in/nguyen-van-a"],
      });

      expect(member["@type"]).toBe("Person");
      expect(member.name).toBe("Nguyễn Văn A");
      expect(member.jobTitle).toBe("Frontend Developer");
      expect(member.description).toBe("React expert with 5 years experience");
      expect(member.url).toBe("https://loop.vn/team/nguyen-van-a");
      expect(member.worksFor["@type"]).toBe("Organization");
    });
  });

  describe("buildBlogPostJsonLd", () => {
    it("builds article schema with author", () => {
      const post = buildBlogPostJsonLd({
        title: "Top 10 Web Design Trends 2026",
        description: "A comprehensive guide to web design trends",
        authorName: "Jane Doe",
        publishedAt: "2026-01-15T10:00:00Z",
        slug: "top-10-web-design-trends-2026",
      });

      expect(post["@type"]).toBe("Article");
      expect(post.headline).toBe("Top 10 Web Design Trends 2026");
      expect(post.author["@type"]).toBe("Person");
      expect(post.author.name).toBe("Jane Doe");
      expect(post.publisher["@type"]).toBe("Organization");
      expect(post.mainEntityOfPage["@id"]).toBe("https://loop.vn/blog/top-10-web-design-trends-2026");
    });

    it("handles missing publishedAt", () => {
      const post = buildBlogPostJsonLd({
        title: "Test Post",
        authorName: "Author",
        slug: "test-post",
      });

      expect(post.datePublished).toBeUndefined();
    });
  });

  describe("buildFaqJsonLd", () => {
    it("builds FAQ schema with multiple questions", () => {
      const faq = buildFaqJsonLd([
        { question: "What is your refund policy?", answer: "We offer full refunds within 30 days." },
        { question: "How long does delivery take?", answer: "Typically 2-4 weeks depending on scope." },
      ]);

      expect(faq["@type"]).toBe("FAQPage");
      expect(faq.mainEntity).toHaveLength(2);
      expect(faq.mainEntity[0]["@type"]).toBe("Question");
      expect(faq.mainEntity[0].name).toBe("What is your refund policy?");
      expect(faq.mainEntity[0].acceptedAnswer["@type"]).toBe("Answer");
      expect(faq.mainEntity[0].acceptedAnswer.text).toBe("We offer full refunds within 30 days.");
    });
  });

  describe("buildBreadcrumbJsonLd", () => {
    it("builds breadcrumb list with correct positions", () => {
      const crumbs = buildBreadcrumbJsonLd([
        { name: "Home", url: "/" },
        { name: "Services", url: "/services" },
        { name: "Web Design", url: "/services/web-design" },
      ]);

      expect(crumbs["@type"]).toBe("BreadcrumbList");
      expect(crumbs.itemListElement).toHaveLength(3);
      expect(crumbs.itemListElement[0].position).toBe(1);
      expect(crumbs.itemListElement[0].name).toBe("Home");
      expect(crumbs.itemListElement[0].item).toBe("https://loop.vn/");
    });

    it("handles root-only breadcrumb", () => {
      const crumbs = buildBreadcrumbJsonLd([{ name: "Home" }]);

      expect(crumbs.itemListElement).toHaveLength(1);
      expect(crumbs.itemListElement[0].item).toBeUndefined();
    });
  });

  describe("buildProductJsonLd", () => {
    it("builds product schema with offer", () => {
      const product = buildProductJsonLd({
        name: "Basic Plan",
        description: "Entry-level pricing plan",
        price: "2990000",
        priceCurrency: "VND",
      });

      expect(product["@type"]).toBe("Product");
      expect(product.name).toBe("Basic Plan");
      expect(product.offers.price).toBe("2990000");
      expect(product.offers.priceCurrency).toBe("VND");
      expect(product.offers.availability).toBe("https://schema.org/InStock");
    });
  });
});
