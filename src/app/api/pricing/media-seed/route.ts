/**
 * POST /api/pricing/media-seed
 *
 * Seed 3 Media ServicePackages (type="media") cho phòng Media:
 *   1. Chụp Ảnh (2,000,000 VND)
 *   2. Quay & Dựng (3,500,000 VND)
 *   3. Quay & Dựng + Content (5,000,000 VND)
 *
 * Run: curl -X POST http://localhost:3000/api/pricing/media-seed \
 *        -H "Authorization: Bearer <admin-jwt>"
 *        -H "Content-Type: application/json"
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { handleError, ok } from "@/lib/api";

const MEDIA_PACKAGES = [
  {
    slug: "chup-anh",
    title: "Chụp Ảnh",
    titleEn: "Photography",
    titleJa: "写真撮影",
    titleKo: "사진촬영",
    titleZh: "摄影服务",
    shortDesc: "Gói chụp ảnh chuyên nghiệp cho sản phẩm, doanh nghiệp, profile cá nhân",
    shortDescEn: "Professional photography for products, business, and personal profiles",
    shortDescJa: "商品・企業・個人プロフィール向けプロフェッショナル写真撮影",
    shortDescKo: "제품, 비즈니스, 개인 프로필을 위한 전문 사진촬영",
    shortDescZh: "专业摄影服务 - 产品、企业、个人简介",
    type: "media",
    price: 2_000_000,
    priceText: "2,000,000 VND",
    features: [
      "01 buổi chụp tại studio hoặc ngoài hiện trường",
      "Tối đa 20 tấm ảnh chỉnh sửa chuyên nghiệp",
      "Giao 20 file ảnh gốc (JPEG/PNG, độ phân giải cao)",
      "Bàn giao trong 3 ngày làm việc",
      "Hỗ trợ chọn concept & bối cảnh theo yêu cầu",
      "Có thể thêm ảnh viên bổ sung",
    ],
    isSubscription: false,
    sortOrder: 1,
    isActive: true,
  },
  {
    slug: "quay-va-dung",
    title: "Quay & Dựng",
    titleEn: "Video Shooting & Editing",
    titleJa: "撮影・編集",
    titleKo: "촬영 및 편집",
    titleZh: "视频拍摄与剪辑",
    shortDesc: "Gói quay video và dựng phim chuyên nghiệp: sản phẩm, doanh nghiệp, dịch vụ",
    shortDescEn: "Professional video shooting & editing: product, business, service",
    shortDescJa: "商品・企業・サービス向けプロフェッショナル動画撮影・編集",
    shortDescKo: "전문 영상 촬영 및 편집: 제품, 비즈니스, 서비스",
    shortDescZh: "专业视频拍摄与剪辑 - 产品、企业、服务",
    type: "media",
    price: 3_500_000,
    priceText: "3,500,000 VND",
    features: [
      "01 buổi quay tại hiện trường hoặc studio (tối đa 3 giờ)",
      "Quay Full HD, setup ánh sáng chuyên nghiệp",
      "Dựng phim chuyên nghiệp 2–3 phút (intro, nội dung, outro)",
      "Nhạc nền bản quyền ( royalty-free )",
      "Giao 01 video hoàn chỉnh + 03 đoạn clip ngắn social media (15s/30s)",
      "Bàn giao trong 5 ngày làm việc",
      "01 lần chỉnh sửa theo phản hồi khách hàng",
      "Xuất file: MP4 định dạng chuẩn web + social",
    ],
    isSubscription: false,
    sortOrder: 2,
    isActive: true,
  },
  {
    slug: "quay-dung-content",
    title: "Quay & Dựng + Content",
    titleEn: "Video + Content Package",
    titleJa: "撮影・編集＋コンテンツ",
    titleKo: "촬영+편집+콘텐츠",
    titleZh: "视频拍摄剪辑 + 内容包装",
    shortDesc: "Gói toàn diện: quay video + dựng phim + viết content, phù hợp doanh nghiệp và dịch vụ cao cấp",
    shortDescEn: "All-in-one: video shooting + editing + content writing, ideal for premium business and service",
    shortJa: "一括パッケージ：動画撮影＋編集＋コンテンツ制作",
    shortDescJa: "一括パッケージ：動画撮影＋編集＋コンテンツ制作",
    shortDescKo: "올인원: 영상 촬영 + 편집 + 콘텐츠 작성, 프리미엄 비즈니스를 위해",
    shortDescZh: "一站式：视频拍摄 + 剪辑 + 内容撰写，适合高端企业和专业服务",
    type: "media",
    price: 5_000_000,
    priceText: "5,000,000 VND",
    features: [
      "02 buổi quay: sản phẩm + địa điểm/doanh nghiệp (tổng 5 giờ)",
      "Quay video Full HD / 4K tuỳ yêu cầu",
      "Dựng phim chuyên nghiệp 4–6 phút (intro, storytelling, outro)",
      "Nhạc nền bản quyền + voice-over / subtitle nếu cần",
      "05 đoạn clip ngắn social media (15s/30s/60s) tối ưu từng nền tảng",
      "Viết nội dung kịch bản (script) cho 05 đoạn clip",
      "Viết caption + hashtag cho 05 bài đăng (VI/EN)",
      "Thiết kế thumbnail cho 05 đoạn clip",
      "02 lần chỉnh sửa theo phản hồi",
      "Bàn giao trong 7 ngày làm việc",
      "Xuất file đa định dạng + bản gốc project",
    ],
    isSubscription: false,
    sortOrder: 3,
    isActive: true,
  },
];

export async function POST(req: NextRequest) {
  try {
    // Require admin+ permission to seed media packages
    await requirePermission("services", "create");

    // Xoá gói media cũ trước khi seed lại (idempotent)
    await prisma.servicePackage.deleteMany({ where: { type: "media" } });

    const created = await Promise.all(
      MEDIA_PACKAGES.map((pkg) =>
        prisma.servicePackage.create({ data: pkg })
      )
    );

    return ok(
      { message: "Media packages seeded successfully", count: created.length, packages: created },
      201
    );
  } catch (err) {
    return handleError(err);
  }
}
