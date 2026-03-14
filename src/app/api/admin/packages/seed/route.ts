import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import {
  webPackages,
  featureCategories,
  hostingPlans,
  domainPrices,
  deploymentHandoff,
} from "@/data/pricingPackages";

export async function POST() {
  try {
    await requirePermission("packages", "create");

    // Clear existing data
    await prisma.$transaction([
      prisma.pricingComparisonFeature.deleteMany(),
      prisma.pricingFeatureCategory.deleteMany(),
      prisma.pricingWebPackage.deleteMany(),
      prisma.pricingHostingPlan.deleteMany(),
      prisma.pricingDomainPrice.deleteMany(),
      prisma.pricingDeploymentItem.deleteMany(),
    ]);

    // Seed web packages
    await prisma.pricingWebPackage.createMany({
      data: webPackages.map((pkg, i) => ({
        slug: pkg.id,
        name: pkg.name,
        nameVi: pkg.nameVi,
        tagline: pkg.tagline,
        taglineVi: pkg.taglineVi,
        price: pkg.price,
        currency: pkg.currency,
        period: pkg.period,
        periodVi: pkg.periodVi,
        highlighted: pkg.highlighted,
        cta: pkg.cta,
        ctaVi: pkg.ctaVi,
        color: pkg.color,
        pages: pkg.pages,
        pagesVi: pkg.pagesVi,
        sortOrder: i,
      })),
    });

    // Seed feature categories + features
    for (let i = 0; i < featureCategories.length; i++) {
      const cat = featureCategories[i];
      const category = await prisma.pricingFeatureCategory.create({
        data: {
          slug: cat.id,
          name: cat.name,
          nameVi: cat.nameVi,
          sortOrder: i,
        },
      });
      if (cat.features.length > 0) {
        await prisma.pricingComparisonFeature.createMany({
          data: cat.features.map((f, j) => ({
            categoryId: category.id,
            name: f.name,
            nameVi: f.nameVi,
            tooltip: f.tooltip || null,
            tooltipVi: f.tooltipVi || null,
            values: f.values,
            sortOrder: j,
          })),
        });
      }
    }

    // Seed hosting plans
    await prisma.pricingHostingPlan.createMany({
      data: hostingPlans.map((plan, i) => ({
        slug: plan.id,
        name: plan.name,
        nameVi: plan.nameVi,
        price: plan.price,
        period: plan.period,
        periodVi: plan.periodVi,
        features: plan.features,
        featuresVi: plan.featuresVi,
        highlighted: plan.highlighted,
        color: plan.color,
        sortOrder: i,
      })),
    });

    // Seed domain prices
    await prisma.pricingDomainPrice.createMany({
      data: domainPrices.map((d, i) => ({
        extension: d.extension,
        registrationPrice: d.registrationPrice,
        renewalPrice: d.renewalPrice,
        period: d.period,
        periodVi: d.periodVi,
        note: d.note || null,
        noteVi: d.noteVi || null,
        sortOrder: i,
      })),
    });

    // Seed deployment items
    await prisma.pricingDeploymentItem.createMany({
      data: deploymentHandoff.map((item, i) => ({
        slug: item.id,
        title: item.title,
        titleVi: item.titleVi,
        description: item.description,
        descriptionVi: item.descriptionVi,
        handedToClient: item.handedToClient,
        icon: item.icon,
        note: item.note || null,
        noteVi: item.noteVi || null,
        sortOrder: i,
      })),
    });

    return NextResponse.json({ message: "Seeded pricing packages data successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
