/**
 * Seed 4 website packages via admin API (authenticated as admin@loop.vn)
 * Run: node seed-api.js
 */
const BASE = "http://localhost:3000";
const EMAIL = "admin@loop.vn";
const PASSWORD = "admin123";

async function seedPackages() {
  // 1. Login
  const login = await fetch(`${BASE}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!login.ok) { console.error("Login failed", login.status); process.exit(1); }
  const { data: user } = await login.json();
  console.log("Logged in as", user?.email);

  const token = user?.token || user?.accessToken;
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const packages = [
    {
      slug: "landing", title: "Landing Page", titleVi: "Landing Page",
      shortDesc: "Chiến dịch Marketing, giới thiệu cá nhân, offline. Phù hợp landing page, trang giới thiệu cá nhân, sản phẩm đơn lẻ.",
      shortDescVi: "Chiến dịch Marketing, giới thiệu cá nhân, offline. Phù hợp landing page, trang giới thiệu cá nhân, sản phẩm đơn lẻ.",
      type: "website", price: 1890000, priceText: "1.89 triệu",
      features: ["Giao diện Hiện đại Responsive","Tối ưu Trải nghiệm UI/UX","Hỗ trợ chỉnh sửa sau bàn giao","Trang giới thiệu SP/Dịch vụ","Admin quản lý bài viết","Form thu thập dữ liệu KH","Quản lý tệp KH cơ bản","Tối ưu SEO On-page"],
      tagline: "Chiến dịch Marketing giới thiệu cá nhân offline", taglineVi: "Chiến dịch Marketing giới thiệu cá nhân offline",
      color: "#6EB1A8", pages: "8", pagesVi: "8", marketPrice: 2500000,
      isPopular: false, isActive: true, sortOrder: 1,
    },
    {
      slug: "ban-hang", title: "Bán Hàng Cơ Bản", titleVi: "Bán Hàng Cơ Bản",
      shortDesc: "Shop online nhỏ và vừa, bắt đầu chuyển đổi số. Phù hợp cửa hàng online, boutique, dịch vụ nhỏ.",
      shortDescVi: "Shop online nhỏ và vừa, bắt đầu chuyển đổi số. Phù hợp cửa hàng online, boutique, dịch vụ nhỏ.",
      type: "website", price: 3890000, priceText: "3.89 triệu",
      features: ["Bao gồm mọi tính năng Landing Page","Danh mục và Chi tiết sản phẩm","Chức năng Giỏ hàng thông minh","Thống kê đơn hàng và Doanh thu","Tài khoản Admin và Khách hàng","Tặng 5 trang nội dung miễn phí"],
      tagline: "Shop online nhỏ và vừa, bắt đầu chuyển đổi số", taglineVi: "Shop online nhỏ và vừa, bắt đầu chuyển đổi số",
      color: "#3B82F6", pages: "8", pagesVi: "8", marketPrice: 5500000,
      isPopular: true, isActive: true, sortOrder: 2,
    },
    {
      slug: "doanh-nghiep", title: "Quản Trị Doanh Nghiệp", titleVi: "Quản Trị Doanh Nghiệp",
      shortDesc: "Doanh nghiệp vừa và lớn, hệ thống bán hàng quy mô lớn. Phù hợp doanh nghiệp vừa và lớn, cần quản lý phức tạp.",
      shortDescVi: "Doanh nghiệp vừa và lớn, hệ thống bán hàng quy mô lớn. Phù hợp doanh nghiệp vừa và lớn, cần quản lý phức tạp.",
      type: "website", price: 5890000, priceText: "5.89 triệu",
      features: ["Bao gồm mọi tính năng Bán Hàng","Giỏ hàng đa dịch vụ/sản phẩm","Sản phẩm nâng cao size màu thuộc tính","Hệ thống Mã giảm giá Flash sale","Tích điểm và Đổi quà thành viên","Bộ lọc và Tìm kiếm AI thông minh","Quản lý Kho hàng và Nhà cung cấp"],
      tagline: "Doanh nghiệp vừa và lớn, quản lý phức tạp", taglineVi: "Doanh nghiệp vừa và lớn, quản lý phức tạp",
      color: "#8B5CF6", pages: "8", pagesVi: "8", marketPrice: 8900000,
      isPopular: false, isActive: true, sortOrder: 3,
    },
    {
      slug: "yeu-cau", title: "Theo Yêu Cầu", titleVi: "Theo Yêu Cầu",
      shortDesc: "Startups, nền tảng App-web có logic phức tạp. Phù hợp startup, platform, web app có yêu cầu đặc thù riêng.",
      shortDescVi: "Startups, nền tảng App-web có logic phức tạp. Phù hợp startup, platform, web app có yêu cầu đặc thù riêng.",
      type: "website", price: 7890000, priceText: "7.89 triệu",
      features: ["Bao gồm mọi tính năng Doanh Nghiệp","UI/UX Độc quyền Không mẫu","Tùy chỉnh chức năng Core System","Tích hợp Cổng thanh toán Vận chuyển","API kết nối bên thứ 3 Zalo App","Bảo mật đa lớp và Tối ưu Speed cực hạn"],
      tagline: "Startups, platform, logic đặc thù riêng", taglineVi: "Startups, platform, logic đặc thù riêng",
      color: "#EC4899", pages: "8", pagesVi: "8", marketPrice: 12000000,
      isPopular: false, isActive: true, sortOrder: 4,
    },
  ];

  for (const pkg of packages) {
    try {
      const res = await fetch(`${BASE}/api/admin/packages/web-packages`, {
        method: "POST",
        headers,
        body: JSON.stringify(pkg),
      });
      const json = await res.json();
      if (res.ok) {
        console.log(`✅ ${pkg.slug}`);
      } else {
        console.log(`❌ ${pkg.slug}: ${JSON.stringify(json)}`);
      }
    } catch(e) {
      console.log(`❌ ${pkg.slug}: ${e.message}`);
    }
  }
  console.log("Done");
}
seedPackages();
