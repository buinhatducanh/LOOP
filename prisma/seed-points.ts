import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Seeding points system...");

  // Daily Rewards - Login streak rewards
  const dailyRewards = [
    { day: 1, points: 10, xpBonus: 1 },
    { day: 2, points: 15, xpBonus: 2 },
    { day: 3, points: 20, xpBonus: 3 },
    { day: 4, points: 25, xpBonus: 4 },
    { day: 5, points: 30, xpBonus: 5 },
    { day: 6, points: 40, xpBonus: 7 },
    { day: 7, points: 50, xpBonus: 10 },
  ];

  for (const reward of dailyRewards) {
    await prisma.dailyReward.upsert({
      where: { day: reward.day },
      update: reward,
      create: reward,
    });
  }
  console.log("✓ Daily rewards seeded");

  // Point Activities
  const activities = [
    {
      slug: "daily-login",
      name: "Daily Login",
      nameVi: "Đăng nhập hàng ngày",
      description: "Login every day to earn points",
      descriptionVi: "Đăng nhập mỗi ngày để nhận điểm thưởng",
      points: 10,
      xpBonus: 1,
      dailyLimit: 1,
      minLevel: 1,
      requiresPurchase: false,
      sortOrder: 1,
    },
    {
      slug: "purchase",
      name: "Purchase Reward",
      nameVi: "Thưởng khi mua hàng",
      description: "Earn points when making a purchase",
      descriptionVi: "Nhận điểm thưởng khi mua sản phẩm/dịch vụ",
      descriptionVi: "Nhận điểm thưởng khi mua sản phẩm/dịch vụ",
      points: 100,
      xpBonus: 20,
      requiresPurchase: false,
      sortOrder: 2,
    },
    {
      slug: "review-website",
      name: "Review Website",
      nameVi: "Đánh giá website",
      description: "Write a review for your purchased website",
      descriptionVi: "Viết đánh giá về website đã mua",
      points: 50,
      xpBonus: 10,
      dailyLimit: 1,
      minLevel: 1,
      requiresPurchase: true,
      sortOrder: 3,
    },
    {
      slug: "referral",
      name: "Referral Program",
      nameVi: "Giới thiệu bạn bè",
      description: "Earn points when your referral makes a purchase",
      descriptionVi: "Nhận điểm khi bạn bè được giới thiệu mua hàng",
      points: 200,
      xpBonus: 50,
      minLevel: 1,
      requiresPurchase: false,
      sortOrder: 4,
    },
    {
      slug: "upgrade",
      name: "Website Upgrade",
      nameVi: "Nâng cấp website",
      description: "Earn bonus points when upgrading your website package",
      descriptionVi: "Nhận điểm thưởng khi nâng cấp gói website",
      points: 150,
      xpBonus: 30,
      minLevel: 1,
      requiresPurchase: false,
      sortOrder: 5,
    },
  ];

  for (const activity of activities) {
    await prisma.pointActivity.upsert({
      where: { slug: activity.slug },
      update: activity,
      create: activity,
    });
  }
  console.log("✓ Point activities seeded");

  // Advertisements
  const ads = [
    {
      slug: "loop-intro",
      title: "LOOP Introduction",
      titleVi: "Giới thiệu về LOOP",
      description: "Watch our company introduction video",
      descriptionVi: "Xem video giới thiệu về công ty LOOP",
      videoUrl: "/videos/loop-intro.mp4",
      thumbnailUrl: "/images/ads/loop-intro.jpg",
      duration: 30,
      points: 5,
      xpBonus: 1,
      dailyLimit: 10,
      watchCooldown: 60,
      minLevel: 1,
      requiresPurchase: false,
      sortOrder: 1,
    },
    {
      slug: "web-design-tips",
      title: "Web Design Tips",
      titleVi: "Mẹo thiết kế website",
      description: "Learn web design tips from experts",
      descriptionVi: "Học các mẹo thiết kế web từ chuyên gia",
      videoUrl: "/videos/web-tips.mp4",
      thumbnailUrl: "/images/ads/web-tips.jpg",
      duration: 60,
      points: 10,
      xpBonus: 2,
      dailyLimit: 5,
      watchCooldown: 120,
      minLevel: 2,
      requiresPurchase: false,
      sortOrder: 2,
    },
    {
      slug: "seo-basics",
      title: "SEO Basics",
      titleVi: "Cơ bản về SEO",
      description: "Learn the basics of SEO for your website",
      descriptionVi: "Học kiến thức cơ bản về SEO cho website của bạn",
      videoUrl: "/videos/seo-basics.mp4",
      thumbnailUrl: "/images/ads/seo-basics.jpg",
      duration: 45,
      points: 8,
      xpBonus: 2,
      dailyLimit: 5,
      watchCooldown: 120,
      minLevel: 1,
      requiresPurchase: false,
      sortOrder: 3,
    },
    {
      slug: "hosting-benefits",
      title: "Premium Hosting Benefits",
      titleVi: "Lợi ích Hosting Premium",
      description: "Discover premium hosting features",
      descriptionVi: "Khám phá các tính năng hosting cao cấp",
      videoUrl: "/videos/hosting-benefits.mp4",
      thumbnailUrl: "/images/ads/hosting-benefits.jpg",
      duration: 90,
      points: 15,
      xpBonus: 3,
      dailyLimit: 3,
      watchCooldown: 300,
      minLevel: 3,
      requiresPurchase: true,
      sortOrder: 4,
    },
  ];

  for (const ad of ads) {
    await prisma.advertisement.upsert({
      where: { slug: ad.slug },
      update: ad,
      create: ad,
    });
  }
  console.log("✓ Advertisements seeded");

  console.log("\n✅ Points system seeded successfully!");
  console.log("\n📊 Summary:");
  console.log(`   - ${dailyRewards.length} daily reward tiers`);
  console.log(`   - ${activities.length} point activities`);
  console.log(`   - ${ads.length} advertisements`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
