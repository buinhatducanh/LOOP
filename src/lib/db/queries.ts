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
    include: {
      service: { select: { slug: true, title: true } },
      teamMember: { select: { id: true, name: true, slug: true, role: true, image: true } },
    },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getProjectBySlug(slug: string) {
  return prisma.project.findUnique({
    where: { slug },
    include: {
      service: { select: { id: true, slug: true, title: true } },
      teamMember: { select: { id: true, name: true, slug: true, role: true, image: true } },
    },
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
    orderBy: [{ roleLevel: "asc" }, { sortOrder: "asc" }],
    include: {
      memberExpertise: {
        include: {
          expertise: true,
        },
      },
    },
  });
}

export async function getTeamMemberBySlug(slug: string) {
  return prisma.teamMember.findUnique({
    where: { slug },
    include: {
      memberExpertise: {
        include: {
          expertise: true,
        },
      },
    },
  });
}

// ─── Dual Service Model ─────────────────────────────────────

export async function getWebTemplates() {
  return prisma.webTemplate.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      bundledAttributes: {
        include: {
          attribute: {
            select: {
              id: true,
              slug: true,
              name: true,
              nameVi: true,
              icon: true,
              category: true,
              categoryVi: true,
            },
          },
        },
      },
    },
  });
}

export async function getWebTemplateBySlug(slug: string) {
  return prisma.webTemplate.findUnique({
    where: { slug },
    include: {
      bundledAttributes: {
        include: { attribute: true },
      },
    },
  });
}

export async function getServiceAttributes() {
  return prisma.serviceAttribute.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  });
}

export async function getDualServicesData() {
  const [templates, attributes] = await Promise.all([
    getWebTemplates(),
    getServiceAttributesByTier(), // Include parent/children for disable logic
  ]);
  return { templates, attributes };
}

// ─── Platform Architecture ────────────────────────────────────

export async function getServiceAttributesByTier(tier?: "basic" | "advanced") {
  return prisma.serviceAttribute.findMany({
    where: {
      isActive: true,
      ...(tier ? { tier } : {}),
    },
    include: {
      parent: { select: { id: true, name: true, nameVi: true } },
      children: { select: { id: true, name: true, nameVi: true, tier: true } },
    },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  });
}

export async function getAddonServices() {
  return prisma.addonService.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getExpertises(activeOnly = false) {
  const where = activeOnly ? { isActive: true } : {};
  return prisma.expertise.findMany({
    where,
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  });
}

export async function getRewardTiers() {
  return prisma.rewardTier.findMany({
    where: { isActive: true },
    orderBy: { level: "asc" },
    include: {
      items: {
        include: {
          addonService: { select: { id: true, name: true, nameVi: true, type: true, price: true } },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
}

export async function getOrderWithDetails(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      selectedAttributes: {
        include: { attribute: true },
      },
      orderRewards: {
        include: { addonService: true },
      },
      payments: {
        orderBy: { createdAt: "desc" },
      },
      statusHistory: {
        orderBy: { createdAt: "desc" },
      },
      package: true,
      template: true,
    },
  });
}

export async function getOrderStatusHistory(orderId: string) {
  return prisma.orderStatusHistory.findMany({
    where: { orderId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPaymentsByOrder(orderId: string) {
  return prisma.payment.findMany({
    where: { orderId },
    orderBy: { createdAt: "desc" },
  });
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
