/**
 * API Route — Landing Page 2 Data
 * Returns all hardcoded data for the LOOPS Studio landing page.
 * GET /api/landing2
 */
import { NextResponse } from "next/server";

export async function GET() {
  const data = {
    brand: {
      name: "LOOPS",
      tagline: "STUDIO",
      badge: "LOOPS™ — WEB 4.0 AGENCY",
    },
    hero: {
      headline: "Tạo dấu ấn số.\nNâng tầm\nthương hiệu.",
      description:
        "Giải pháp toàn diện về Website, Media, Marketing & Branding. Chúng tôi không chỉ thiết kế — chúng tôi xây dựng thương hiệu thống trị thị trường.",
      ctaPrimary: "Khám phá ngay",
      ctaSecondary: "Xem dự án",
      stats: [
        { value: "500+", label: "Dự án" },
        { value: "10+", label: "Năm" },
        { value: "95%", label: "Hài lòng" },
      ],
      heroImage:
        "https://images.unsplash.com/photo-1691491918178-8a2e68b44919?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    },
    trustedLogos: [
      "Samsung", "VPBank", "Viettel", "TNO Holdings",
      "ACB", "momo", "Grab Vietnam", "Cleo Bridal",
    ],
    services: [
      {
        num: "01",
        title: "Thiết kế Website",
        short: "Website cao cấp, chuẩn UX/UI",
        desc: "Thiết kế và phát triển website chuyên nghiệp, tối ưu trải nghiệm người dùng và tỷ lệ chuyển đổi.",
        tags: ["UI/UX Design", "Frontend Dev", "SEO Ready", "Responsive"],
      },
      {
        num: "02",
        title: "Sản xuất Media",
        short: "Quay phim, chụp ảnh, motion graphic",
        desc: "Sản xuất nội dung hình ảnh và video chuyên nghiệp từ concept đến thành phẩm.",
        tags: ["Video Production", "Photography", "Motion Graphics", "Post-Production"],
      },
      {
        num: "03",
        title: "Digital Marketing",
        short: "Chiến lược đa kênh, ROI cao",
        desc: "Chiến lược marketing toàn diện: SEO, Google Ads, Meta Ads, Content Marketing.",
        tags: ["SEO/SEM", "Google Ads", "Social Media", "Content Marketing"],
      },
      {
        num: "04",
        title: "Branding Strategy",
        short: "Nhận diện thương hiệu toàn diện",
        desc: "Xây dựng thương hiệu từ nền tảng: logo, bộ nhận diện, brand guideline, brand voice.",
        tags: ["Brand Identity", "Logo Design", "Brand Guidelines", "Visual System"],
      },
      {
        num: "05",
        title: "Ứng dụng & App",
        short: "Mobile app iOS/Android chuyên nghiệp",
        desc: "Phát triển ứng dụng mobile iOS/Android và web app tùy chỉnh.",
        tags: ["iOS/Android", "React Native", "Web App", "UX Design"],
      },
      {
        num: "06",
        title: "Tư vấn & Giải pháp",
        short: "Chiến lược chuyển đổi số tổng thể",
        desc: "Tư vấn chiến lược chuyển đổi số, lộ trình phát triển thương hiệu và giải pháp công nghệ tổng thể.",
        tags: ["Digital Strategy", "Business Consulting", "Tech Stack", "Growth Plan"],
      },
    ],
    kpiStats: [
      { value: 500, suffix: "+", label: "Dự án hoàn thành", desc: "Trên toàn quốc & quốc tế" },
      { value: 10, suffix: "+", label: "Năm kinh nghiệm", desc: "Đồng hành cùng doanh nghiệp" },
      { value: 95, suffix: "%", label: "Tỷ lệ hài lòng", desc: "Cao nhất trong ngành" },
      { value: 24, suffix: "/7", label: "Hỗ trợ liên tục", desc: "Luôn sẵn sàng khi bạn cần" },
    ],
    projects: [
      {
        client: "The Coffee House",
        category: "Website Design + E-commerce",
        year: "2024",
        desc: "Redesign toàn bộ hệ thống website thương mại điện tử cho chuỗi cà phê hàng đầu Việt Nam.",
        result: "+240% Conversion",
      },
      {
        client: "VPBank Prime",
        category: "Digital Campaign + Branding",
        year: "2024",
        desc: "Chiến dịch truyền thông số toàn diện cho sản phẩm thẻ tín dụng cao cấp.",
        result: "15M Lượt tiếp cận",
      },
      {
        client: "TNO Holdings",
        category: "Corporate Video + Brand Identity",
        year: "2023",
        desc: "Sản xuất video doanh nghiệp và xây dựng bộ nhận diện thương hiệu mới.",
        result: "Brand Overhaul",
      },
      {
        client: "Cleo Bridal",
        category: "Editorial Photography + Lookbook",
        year: "2023",
        desc: "Chụp ảnh và quay video editorial lookbook cho BST váy cưới cao cấp.",
        result: "3 BST Ra mắt",
      },
    ],
    pricing: [
      {
        name: "Starter",
        tagline: "Phù hợp cho startup & doanh nghiệp vừa",
        price: "9.900.000",
        unit: "₫",
        period: "/ gói dự án",
        highlight: false,
        features: [
          "Thiết kế website 5 trang",
          "Chuẩn UX/UI, Responsive",
          "Tích hợp SEO cơ bản",
          "1 tháng hỗ trợ miễn phí",
          "Bàn giao source code",
          "Bảo hành 6 tháng",
        ],
        cta: "Chọn gói Starter",
      },
      {
        name: "Business",
        tagline: "Giải pháp toàn diện cho doanh nghiệp",
        price: "24.900.000",
        unit: "₫",
        period: "/ gói dự án",
        highlight: true,
        badge: "Phổ biến nhất",
        features: [
          "Tất cả từ gói Starter",
          "Website không giới hạn trang",
          "Thiết kế UI/UX cao cấp",
          "Digital Marketing 3 tháng",
          "Sản xuất video giới thiệu",
          "SEO toàn diện + Analytics",
          "Hỗ trợ 24/7 trong 3 tháng",
          "Miễn phí cập nhật 1 năm",
        ],
        cta: "Chọn gói Business",
      },
      {
        name: "Enterprise",
        tagline: "Giải pháp tùy chỉnh cho tập đoàn lớn",
        price: "49.900.000",
        unit: "₫",
        period: "/ gói dự án",
        highlight: false,
        features: [
          "Tất cả từ gói Business",
          "Thiết kế Brand Identity đầy đủ",
          "Phát triển App Mobile iOS/Android",
          "Chiến dịch Marketing 6 tháng",
          "Video production chuyên nghiệp",
          "Tư vấn chiến lược hàng tháng",
          "Account manager riêng",
          "SLA ưu tiên 24/7",
        ],
        cta: "Liên hệ ngay",
      },
    ],
    testimonials: [
      {
        quote:
          "LOOPS đã giúp chúng tôi xây dựng một hệ sinh thái số hoàn chỉnh. Website mới tăng tỷ lệ chuyển đổi lên 240% chỉ sau 3 tháng đầu ra mắt.",
        name: "Nguyễn Anh Tuấn",
        title: "CEO, The Coffee House",
        rating: 5,
        metric: "+240%",
        metricLabel: "Conversion Rate",
      },
      {
        quote:
          "Sự hài lòng của khách hàng là ưu tiên hàng đầu tại LOOPS. Campaign VPBank Prime đạt kết quả vượt kỳ vọng.",
        name: "Lê Thanh Hương",
        title: "Marketing Director, VPBank",
        rating: 5,
        metric: "15M",
        metricLabel: "Lượt tiếp cận",
      },
      {
        quote:
          "Bộ nhận diện thương hiệu LOOPS thiết kế cho TNO Holdings được đánh giá cao nhất trong lịch sử công ty.",
        name: "Phan Quốc Việt",
        title: "Chairman, TNO Holdings",
        rating: 5,
        metric: "#1",
        metricLabel: "Brand Score",
      },
    ],
    faqs: [
      {
        id: 1,
        q: "LOOPS cung cấp những dịch vụ gì?",
        a: "LOOPS cung cấp giải pháp toàn diện bao gồm: Thiết kế Website, Sản xuất Media, Digital Marketing, Branding Strategy, Phát triển App Mobile và Tư vấn chiến lược chuyển đổi số.",
      },
      {
        id: 2,
        q: "Thời gian thực hiện một dự án website là bao lâu?",
        a: "Thời gian thực hiện phụ thuộc vào quy mô dự án. Thông thường website cơ bản mất 7–14 ngày, website thương mại điện tử 21–30 ngày.",
      },
      {
        id: 3,
        q: "Chi phí thiết kế website tại LOOPS như thế nào?",
        a: "Chi phí khởi điểm từ 9.900.000₫ cho gói Starter. Chúng tôi tư vấn miễn phí và báo giá chi tiết trước khi ký hợp đồng.",
      },
      {
        id: 4,
        q: "LOOPS có hỗ trợ sau khi bàn giao không?",
        a: "Có. Tất cả dự án đều được bảo hành ít nhất 6 tháng. Gói Business và Enterprise được hỗ trợ 24/7.",
      },
      {
        id: 5,
        q: "Làm thế nào để bắt đầu hợp tác với LOOPS?",
        a: "Rất đơn giản! Điền vào form tư vấn miễn phí hoặc liên hệ qua hotline. Chuyên gia của chúng tôi sẽ liên hệ trong vòng 2 giờ làm việc.",
      },
      {
        id: 6,
        q: "LOOPS có kinh nghiệm với doanh nghiệp ngành tài chính/bất động sản không?",
        a: "Có. Chúng tôi đã thực hiện hơn 500 dự án đa dạng ngành nghề, bao gồm tài chính ngân hàng, bất động sản, F&B, thời trang, y tế và giáo dục.",
      },
    ],
    workProcess: [
      {
        num: "01",
        title: "Khám phá & Phân tích",
        desc: "Nghiên cứu chuyên sâu về thị trường, đối thủ và mục tiêu doanh nghiệp.",
        duration: "3–5 ngày",
      },
      {
        num: "02",
        title: "Chiến lược & Ý tưởng",
        desc: "Đề xuất chiến lược sáng tạo, concept thiết kế và lộ trình triển khai.",
        duration: "5–7 ngày",
      },
      {
        num: "03",
        title: "Sản xuất & Triển khai",
        desc: "Đội ngũ chuyên gia thực thi từng hạng mục theo tiêu chuẩn cao nhất.",
        duration: "14–30 ngày",
      },
      {
        num: "04",
        title: "Tối ưu & Tăng trưởng",
        desc: "Theo dõi hiệu suất, báo cáo định kỳ và liên tục tối ưu.",
        duration: "Liên tục",
      },
    ],
    contact: {
      email: "hello@loops.studio",
      phone: "0901 234 567",
      address: "123 Nguyễn Đình Chiểu, P4, Q.3, TP.HCM",
    },
    navigation: [
      { label: "Dịch vụ", href: "#services" },
      { label: "Dự án", href: "#projects" },
      { label: "Quy trình", href: "#process" },
      { label: "Bảng giá", href: "#pricing" },
      { label: "FAQ", href: "#faq" },
    ],
  };

  return NextResponse.json(data, {
    status: 200,
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
