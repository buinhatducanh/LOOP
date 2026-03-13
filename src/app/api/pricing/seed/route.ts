import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const data = [
  {
    "groupName": "Giao diện & Trải nghiệm",
    "slug": "giao-dien-trai-nghiem",
    "sortOrder": 1,
    "isActive": true,
    "features": [
      {
        "featureName": "Loại giao diện & Phản hồi",
        "description": "Phong cách thiết kế và khả năng tương thích thiết bị",
        "logicLevel": "Low",
        "isRequired": true,
        "sortOrder": 1,
        "isActive": true,
        "variants": [
          {
            "variantName": "Mẫu tiêu chuẩn, chuẩn Responsive",
            "description": "Giao diện theo mẫu có sẵn, hiển thị tốt trên mọi thiết bị",
            "price": 2890000,
            "sortOrder": 1
          },
          {
            "variantName": "Tùy chỉnh màu sắc, bộ lọc cơ bản",
            "description": "Thay đổi màu thương hiệu, tích hợp bộ lọc sản phẩm đơn giản",
            "price": 4890000,
            "sortOrder": 2
          },
          {
            "variantName": "Tối ưu UX các bước Checkout, Animation mượt mà, Mega Menu",
            "description": "Trải nghiệm mua hàng tối ưu, hiệu ứng chuyển động, menu lớn",
            "price": 6890000,
            "sortOrder": 3
          },
          {
            "variantName": "Giao diện độc quyền, Tối ưu tốc độ tải trang bằng NextJS (SSR/SSG)",
            "description": "Thiết kế riêng biệt, công nghệ NextJS siêu nhanh",
            "price": 10890000,
            "sortOrder": 4
          }
        ]
      }
    ]
  },
  {
    "groupName": "Sản phẩm & Khuyến mãi",
    "slug": "san-pham-khuyen-mai",
    "sortOrder": 2,
    "isActive": true,
    "features": [
      {
        "featureName": "Hiển thị Sản phẩm & Giỏ hàng",
        "description": "Cách thức trình bày sản phẩm và chức năng mua hàng",
        "logicLevel": "Medium",
        "isRequired": true,
        "sortOrder": 1,
        "isActive": true,
        "variants": [
          {
            "variantName": "Giỏ hàng cơ bản, hiển thị sản phẩm cơ bản",
            "price": 0,
            "sortOrder": 1
          }
        ]
      },
      {
        "featureName": "Chức năng Khuyến mãi & Phí ship",
        "description": "Các công cụ tăng doanh số và tính phí vận chuyển",
        "logicLevel": "Medium",
        "isRequired": false,
        "sortOrder": 2,
        "isActive": true,
        "variants": [
          {
            "variantName": "Mã giảm giá chung, tính phí ship đồng giá",
            "price": 2000000,
            "sortOrder": 1
          },
          {
            "variantName": "Flash Sale có đồng hồ đếm ngược, Mua combo (Combo discount)",
            "price": 4000000,
            "sortOrder": 2
          },
          {
            "variantName": "Hệ thống Tích điểm đổi quà, Ví tiền ảo nội bộ (Credit system)",
            "price": 8000000,
            "sortOrder": 3
          }
        ]
      }
    ]
  },
  {
    "groupName": "Hình ảnh & Video",
    "slug": "hinh-anh-video",
    "sortOrder": 3,
    "isActive": true,
    "features": [
      {
        "featureName": "Dung lượng & Chất lượng lưu trữ",
        "description": "Khả năng lưu trữ và hiển thị media",
        "logicLevel": "Low",
        "isRequired": true,
        "sortOrder": 1,
        "isActive": true,
        "variants": [
          {
            "variantName": "Kho lưu trữ hình ảnh cơ bản",
            "price": 0,
            "sortOrder": 1
          },
          {
            "variantName": "Kho lưu trữ hình ảnh + video",
            "price": 2000000,
            "sortOrder": 2
          },
          {
            "variantName": "Hình ảnh video Full HD, banner động",
            "price": 4000000,
            "sortOrder": 3
          },
          {
            "variantName": "Hình ảnh video Full HD, banner động, tối ưu tự động (WebP)",
            "price": 8000000,
            "sortOrder": 4
          }
        ]
      }
    ]
  },
  {
    "groupName": "Quản trị Đội nhóm",
    "slug": "quan-tri-doi-nhom",
    "sortOrder": 4,
    "isActive": true,
    "features": [
      {
        "featureName": "Phân quyền Tài khoản",
        "description": "Số lượng và cấp độ quyền quản trị",
        "logicLevel": "High",
        "isRequired": true,
        "sortOrder": 1,
        "isActive": true,
        "variants": [
          {
            "variantName": "1 tài khoản Admin toàn quyền",
            "price": 0,
            "sortOrder": 1
          },
          {
            "variantName": "Phân quyền cơ bản (Admin, Editor)",
            "price": 2000000,
            "sortOrder": 2
          },
          {
            "variantName": "Role-Based Access Control: Cấp quyền chi tiết (chỉ xem, được sửa) cho Sale, Kho",
            "price": 4000000,
            "sortOrder": 3
          },
          {
            "variantName": "Workflow: Nhân viên đăng sản phẩm -> Quản lý duyệt -> Xuất bản",
            "price": 8000000,
            "sortOrder": 4
          }
        ]
      }
    ]
  },
  {
    "groupName": "Báo cáo & Dữ liệu",
    "slug": "bao-cao-du-lieu",
    "sortOrder": 5,
    "isActive": true,
    "features": [
      {
        "featureName": "Hệ thống Báo cáo",
        "description": "Mức độ chi tiết của dữ liệu thống kê",
        "logicLevel": "High",
        "isRequired": true,
        "sortOrder": 1,
        "isActive": true,
        "variants": [
          {
            "variantName": "Danh sách đơn hàng",
            "price": 0,
            "sortOrder": 1
          },
          {
            "variantName": "Thống kê tổng doanh thu đơn giản",
            "price": 2000000,
            "sortOrder": 2
          },
          {
            "variantName": "Biểu đồ doanh thu trực quan, thống kê sản phẩm bán chạy",
            "price": 4000000,
            "sortOrder": 3
          },
          {
            "variantName": "Lịch sử thao tác của nhân viên (Log hệ thống), Báo cáo chiết khấu",
            "price": 8000000,
            "sortOrder": 4
          }
        ]
      }
    ]
  },
  {
    "groupName": "Dịch vụ Bổ sung (Nasani VN)",
    "slug": "dich-vu-bo-sung",
    "sortOrder": 6,
    "isActive": true,
    "features": [
      {
        "featureName": "Tên miền Quốc tế (.com)",
        "description": "Đã bao gồm phí năm 1",
        "logicLevel": "Low",
        "isRequired": false,
        "sortOrder": 1,
        "isActive": true,
        "variants": [
          {
            "variantName": "Đăng ký mới",
            "price": 350000,
            "sortOrder": 1
          }
        ]
      },
      {
        "featureName": "Tên miền Việt Nam (.vn)",
        "description": "Đã bao gồm phí năm 1",
        "logicLevel": "Low",
        "isRequired": false,
        "sortOrder": 2,
        "isActive": true,
        "variants": [
          {
            "variantName": "Đăng ký mới",
            "price": 850000,
            "sortOrder": 1
          }
        ]
      },
      {
        "featureName": "SSD Cloud Hosting (Việt Nam)",
        "description": "Dung lượng lưu trữ hosting năm 1",
        "logicLevel": "Medium",
        "isRequired": false,
        "sortOrder": 3,
        "isActive": true,
        "variants": [
          {
            "variantName": "Cơ bản (2GB - 3GB)",
            "price": 800000,
            "sortOrder": 1
          },
          {
            "variantName": "Nâng cao (5GB - 10GB)",
            "price": 1800000,
            "sortOrder": 2
          }
        ]
      }
    ]
  }
];

export async function GET() {
  try {
    console.log("Clearing old pricing data...");
    await prisma.featureVariant.deleteMany();
    await prisma.feature.deleteMany();
    await prisma.featureGroup.deleteMany();

    console.log("Seeding new pricing data...");
    for (const group of data) {
      await prisma.featureGroup.create({
        data: {
          groupName: group.groupName,
          slug: group.slug,
          sortOrder: group.sortOrder,
          isActive: group.isActive,
          features: {
            create: group.features.map(f => ({
              featureName: f.featureName,
              description: f.description || null,
              logicLevel: f.logicLevel,
              isRequired: f.isRequired,
              sortOrder: f.sortOrder,
              isActive: f.isActive,
              variants: {
                create: f.variants.map((v: any) => ({
                  variantName: v.variantName,
                  description: v.description || null,
                  price: v.price,
                  sortOrder: v.sortOrder
                }))
              }
            }))
          }
        }
      });
    }

    return NextResponse.json({ success: true, message: "Data seeded successfully." });
  } catch (error) {
    console.error("Failed to seed data:", error);
    return NextResponse.json(
      { error: "Failed to seed data" },
      { status: 500 }
    );
  }
}
