/**
 * POST /api/pricing/media-showcase-seed
 *
 * Seed sample data for the Media Showcase page:
 *   - 5 MediaTestimonial records
 *   - 3 MediaStory records (requires at least 1 TeamMember in DB)
 *
 * Run: curl -X POST http://localhost:3000/api/pricing/media-showcase-seed \
 *        -H "Authorization: Bearer <admin-jwt>" \
 *        -H "Content-Type: application/json"
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { handleError, ok } from "@/lib/api";

// ── Sample Testimonials ─────────────────────────────────────────────────────

const MEDIA_TESTIMONIALS = [
  {
    customerName: "Nguyễn Minh Tuấn",
    customerCompany: "TechViet JSC",
    rating: 5,
    text: "Đội ngũ LOOP rất chuyên nghiệp! Ảnh sự kiện ra mắt sản phẩm của chúng tôi cực kỳ sắc nét và sinh động. Bàn giao đúng deadline, chất lượng vượt mong đợi.",
    textEn: "LOOP team is very professional! Photos from our product launch event were extremely sharp and vivid. Delivered on time, quality exceeded expectations.",
    projectType: "event",
    sortOrder: 1,
  },
  {
    customerName: "Trần Thị Hương",
    customerCompany: "Hoa Việt Bakery",
    rating: 5,
    text: "Ảnh sản phẩm bánh của chúng tôi sau khi LOOP chụp trông cực kỳ hấp dẫn. Doanh số online tăng 40% sau khi dùng bộ ảnh mới. Cảm ơn LOOP rất nhiều!",
    textEn: "Our bakery product photos look incredibly appealing after LOOP's shoot. Online sales increased 40% after using the new photo set. Thank you LOOP!",
    projectType: "product",
    sortOrder: 2,
  },
  {
    customerName: "Lê Quang Đạt",
    customerCompany: "VN Digital Agency",
    rating: 4,
    text: "Video corporate branding giúp công ty chúng tôi nâng tầm hình ảnh rất nhiều. Khách hàng đều ấn tượng khi xem video trên website. LOOP rất sáng tạo và tận tâm.",
    textEn: "The corporate branding video greatly elevated our company image. Clients are all impressed when watching the video on our website. LOOP is creative and dedicated.",
    projectType: "corporate",
    sortOrder: 3,
  },
  {
    customerName: "Phạm Thị Mai Anh",
    customerCompany: "FashionX Store",
    rating: 5,
    text: "Content social media từ LOOP giúp trang Instagram của chúng tôi tăng engagement gấp 3 lần. Đội ngũ hiểu rõ xu hướng và biết cách tạo nội dung thu hút.",
    textEn: "Social media content from LOOP helped our Instagram page triple engagement. The team understands trends and knows how to create attractive content.",
    projectType: "social",
    sortOrder: 4,
  },
  {
    customerName: "Võ Hoàng Sơn",
    customerCompany: "SaigonTech Corp",
    rating: 5,
    text: "LOOP đã quay video cho hội thảo công nghệ quy mô 500 người. Chất lượng livestream ổn định, dựng phim highlight rất ấn tượng. Chắc chắn sẽ hợp tác lâu dài.",
    textEn: "LOOP filmed our 500-person tech conference. Livestream quality was stable, highlight reel was very impressive. Definitely a long-term partnership.",
    projectType: "event",
    sortOrder: 5,
  },
];

// ── Sample Stories ────────────────────────────────────────────────────────────

const MEDIA_STORIES = [
  {
    title: "Behind the Scenes: Buổi chụp sản phẩm Hoa Việt Bakery",
    titleEn: "Behind the Scenes: Hoa Viet Bakery Product Shoot",
    slug: "behind-the-scenes-hoa-viet-bakery",
    excerpt: "Hành trình 8 tiếng setup, 200 tấm ảnh và hơn 50 chiếc bánh — câu chuyện phía sau bộ ảnh sản phẩm viral trên Instagram.",
    excerptEn: "An 8-hour setup, 200 photos and 50+ cakes — the story behind the viral Instagram product photo set.",
    content: `<h2>Khởi đầu lúc 5h sáng</h2>
<p>Để có ánh sáng tự nhiên đẹp nhất, cả đội LOOP Media đã có mặt tại studio từ 5h sáng. Mỗi chiếc bánh được đặt cẩn thận trên bàn chụp với backdrop đã được thiết kế riêng cho brand Hoa Việt.</p>
<h2>Thử thách lớn nhất</h2>
<p>Kem tươi! Dưới ánh đèn studio, kem chảy rất nhanh. Chúng tôi phải chụp trong vòng 2 phút sau khi set up mỗi chiếc bánh, rồi đưa ngay vào tủ lạnh.</p>
<h2>Kết quả</h2>
<p>200 tấm ảnh gốc, 40 tấm retouched chuyên nghiệp. Khách hàng sử dụng cho website, Instagram và menu. Doanh số online tăng 40% trong tháng đầu tiên.</p>`,
    coverImage: null,
    status: "published",
    publishedAt: new Date("2026-03-15"),
  },
  {
    title: "Làm thế nào chúng tôi quay video sự kiện 500 người",
    titleEn: "How We Filmed a 500-Person Event",
    slug: "filming-500-person-event",
    excerpt: "Từ khảo sát địa điểm đến livestream 3 camera — quy trình sản xuất video sự kiện quy mô lớn của LOOP Media.",
    excerptEn: "From location scouting to 3-camera livestream — LOOP Media's large-scale event video production workflow.",
    content: `<h2>Khảo sát trước 1 tuần</h2>
<p>Đội LOOP Media đã đến hội trường 3 lần trước ngày sự kiện để đo sáng, test âm thanh và lên shot list chi tiết.</p>
<h2>Setup 3 camera</h2>
<p>Cam 1: Wide shot toàn cảnh sân khấu. Cam 2: Close-up diễn giả. Cam 3: Audience reaction + B-roll. Tất cả feed qua switcher và stream trực tiếp lên YouTube.</p>
<h2>Post-production</h2>
<p>Sau sự kiện 2 ngày, đội dựng phim đã hoàn thành video highlight 5 phút và 10 clips ngắn cho social media.</p>`,
    coverImage: null,
    status: "published",
    publishedAt: new Date("2026-04-01"),
  },
  {
    title: "Tips chụp ảnh sản phẩm đẹp với smartphone",
    titleEn: "Tips for Beautiful Product Photos with Smartphones",
    slug: "tips-chup-san-pham-smartphone",
    excerpt: "Không cần studio đắt tiền — 5 tips từ đội LOOP Media giúp bạn chụp ảnh sản phẩm đẹp chỉ với điện thoại.",
    excerptEn: "No expensive studio needed — 5 tips from the LOOP Media team for beautiful product photos using just your phone.",
    content: `<h2>1. Ánh sáng tự nhiên là bạn tốt nhất</h2>
<p>Đặt sản phẩm gần cửa sổ, tránh ánh nắng trực tiếp. Dùng tấm foam trắng phản xạ ánh sáng để fill bóng đổ.</p>
<h2>2. Background đơn giản</h2>
<p>Tờ giấy A0 trắng hoặc vải linen tự nhiên là đủ. Tránh background rối mắt làm mất focus vào sản phẩm.</p>
<h2>3. Quy tắc 1/3</h2>
<p>Bật lưới 3x3 trên camera. Đặt sản phẩm tại các điểm giao — tạo bố cục tự nhiên và chuyên nghiệp.</p>
<h2>4. Chụp nhiều góc</h2>
<p>Mỗi sản phẩm nên có ít nhất 4 góc: chính diện, 45°, top-down, và detail close-up.</p>
<h2>5. Edit nhẹ nhàng</h2>
<p>Dùng Snapseed hoặc Lightroom Mobile để tăng sáng, contrast và độ sắc nét. Tránh filter quá mạnh.</p>`,
    coverImage: null,
    status: "published",
    publishedAt: new Date("2026-04-10"),
  },
];

// ── Sample Bookings (Showcase) ──────────────────────────────────────────────

const MEDIA_BOOKINGS = [
  {
    customerName: "Nguyễn Minh Tuấn",
    customerEmail: "tuan@techviet.vn",
    title: "Sự kiện TechViet 2026",
    bookingType: "event",
    status: "approved",
    deliveredAssets: [
      "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1540575861501-7ad0582373f3?auto=format&fit=crop&q=80&w=800"
    ],
    deliveredAt: new Date("2026-04-01"),
  },
  {
    customerName: "Trần Thị Hương",
    customerEmail: "huong@hoaviet.com",
    title: "BST Bánh Trung Thu 2026",
    bookingType: "product",
    status: "approved",
    deliveredAssets: [
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=800"
    ],
    deliveredAt: new Date("2026-03-15"),
  },
  {
    customerName: "Lê Quang Đạt",
    customerEmail: "dat@vn-digital.agency",
    title: "Video Profile VN Digital",
    bookingType: "corporate",
    status: "approved",
    deliveredAssets: [
      "https://images.unsplash.com/photo-1492724441997-5dc865305da7?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&q=80&w=800"
    ],
    deliveredAt: new Date("2026-03-20"),
  },
  {
    customerName: "Phạm Thị Mai Anh",
    customerEmail: "anh@fashionx.vn",
    title: "Bộ ảnh FashionX Summer",
    bookingType: "social",
    status: "approved",
    deliveredAssets: [
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1539109132382-381bb3f1cff6?auto=format&fit=crop&q=80&w=800"
    ],
    deliveredAt: new Date("2026-04-05"),
  }
];

export async function POST(req: NextRequest) {
  try {
    // Require admin+ permission
    await requirePermission("services", "create");

    // Find a team member to use as author for stories
    const author = await prisma.teamMember.findFirst({
      where: { isActive: true, department: "media" },
      select: { id: true },
    });

    // Fallback: any active team member
    const authorId =
      author?.id ??
      (
        await prisma.teamMember.findFirst({
          where: { isActive: true },
          select: { id: true },
        })
      )?.id;

    if (!authorId) {
      return ok(
        { error: "No active TeamMember found. Cannot create stories." },
        400
      );
    }

    // ── Seed Testimonials ─────────────────────────────────────────────────

    await prisma.mediaTestimonial.deleteMany({});

    const testimonials = await Promise.all(
      MEDIA_TESTIMONIALS.map((t) =>
        prisma.mediaTestimonial.create({ data: t })
      )
    );

    // ── Seed Stories ──────────────────────────────────────────────────────

    await prisma.mediaStory.deleteMany({});

    const stories = await Promise.all(
      MEDIA_STORIES.map((s) =>
        prisma.mediaStory.create({
          data: {
            ...s,
            authorId,
          },
        })
      )
    );

    // ── Seed Bookings ─────────────────────────────────────────────────────

    await prisma.mediaBooking.deleteMany({});

    const bookings = await Promise.all(
      MEDIA_BOOKINGS.map((b, i) =>
        prisma.mediaBooking.create({
          data: {
            ...b,
            bookingNumber: `MBK-SEED-${Date.now()}-${i}`,
            teamMemberId: authorId,
          },
        })
      )
    );

    return ok(
      {
        message: "Media showcase data seeded successfully",
        testimonials: testimonials.length,
        stories: stories.length,
        bookings: bookings.length,
      },
      201
    );
  } catch (err) {
    return handleError(err);
  }
}
