// Simple seed script - run via: npx dotenv -e .env.local -- npx tsx prisma/seed-data.ts
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Seeding ServiceAttributes with parent-child relationships...");

  // Clear existing data
  await prisma.serviceAttribute.deleteMany({});

  // Create parent attributes (groups) and children (basic/advanced variants)
  const ecommerce = await prisma.serviceAttribute.create({
    data: {
      slug: "shopping-cart",
      name: "Shopping Cart",
      nameVi: "Giỏ hàng",
      category: "Ecommerce",
      categoryVi: "Thương mại điện tử",
      price: 0,
      isRequired: false,
      tier: "basic",
      sortOrder: 1,
    },
  });

  await prisma.serviceAttribute.create({
    data: {
      slug: "basic-cart",
      name: "Basic Cart",
      nameVi: "Giỏ hàng cơ bản",
      description: "Chức năng giỏ hàng cơ bản - thêm/sửa/xóa sản phẩm",
      descriptionVi: "Chức năng giỏ hàng cơ bản - thêm/sửa/xóa sản phẩm",
      category: "Ecommerce",
      categoryVi: "Thương mại điện tử",
      price: 500000,
      isRequired: false,
      tier: "basic",
      parentId: ecommerce.id,
      sortOrder: 2,
    },
  });

  await prisma.serviceAttribute.create({
    data: {
      slug: "advanced-cart",
      name: "Advanced Cart",
      nameVi: "Giỏ hàng nâng cao",
      description: "Giỏ hàng nâng cao với so sánh sản phẩm, wishlist, notify giá giảm",
      descriptionVi: "Giỏ hàng nâng cao với so sánh sản phẩm, wishlist, notify giá giảm",
      category: "Ecommerce",
      categoryVi: "Thương mại điện tử",
      price: 2000000,
      isRequired: false,
      tier: "advanced",
      parentId: ecommerce.id,
      sortOrder: 3,
    },
  });

  // SEO parent and children
  const seo = await prisma.serviceAttribute.create({
    data: {
      slug: "seo",
      name: "SEO",
      nameVi: "SEO",
      category: "Marketing",
      categoryVi: "Marketing",
      price: 0,
      isRequired: false,
      tier: "basic",
      sortOrder: 10,
    },
  });

  await prisma.serviceAttribute.create({
    data: {
      slug: "basic-seo",
      name: "Basic SEO",
      nameVi: "SEO cơ bản",
      description: "Meta tags, sitemap, schema markup cơ bản",
      descriptionVi: "Meta tags, sitemap, schema markup cơ bản",
      category: "Marketing",
      categoryVi: "Marketing",
      price: 300000,
      isRequired: false,
      tier: "basic",
      parentId: seo.id,
      sortOrder: 11,
    },
  });

  await prisma.serviceAttribute.create({
    data: {
      slug: "advanced-seo",
      name: "Advanced SEO",
      nameVi: "SEO nâng cao",
      description: "Audit SEO toàn diện, tối ưu tốc độ, backlink strategy",
      descriptionVi: "Audit SEO toàn diện, tối ưu tốc độ, backlink strategy",
      category: "Marketing",
      categoryVi: "Marketing",
      price: 1000000,
      isRequired: false,
      tier: "advanced",
      parentId: seo.id,
      sortOrder: 12,
    },
  });

  // Security parent and children
  const security = await prisma.serviceAttribute.create({
    data: {
      slug: "security",
      name: "Security",
      nameVi: "Bảo mật",
      category: "Security",
      categoryVi: "Bảo mật",
      price: 0,
      isRequired: false,
      tier: "basic",
      sortOrder: 20,
    },
  });

  await prisma.serviceAttribute.create({
    data: {
      slug: "basic-ssl",
      name: "Basic SSL",
      nameVi: "SSL cơ bản",
      description: "Chứng chỉ SSL miễn phí Let's Encrypt",
      descriptionVi: "Chứng chỉ SSL miễn phí Let's Encrypt",
      category: "Security",
      categoryVi: "Bảo mật",
      price: 0,
      isRequired: false,
      tier: "basic",
      parentId: security.id,
      sortOrder: 21,
    },
  });

  await prisma.serviceAttribute.create({
    data: {
      slug: "advanced-ssl",
      name: "Advanced SSL",
      nameVi: "SSL nâng cao",
      description: "Chứng chỉ SSL cao cấp với bảo hiểm bảo mật",
      descriptionVi: "Chứng chỉ SSL cao cấp với bảo hiểm bảo mật",
      category: "Security",
      categoryVi: "Bảo mật",
      price: 500000,
      isRequired: false,
      tier: "advanced",
      parentId: security.id,
      sortOrder: 22,
    },
  });

  // Independent features (not in parent-child relationship)
  await prisma.serviceAttribute.createMany({
    data: [
      {
        slug: "menu",
        name: "Navigation Menu",
        nameVi: "Menu điều hướng",
        description: "Menu điều hướng responsive",
        descriptionVi: "Menu điều hướng responsive",
        category: "Core",
        categoryVi: "Cốt lõi",
        price: 0,
        isRequired: true,
        tier: "basic",
        sortOrder: 30,
      },
      {
        slug: "responsive",
        name: "Responsive Design",
        nameVi: "Thiết kế responsive",
        description: "Tương thích mọi thiết bị",
        descriptionVi: "Tương thích mọi thiết bị",
        category: "Core",
        categoryVi: "Cốt lõi",
        price: 0,
        isRequired: true,
        tier: "basic",
        sortOrder: 31,
      },
      {
        slug: "multilang",
        name: "Multi-language",
        nameVi: "Đa ngôn ngữ",
        description: "Hỗ trợ nhiều ngôn ngữ",
        descriptionVi: "Hỗ trợ nhiều ngôn ngữ",
        category: "Core",
        categoryVi: "Cốt lõi",
        price: 500000,
        isRequired: false,
        tier: "basic",
        sortOrder: 32,
      },
    ],
  });

  console.log("Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
