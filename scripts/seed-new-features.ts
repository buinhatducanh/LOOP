/**
 * Seed script — P0 features: FAQ + JobPostings + Case Studies
 * Run: npx ts-node scripts/seed-new-features.ts
 */
import { config } from "dotenv";
import { resolve } from "path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

config({ path: resolve(process.cwd(), ".env.local") });

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  console.log("Seeding P0 features...\n");

  // ── FAQ ─────────────────────────────────────────────────────────────────────
  const faqs = [
    {
      question: "LOOP Solutions có bảo hành sau khi bàn giao website không?",
      answer: "Có. Tất cả website được bàn giao bởi LOOP Solutions đều được bảo hành miễn phí 6 tháng bao gồm: sửa lỗi kỹ thuật, cập nhật bảo mật, và hỗ trợ tối đa 5 giờ cho các thay đổi nhỏ. Sau 6 tháng, khách hàng có thể gia hạn gói bảo trì với chi phí ưu đãi.",
      category: "services",
      sortOrder: 1,
    },
    {
      question: "Thời gian hoàn thành một website thông thường là bao lâu?",
      answer: "Thời gian phụ thuộc vào quy mô dự án: Website landing page: 2-3 tuần. Website doanh nghiệp (5-10 trang): 4-6 tuần. Web app phức tạp: 2-4 tháng. Chúng tôi cam kết timeline rõ ràng trong hợp đồng và báo cáo tiến độ hàng tuần.",
      category: "services",
      sortOrder: 2,
    },
    {
      question: "Tôi có thể thanh toán bằng LP (Loop Points) không?",
      answer: "Có! Bạn có thể dùng LP để giảm giá dịch vụ với tỷ giá 1,000 LP = 500,000 VNĐ. Tối đa giảm 20% giá trị hóa đơn. LP được tích lũy từ các đơn hàng đã hoàn thành, hoàn thành khóa học, hoặc giới thiệu bạn bè.",
      category: "lp",
      sortOrder: 1,
    },
    {
      question: "LP có thể chuyển cho người khác không?",
      answer: "LP của nhân viên (staff) có thể chuyển cho nhau thông qua hệ thống LP Transfer. Tuy nhiên, LP của khách hàng (customer) CHỈ dùng cá nhân, không thể chuyển cho ai khác.",
      category: "lp",
      sortOrder: 2,
    },
    {
      question: "Làm sao để tôi biết tiến độ dự án của mình?",
      answer: "Khách hàng có thể theo dõi tiến độ dự án theo thời gian thực qua portal khách hàng tại /khach-hang. Tại đây bạn sẽ thấy: các milestone đã hoàn thành, Figma demo đã gửi, file bàn giao, và đội ngũ được giao. PM sẽ liên hệ trực tiếp qua chat portal nếu cần phản hồi.",
      category: "services",
      sortOrder: 3,
    },
    {
      question: "Tôi cần cung cấp những gì để bắt đầu dự án?",
      answer: "Để bắt đầu, bạn cần: (1) Logo và bộ nhận diện thương hiệu (nếu có). (2) Nội dung sơ bộ: giới thiệu công ty, sản phẩm/dịch vụ, hình ảnh. (3) Thông tin domain hiện tại (nếu có). (4) Tài khoản hosting/platform đang dùng (nếu có). Không có cũng không sao — chúng tôi sẽ hỗ trợ toàn bộ.",
      category: "technical",
      sortOrder: 1,
    },
    {
      question: "Website của LOOP có responsive trên mobile không?",
      answer: "Tất cả website do LOOP Solutions phát triển đều được thiết kế responsive — tự động hiển thị tốt trên mọi thiết bị: desktop, tablet và mobile. Chúng tôi tuân thủ mobile-first design principle và test trên các thiết bị phổ biến nhất tại Việt Nam.",
      category: "technical",
      sortOrder: 2,
    },
    {
      question: "Thanh toán như thế nào? Có hỗ trợ trả góp không?",
      answer: "Chúng tôi hỗ trợ: (1) Thanh toán 1 lần — 50% đặt cọc, 50% khi bàn giao. (2) Thanh toán theo giai đoạn cho dự án lớn. (3) Chuyển khoản ngân hàng hoặc thanh toán online qua VNPay/MoMo. Với dự án trên 50 triệu VNĐ, có thể thương lượng lịch thanh toán linh hoạt.",
      category: "payment",
      sortOrder: 1,
    },
    {
      question: "Học viên có được cấp chứng chỉ khi hoàn thành khóa học không?",
      answer: "Có. Khi hoàn thành 100% nội dung khóa học trên LOOP Academy, bạn sẽ nhận được chứng chỉ hoàn thành kèm theo LP thưởng. Chứng chỉ được cấp dưới dạng digital certificate có thể chia sẻ trên LinkedIn. Đặc biệt, nhân viên LOOP được ưu tiên tham gia các khóa học nội bộ miễn phí.",
      category: "academy",
      sortOrder: 1,
    },
    {
      question: "LOOP Academy có khóa học riêng cho doanh nghiệp không?",
      answer: "Có. Chúng tôi cung cấp gói đào tạo nội bộ cho doanh nghiệp: (1) Custom curriculum thiết kế theo nhu cầu công ty. (2) Đào tạo tại chỗ hoặc online. (3) Đánh giá kỹ năng trước/sau khóa học. (4) Báo cáo progress cho HR. Liên hệ để được báo giá riêng.",
      category: "academy",
      sortOrder: 2,
    },
  ];

  for (const faq of faqs) {
    const existing = await prisma.faq.findFirst({ where: { question: faq.question } });
    if (!existing) {
      await prisma.faq.create({ data: { ...faq, isActive: true } });
      console.log(`  FAQ created: ${faq.question.slice(0, 50)}...`);
    } else {
      console.log(`  FAQ exists: ${faq.question.slice(0, 50)}...`);
    }
  }

  // ── JobPostings ──────────────────────────────────────────────────────────────
  const jobs = [
    {
      title: "Senior React Developer",
      department: "engineering",
      role: "senior",
      employmentType: "full_time",
      location: "Ho Chi Minh City, Vietnam",
      salaryMin: 25000000,
      salaryMax: 40000000,
      description: "Chúng tôi đang tìm Senior React Developer để tham gia xây dựng các web app phức tạp cho khách hàng doanh nghiệp. Bạn sẽ làm việc trực tiếp với đội ngũ thiết kế và PM để biến Figma thành sản phẩm thực tế.\n\nCông nghệ: React 18, Next.js 15, TypeScript strict, Tailwind CSS, Zustand, React Query.",
      requirements: "Yêu cầu:\n- 3+ năm kinh nghiệm với React/Next.js\n- Thành thạo TypeScript (strict mode, no any)\n- Hiểu biết về performance optimization (Core Web Vitals)\n- Có kinh nghiệm với REST API / GraphQL\n- Kỹ năng giải quyết vấn đề tốt\n\nƯu tiên:\n- Có portfolio trên GitHub\n- Kinh nghiệm với Prisma hoặc ORM khác\n- Biết về SEO technical",
      benefits: "Phúc lợi:\n- Lương cạnh tranh: 25-40 triệu VNĐ/tháng\n- LP bonus hàng tháng dựa trên performance\n- Bảo hiểm xã hội, y tế đầy đủ\n- 14 ngày phép năm\n- Đào tạo chuyên môn (course budget)\n- Môi trường làm việc hiện đại, đội ngũ trẻ trung\n- Lộ trình thăng tiến rõ ràng: Member → Senior → Lead → Manager",
      status: "open",
      sortOrder: 1,
    },
    {
      title: "UI/UX Designer",
      department: "design",
      role: "mid",
      employmentType: "full_time",
      location: "Ho Chi Minh City, Vietnam",
      salaryMin: 18000000,
      salaryMax: 28000000,
      description: "Tham gia đội ngũ thiết kế LOOP Solutions — nơi design không chỉ đẹp mà còn drive business results. Bạn sẽ thiết kế UI cho website, web app và dashboard cho khách hàng đa dạng ngành.\n\nCông việc cụ thể:\n- Thiết kế UI từ concept → handoff cho dev\n- Xây dựng design system nhất quán\n- Làm việc với Figma — prototype, handoff specs",
      requirements: "Yêu cầu:\n- 2+ năm kinh nghiệm UI/UX design\n- Thành thạo Figma (auto layout, components, variants)\n- Portfolio đa dạng (website, app, dashboard)\n- Hiểu basic HTML/CSS để communicate với dev\n- Eye for detail và sensitivity về typography/color\n\nƯu tiên:\n- Kinh nghiệm design system\n- Background trong tech/startup environment\n- Biết basic motion/animation principles",
      benefits: "Phúc lợi:\n- Lương: 18-28 triệu VNĐ/tháng\n- LP bonus hàng tháng\n- Được sử dụng Macbook/workspace cao cấp\n- License Figma, Notion, các công cụ design\n- 14 ngày phép năm\n- Đào tạo chuyên môn, tham gia workshop\n- Môi trường sáng tạo, được thử nghiệm ý tưởng mới",
      status: "open",
      sortOrder: 2,
    },
    {
      title: "Content & Social Media Specialist",
      department: "media",
      role: "mid",
      employmentType: "full_time",
      location: "Ho Chi Minh City, Vietnam",
      salaryMin: 12000000,
      salaryMax: 20000000,
      description: "Sáng tạo nội dung cho brand LOOP Solutions và khách hàng. Bạn sẽ viết blog, quản lý social media, sản xuất nội dung video ngắn và tham gia vào các chiến dịch marketing của agency.",
      requirements: "Yêu cầu:\n- 2+ năm kinh nghiệm content marketing\n- Kỹ năng viết tốt — Vietnamese native speaker\n- Hiểu biết về social media platforms và algorithms\n- Biết sử dụng Canva hoặc basic design tools\n- Portfolio với samples của content đã publish\n\nƯu tiên:\n- Kinh nghiệm viết content cho tech/startup\n- Biết basic video editing (CapCut, Premiere)\n- Google Analytics / SEO knowledge",
      benefits: "Phúc lợi:\n- Lương: 12-20 triệu VNĐ/tháng + commission\n- LP bonus dựa trên content performance\n- Môi trường năng động, sáng tạo\n- Được đào tạo về content strategy\n- 14 ngày phép năm\n- Cơ hội phát triển thành Content Lead",
      status: "open",
      sortOrder: 3,
    },
    {
      title: "Project Manager (Digital Agency)",
      department: "management",
      role: "senior",
      employmentType: "full_time",
      location: "Ho Chi Minh City, Vietnam",
      salaryMin: 30000000,
      salaryMax: 50000000,
      description: "Quản lý các dự án chuyển đổi số từ đầu đến cuối — từ khi ký hợp đồng đến bàn giao và bảo hành. Bạn sẽ là cầu nối giữa khách hàng, đội ngũ dev/design và CEO.\n\nCông việc cụ thể:\n- Lead 3-5 dự án cùng lúc\n- Lập kế hoạch, timeline và resource allocation\n- Giao tiếp với khách hàng — expectation management\n- Điều phối dev, designer, QA để đảm bảo chất lượng và deadline",
      requirements: "Yêu cầu:\n- 4+ năm kinh nghiệm quản lý dự án (agency, software, hoặc consulting)\n- Kỹ năng giao tiếp và presentation xuất sắc\n- Hiểu biết về web development workflow\n- PMP, Scrum Master certification là điểm cộng\n- Kỹ năng negotiation và problem-solving\n\nƯu tiên:\n- Kinh nghiệm với digital agency\n- PMP hoặc tương đương\n- Biết về Jira, Notion, Slack",
      benefits: "Phúc lợi:\n- Lương: 30-50 triệu VNĐ/tháng\n- LP bonus cao (project completion bonus)\n- Đội ngũ 27+ thành viên tài năng\n- Được tham gia quyết định chiến lược công ty\n- Lộ trình: PM → Senior PM → Program Manager\n- 18 ngày phép năm\n- Bảo hiểm cao cấp",
      status: "open",
      sortOrder: 4,
    },
  ];

  for (const job of jobs) {
    const existing = await prisma.jobPosting.findFirst({ where: { title: job.title } });
    if (!existing) {
      await prisma.jobPosting.create({ data: { ...job, isActive: true } });
      console.log(`  Job created: ${job.title}`);
    } else {
      console.log(`  Job exists: ${job.title}`);
    }
  }

  // ── Case Study Projects ─────────────────────────────────────────────────────
  const projects = [
    {
      slug: "saigon-fashion-ecommerce",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80",
      title: "Sài Gòn Fashion — Nền tảng thương mại điện tử B2B",
      client: "Saigon Fashion Co.",
      year: "2025",
      category: "E-commerce",
      industry: "retail",
      isPublished: true,
      isCaseStudy: true,
      description: "Xây dựng nền tảng B2B kết nối nhà phân phối thời trang với cửa hàng bán lẻ. Hệ thống quản lý 2,000+ SKU, tích hợp thanh toán online và COD.",
      challenge: "Saigon Fashion cần một hệ thống để quản lý đơn hàng B2B phức tạp — nhiều cấp giá, giao hàng nhiều điểm, và thanh toán linh hoạt giữa các đại lý. Hệ thống cũ trên Excel không còn đáp ứng được quy mô.",
      solution: "Thiết kế custom B2B platform trên Next.js với dashboard quản lý theo role. Tích hợp API với các đơn vị vận chuyển và payment gateway. Xây dựng pricing engine linh hoạt theo tier của đại lý.",
      results: "Tăng 180% doanh số B2B trong 6 tháng đầu. Giảm 70% thời gian xử lý đơn hàng. Hệ thống phục vụ 150+ đại lý với 2,000+ đơn/tháng.",
      primaryMetric: "conversion_rate_up_180",
      roiMetric: "180% tăng doanh số trong 6 tháng",
      teamSize: 4,
      duration: "4 tháng",
      projectScope: "Full platform",
      clientQuote: "LOOP hiểu rõ nhu cầu của ngành thời trang — không chỉ xây website mà còn tối ưu process kinh doanh của chúng tôi.",
      clientRole: "CEO",
      techStack: ["Next.js", "Prisma", "PostgreSQL", "Stripe", "VietQR"],
      features: ["B2B ordering", "Multi-tier pricing", "COD management", "Dashboard analytics"],
    },
    {
      slug: "medtech-dashboard",
      image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80",
      title: "MedTech Vietnam — Dashboard theo dõi bệnh nhân",
      client: "MedTech Vietnam",
      year: "2025",
      category: "Healthcare",
      industry: "healthcare",
      isPublished: true,
      isCaseStudy: true,
      description: "Dashboard quản lý cho phòng khám đa khoa — theo dõi lịch hẹn, hồ sơ bệnh nhân, kê đơn thuốc và báo cáo tài chính y tế.",
      challenge: "MedTech Vietnam vận hành 3 phòng khám với 12 bác sĩ. Quy trình quản lý trên giấy và spreadsheet gây sai sót và khó theo dõi. Cần hệ thống đáp ứng yêu cầu bảo mật y tế (compliance).",
      solution: "Xây dựng web app với role-based access cho bác sĩ, lễ tân, kế toán. Tích hợp calendar system, patient records management, và prescription builder. Audit log cho compliance.",
      results: "Giảm 60% thời gian check-in bệnh nhân. 0 sai sót trong kê đơn (so với 15% trước đây). 8 giờ tiết kiệm mỗi tuần cho đội ngũ admin.",
      primaryMetric: "error_rate_down_100",
      roiMetric: "Tiết kiệm 8h/tuần, giảm 60% thời gian check-in",
      teamSize: 3,
      duration: "3 tháng",
      projectScope: "MVP",
      clientQuote: "Hệ thống giúp chúng tôi tập trung vào chăm sóc bệnh nhân thay vì lo lắng về paperwork.",
      clientRole: "COO",
      techStack: ["Next.js", "Prisma", "PostgreSQL", "Resend", "Cloudinary"],
      features: ["Patient management", "Appointment calendar", "Prescription builder", "Financial reports"],
    },
    {
      slug: "logistics-tracking-platform",
      image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80",
      title: "GreenLogistics — Nền tảng tracking vận tải nội địa",
      client: "GreenLogistics JSC",
      year: "2025",
      category: "Logistics",
      industry: "logistics",
      isPublished: true,
      isCaseStudy: true,
      description: "Nền tảng tracking vận tải kết nối 50+ driver với khách hàng doanh nghiệp. Real-time GPS tracking, thông báo tự động, và quản lý fleet.",
      challenge: "GreenLogistics cần giải pháp để track 50+ xe vận tải và giao tiếp real-time với khách hàng. Không có hệ thống centralized — driver dùng Zalo, khách hàng gọi điện hỏi tình trạng liên tục.",
      solution: "Web app với driver app tích hợp GPS. Customer portal để theo dõi đơn hàng real-time. SMS/notification tự động khi xe đến. Dashboard cho ops team quản lý fleet.",
      results: "Giảm 90% cuộc gọi hỏi tình trạng đơn hàng từ khách. Tăng 25% số chuyến xe/ngày nhờ route optimization. NPS từ 45 lên 72.",
      primaryMetric: "csat_score_72",
      roiMetric: "NPS tăng từ 45 → 72, giảm 90% cuộc gọi hỏi đơn",
      teamSize: 5,
      duration: "5 tháng",
      projectScope: "Full platform",
      clientQuote: "Từ một công ty logistics truyền thống, chúng tôi giờ có tech infrastructure để scale lên 10x.",
      clientRole: "CEO",
      techStack: ["Next.js", "Prisma", "PostgreSQL", "Twilio", "Mapbox"],
      features: ["Real-time GPS tracking", "Driver app", "Customer portal", "SMS notifications", "Route optimization"],
    },
  ];

  for (const project of projects) {
    const existing = await prisma.project.findFirst({ where: { slug: project.slug } });
    if (!existing) {
      await prisma.project.create({ data: project });
      console.log(`  Case study created: ${project.title}`);
    } else {
      console.log(`  Case study exists: ${project.title}`);
    }
  }

  console.log("\nSeeding complete!");
  console.log("Next: visit /admin/faq, /admin/careers, /admin/case-studies to review.");
}

main()
  .catch((e: unknown) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
