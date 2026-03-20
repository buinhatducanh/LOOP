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
  buildHowToJsonLd,
  buildVideoJsonLd,
  buildReviewJsonLd,
  buildAggregateRatingJsonLd,
  buildQaPageJsonLd,
  buildEventJsonLd,
  buildLocalBusinessJsonLd,
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

  describe("buildHowToJsonLd", () => {
    it("builds HowTo schema with steps", () => {
      const howto = buildHowToJsonLd({
        title: "How to Build a Website",
        description: "A step-by-step guide",
        totalTime: "PT2H",
        steps: [
          { name: "Step 1", description: "Plan your website" },
          { name: "Step 2", description: "Design mockups" },
        ],
      });

      expect(howto["@type"]).toBe("HowTo");
      expect(howto.name).toBe("How to Build a Website");
      expect(howto.totalTime).toBe("PT2H");
      expect(howto.step).toHaveLength(2);
      expect(howto.step[0]["@type"]).toBe("HowToStep");
      expect(howto.step[0].name).toBe("Step 1");
    });

    it("omits optional fields gracefully", () => {
      const howto = buildHowToJsonLd({ title: "Quick guide", steps: [] });
      expect(howto.description).toBeUndefined();
      expect(howto.totalTime).toBeUndefined();
    });
  });

  describe("buildVideoJsonLd", () => {
    it("builds VideoObject schema", () => {
      const video = buildVideoJsonLd({
        title: "Demo: Website Builder",
        description: "Live demo of our website builder",
        thumbnailUrl: "https://example.com/thumb.jpg",
        uploadDate: "2026-03-01",
        duration: "PT5M",
        embedUrl: "/videos/demo",
        authorName: "LOOP Team",
      });

      expect(video["@type"]).toBe("VideoObject");
      expect(video.name).toBe("Demo: Website Builder");
      expect(video.duration).toBe("PT5M");
      expect(video.author?.name).toBe("LOOP Team");
    });

    it("handles missing optional fields", () => {
      const video = buildVideoJsonLd({ title: "Short video" });
      expect(video.thumbnailUrl).toBeUndefined();
      expect(video.author).toBeUndefined();
    });
  });

  describe("buildReviewJsonLd", () => {
    it("builds Review schema with rating", () => {
      const review = buildReviewJsonLd({
        reviewerName: "John Doe",
        rating: 5,
        bestRating: 5,
        reviewBody: "Excellent service!",
        itemName: "Website Design",
        itemType: "Service",
      });

      expect(review["@type"]).toBe("Review");
      expect(review.reviewRating.ratingValue).toBe("5");
      expect(review.reviewRating.bestRating).toBe("5");
      expect(review.reviewRating.worstRating).toBe("1");
      expect(review.itemReviewed?.name).toBe("Website Design");
    });
  });

  describe("buildAggregateRatingJsonLd", () => {
    it("builds AggregateRating schema", () => {
      const rating = buildAggregateRatingJsonLd({
        ratingValue: 4.8,
        reviewCount: 120,
        itemName: "LOOP Services",
      });

      expect(rating["@type"]).toBe("AggregateRating");
      expect(rating.ratingValue).toBe("4.8");
      expect(rating.reviewCount).toBe("120");
      expect(rating.itemReviewed?.name).toBe("LOOP Services");
    });
  });

  describe("buildQaPageJsonLd", () => {
    it("builds QAPage schema with accepted answer", () => {
      const qa = buildQaPageJsonLd({
        questionName: "How long does it take?",
        questionText: "What's the typical delivery time for a website?",
        authorName: "Customer",
        dateCreated: "2026-02-15",
        answerCount: 3,
        acceptedAnswer: {
          answerText: "Typically 2-4 weeks depending on scope.",
          authorName: "LOOP Team",
        },
      });

      expect(qa["@type"]).toBe("QAPage");
      expect(qa.mainEntity["@type"]).toBe("Question");
      expect(qa.mainEntity.name).toBe("How long does it take?");
      expect(qa.mainEntity.acceptedAnswer?.text).toBe("Typically 2-4 weeks depending on scope.");
    });

    it("handles missing accepted answer", () => {
      const qa = buildQaPageJsonLd({
        questionName: "Open question",
        questionText: "Still waiting for answer",
        authorName: "User",
      });

      expect(qa.mainEntity.acceptedAnswer).toBeUndefined();
      expect(qa.mainEntity.answerCount).toBeUndefined();
    });
  });

  describe("buildEventJsonLd", () => {
    it("builds Event schema for online event", () => {
      const event = buildEventJsonLd({
        name: "Web Design Workshop 2026",
        description: "Free workshop on modern web design",
        startDate: "2026-04-15T14:00:00+07:00",
        endDate: "2026-04-15T16:00:00+07:00",
        isOnline: true,
        organizerName: "LOOP",
        price: 0,
        registrationUrl: "/events/register",
      });

      expect(event["@type"]).toBe("Event");
      expect(event.name).toBe("Web Design Workshop 2026");
      expect(event.eventStatus).toBe("https://schema.org/EventScheduled");
      expect(event.eventAttendanceMode).toBe("https://schema.org/OnlineEventAttendanceMode");
      expect(event.organizer?.name).toBe("LOOP");
      expect(event.offers?.price).toBe("0");
    });

    it("builds offline event with location", () => {
      const event = buildEventJsonLd({
        name: "Meetup",
        startDate: "2026-05-01T10:00:00",
        isOnline: false,
        locationName: "LOOP Office",
        locationAddress: "Ho Chi Minh City, Vietnam",
      });

      expect(event.eventAttendanceMode).toBe("https://schema.org/OfflineEventAttendanceMode");
      expect(event.location?.name).toBe("LOOP Office");
    });
  });

  describe("buildLocalBusinessJsonLd", () => {
    it("builds LocalBusiness schema with full address", () => {
      const lb = buildLocalBusinessJsonLd({
        name: "LOOP HQ",
        description: "Web design agency",
        streetAddress: "123 Nguyễn Huệ",
        locality: "Ho Chi Minh City",
        region: "HCM",
        postalCode: "700000",
        country: "VN",
        latitude: 10.7769,
        longitude: 106.7009,
        phone: "+84 888 123 456",
        openingHours: [
          { day: "Monday", open: "09:00", close: "18:00" },
        ],
        priceRange: "$$",
        ratingValue: 4.9,
        reviewCount: 150,
      });

      expect(lb["@type"]).toBe("ProfessionalService");
      expect(lb.name).toBe("LOOP HQ");
      expect(lb.address?.streetAddress).toBe("123 Nguyễn Huệ");
      expect(lb.address?.addressLocality).toBe("Ho Chi Minh City");
      expect(lb.geo?.latitude).toBe(10.7769);
      expect(lb.geo?.longitude).toBe(106.7009);
      expect(lb.openingHoursSpecification).toHaveLength(1);
      expect(lb.aggregateRating?.ratingValue).toBe("4.9");
    });

    it("uses defaults when optional fields missing", () => {
      const lb = buildLocalBusinessJsonLd({});
      expect(lb.name).toBe("LOOP");
      expect(lb.url).toBe("https://loop.vn");
      expect(lb.address).toBeUndefined();
    });
  });
});
