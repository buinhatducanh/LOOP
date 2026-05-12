/**
 * Resolves ID references in landing page section content into full data objects.
 * Called server-side for optimal SEO (no client-side waterfall).
 */
import { prisma } from "@/lib/prisma";

interface LandingSection {
  id: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  content: Record<string, unknown>;
  styles: Record<string, unknown>;
  sortOrder: number;
  isActive: boolean;
}

export async function resolveSectionContent(section: LandingSection): Promise<LandingSection> {
  const content = section.content || {};

  if (section.type === "services" && Array.isArray(content.serviceIds)) {
    const services = await prisma.service.findMany({
      where: { id: { in: content.serviceIds }, isActive: true },
      select: {
        id: true, slug: true, title: true, shortDescription: true,
        icon: true, category: true, startingPrice: true, deliveryTime: true,
      },
    });
    // Preserve order from serviceIds
    const ordered = content.serviceIds
      .map((id: string) => services.find((s: typeof services[number]) => s.id === id))
      .filter(Boolean);
    return { ...section, content: { ...content, services: ordered } };
  }

  if (section.type === "portfolio" && Array.isArray(content.projectIds)) {
    const projects = await prisma.project.findMany({
      where: { id: { in: content.projectIds }, isPublished: true },
      select: {
        id: true, slug: true, title: true, client: true,
        category: true, image: true,
      },
    });
    const ordered = content.projectIds
      .map((id: string) => projects.find((p: typeof projects[number]) => p.id === id))
      .filter(Boolean);
    return { ...section, content: { ...content, projects: ordered } };
  }

  if (section.type === "testimonials" && Array.isArray(content.testimonialIds)) {
    const testimonials = await prisma.testimonial.findMany({
      where: { id: { in: content.testimonialIds }, isActive: true },
      select: {
        id: true, name: true, role: true, company: true,
        avatar: true, rating: true, text: true,
      },
    });
    const ordered = content.testimonialIds
      .map((id: string) => testimonials.find((t: typeof testimonials[number]) => t.id === id))
      .filter(Boolean);
    return { ...section, content: { ...content, testimonials: ordered } };
  }

  return section;
}

export async function resolveAllSections(sections: LandingSection[]) {
  return Promise.all(sections.map(resolveSectionContent));
}
