import { prisma } from "@/lib/prisma";

export async function getSiteSettings(): Promise<Record<string, string>> {
  try {
    const settings = await prisma.siteSetting.findMany();
    const map: Record<string, string> = {};
    for (const s of settings) {
      map[s.key] = s.value;
    }
    return map;
  } catch {
    return {};
  }
}

export async function getServices() {
  return prisma.service.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getServiceBySlug(slug: string) {
  return prisma.service.findUnique({
    where: { slug },
    include: { projects: { where: { isPublished: true }, orderBy: { sortOrder: "asc" } } },
  });
}

export async function getProjects() {
  return prisma.project.findMany({
    where: { isPublished: true },
    include: { service: { select: { slug: true, title: true } } },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getProjectBySlug(slug: string) {
  return prisma.project.findUnique({
    where: { slug },
    include: { service: { select: { id: true, slug: true, title: true } } },
  });
}

export async function getPricingPlans() {
  return prisma.pricingPlan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getTestimonials() {
  return prisma.testimonial.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function createContactMessage(data: {
  name: string;
  email: string;
  phone?: string;
  service?: string;
  message: string;
}) {
  return prisma.contactMessage.create({ data });
}

export async function getContactMessages() {
  return prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function getUserByGoogleId(googleId: string) {
  return prisma.user.findUnique({ where: { googleId } });
}

export async function getTeamMembers() {
  return prisma.teamMember.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getTeamMemberBySlug(slug: string) {
  return prisma.teamMember.findUnique({ where: { slug } });
}

export async function getPricingPackagesData() {
  const [webPackages, featureCategories, hostingPlans, domainPrices, deploymentItems] =
    await Promise.all([
      prisma.pricingWebPackage.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.pricingFeatureCategory.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: {
          features: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
          },
        },
      }),
      prisma.pricingHostingPlan.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.pricingDomainPrice.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.pricingDeploymentItem.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
    ]);
  return { webPackages, featureCategories, hostingPlans, domainPrices, deploymentItems };
}
