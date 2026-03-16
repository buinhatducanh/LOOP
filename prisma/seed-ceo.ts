// Seed script for CEO data
// Run via: npx dotenv -e .env.local -- npx tsx prisma/seed-ceo.ts
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Seeding CEO data...");

  // Check if CEO already exists
  const existingCEO = await prisma.teamMember.findUnique({
    where: { slug: "bui-nhat-duc-anh" },
  });

  if (existingCEO) {
    console.log("CEO already exists, updating...");
    await prisma.teamMember.update({
      where: { slug: "bui-nhat-duc-anh" },
      data: {
        name: "Bùi Nhật Đức Anh",
        role: "Founder & CEO",
        shortBio: "Một Gen Z đam mê công nghệ và nghệ thuật, người sáng lập LOOP với khát vọng xây dựng một môi trường lập trình tự do, sáng tạo và trân trọng tư duy thực tế.",
        bio: `"Xuất phát điểm là một Gen Z với tình yêu lớn dành cho việc giải quyết vấn đề, sáng tác âm nhạc và giáo dục, tôi luôn ấp ủ mang đến một làn gió mới cho ngành IT: trẻ trung, tự do và đậm chất nghệ thuật. Bước ra từ giai đoạn thị trường công nghệ đang có dấu hiệu bão hòa, tôi nhận thấy nhiều bạn trẻ đầy năng lượng lại dễ bị cản bước bởi những định kiến về "bằng cấp" hay "điểm số".

Chính vì vậy, tôi quyết định thành lập LOOP. Đây không chỉ là một tổ chức mà còn là một "sân chơi" công bằng, nơi tư duy logic và khả năng xử lý vấn đề thực tế được đặt lên hàng đầu. Tại LOOP, chúng tôi cùng nhau phá vỡ những giới hạn cũ để hết mình theo đuổi đam mê kiến tạo công nghệ trong kỷ nguyên số."`,
        quote: "Tư duy xử lý vấn đề quan trọng hơn bất kỳ điểm số hay nhãn mác nào.",
        email: "ducanhnhatbui@gmail.com",
        phone: "0378443602",
        linkedin: "https://linkedin.com/in/bui-nhat-duc-anh",
        roleLevel: 0,
        roleCategory: "leadership",
        isFeatured: true,
        isActive: true,
        sortOrder: 0,
      },
    });
    console.log("CEO updated successfully!");
  } else {
    await prisma.teamMember.create({
      data: {
        slug: "bui-nhat-duc-anh",
        name: "Bùi Nhật Đức Anh",
        role: "Founder & CEO",
        shortBio: "Một Gen Z đam mê công nghệ và nghệ thuật, người sáng lập LOOP với khát vọng xây dựng một môi trường lập trình tự do, sáng tạo và trân trọng tư duy thực tế.",
        bio: `"Xuất phát điểm là một Gen Z với tình yêu lớn dành cho việc giải quyết vấn đề, sáng tác âm nhạc và giáo dục, tôi luôn ấp ủ mang đến một làn gió mới cho ngành IT: trẻ trung, tự do và đậm chất nghệ thuật. Bước ra từ giai đoạn thị trường công nghệ đang có dấu hiệu bão hòa, tôi nhận thấy nhiều bạn trẻ đầy năng lượng lại dễ bị cản bước bởi những định kiến về "bằng cấp" hay "điểm số".

Chính vì vậy, tôi quyết định thành lập LOOP. Đây không chỉ là một tổ chức mà còn là một "sân chơi" công bằng, nơi tư duy logic và khả năng xử lý vấn đề thực tế được đặt lên hàng đầu. Tại LOOP, chúng tôi cùng nhau phá vỡ những giới hạn cũ để hết mình theo đuổi đam mê kiến tạo công nghệ trong kỷ nguyên số."`,
        image: "/images/team/ceo-placeholder.jpg",
        coverImage: "/images/team/ceo-cover-placeholder.jpg",
        quote: "Tư duy xử lý vấn đề quan trọng hơn bất kỳ điểm số hay nhãn mác nào.",
        email: "ducanhnhatbui@gmail.com",
        phone: "0378443602",
        linkedin: "https://linkedin.com/in/bui-nhat-duc-anh",
        expertise: ["Leadership", "Product Strategy", "Enterprise Architecture"],
        achievements: [],
        skills: ["Leadership", "Product Strategy", "Enterprise Architecture", "Cloud Native"],
        roleLevel: 0,
        roleCategory: "leadership",
        isFeatured: true,
        isActive: true,
        sortOrder: 0,
      },
    });
    console.log("CEO created successfully!");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
