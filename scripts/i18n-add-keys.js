const fs = require("fs");

const vi = JSON.parse(fs.readFileSync("src/i18n/messages/vi.json", "utf8"));
const en = JSON.parse(fs.readFileSync("src/i18n/messages/en.json", "utf8"));

// ── Search (SiteHeader) ──────────────────────────────────────────────────────
if (!vi.search) vi.search = {};
vi.search.searchPlaceholder = "Tìm kiếm dịch vụ, khóa học...";
vi.search.noResults = 'Không tìm thấy kết quả cho "{query}"';
vi.search.emptyResultCta = "Liên hệ để được tư vấn →";
vi.search.suggestions = "GỢI Ý TÌM KIẾM";
vi.search.toggleSoundOn = "Bật âm thanh";
vi.search.toggleSoundOff = "Tắt âm thanh";
vi.search.roleGuest = "Khách";

if (!en.search) en.search = {};
en.search.searchPlaceholder = "Search services, courses...";
en.search.noResults = 'No results for "{query}"';
en.search.emptyResultCta = "Contact us for consultation →";
en.search.suggestions = "SEARCH SUGGESTIONS";
en.search.toggleSoundOn = "Sound on";
en.search.toggleSoundOff = "Sound off";
en.search.roleGuest = "Guest";

// ── MediaClient ────────────────────────────────────────────────────────────────
if (!vi.mediaClient) vi.mediaClient = {};
vi.mediaClient.heroTitle = "SẢN PHẨM MEDIA";
vi.mediaClient.heroDesc = "{n} sản phẩm media đã hoàn thành — từ chụp ảnh sự kiện đến video doanh nghiệp.";
vi.mediaClient.heroDescEmpty = "Những sản phẩm media chất lượng cao từ đội ngũ LOOP Production.";
vi.mediaClient.emptyTitle = "Chưa có sản phẩm media nào";
vi.mediaClient.emptyDesc = "Các sản phẩm sẽ xuất hiện tại đây sau khi hoàn thành.";
vi.mediaClient.viewProduct = "XEM SẢN PHẨM →";
vi.mediaClient.ctaTitle = "Bạn cần dịch vụ media chuyên nghiệp cho doanh nghiệp?";
vi.mediaClient.ctaBtn = "Đặt dịch vụ media";
vi.mediaClient.openOriginal = "Mở file gốc";
vi.mediaClient.close = "Đóng";
vi.mediaClient.badgeEvent = "Sự kiện";
vi.mediaClient.badgeProduct = "Sản phẩm";
vi.mediaClient.badgeCorporate = "Doanh nghiệp";
vi.mediaClient.badgeSocial = "Mạng xã hội";
vi.mediaClient.badgeCustom = "Tùy chỉnh";
vi.mediaClient.files = "{n} files";
vi.mediaClient.file = "1 file";

if (!en.mediaClient) en.mediaClient = {};
en.mediaClient.heroTitle = "MEDIA PORTFOLIO";
en.mediaClient.heroDesc = "{n} completed media products — from event photography to corporate video.";
en.mediaClient.heroDescEmpty = "High-quality media products from the LOOP Production team.";
en.mediaClient.emptyTitle = "No media products yet";
en.mediaClient.emptyDesc = "Products will appear here once completed.";
en.mediaClient.viewProduct = "VIEW PRODUCTS →";
en.mediaClient.ctaTitle = "Need professional media services for your business?";
en.mediaClient.ctaBtn = "Book media services";
en.mediaClient.openOriginal = "Open original file";
en.mediaClient.close = "Close";
en.mediaClient.badgeEvent = "Event";
en.mediaClient.badgeProduct = "Product";
en.mediaClient.badgeCorporate = "Corporate";
en.mediaClient.badgeSocial = "Social Media";
en.mediaClient.badgeCustom = "Custom";
en.mediaClient.files = "{n} files";
en.mediaClient.file = "1 file";

// ── PortfolioClient ───────────────────────────────────────────────────────────
if (!vi.portfolio) vi.portfolio = {};
vi.portfolio.heroTitle = "DỰ ÁN ĐÃ THỰC HIỆN";
vi.portfolio.heroDesc = "120+ dự án thành công. Từ startup nhỏ đến enterprise lớn — mỗi dự án đều là một câu chuyện tăng trưởng.";
vi.portfolio.viewDetails = "XEM CHI TIẾT →";
vi.portfolio.emptyState = "Chưa có dự án phù hợp danh mục này.";
vi.portfolio.ctaTitle = "Bạn muốn website có hiệu quả tương tự?";
vi.portfolio.ctaBtn = "Tư vấn miễn phí";
vi.portfolio.categoryDefault = "Dự án";

if (!en.portfolio) en.portfolio = {};
en.portfolio.heroTitle = "COMPLETED PROJECTS";
en.portfolio.heroDesc = "120+ successful projects. From small startups to enterprise — each project is a growth story.";
en.portfolio.viewDetails = "VIEW DETAILS →";
en.portfolio.emptyState = "No projects found for this category.";
en.portfolio.ctaTitle = "Want a similar website for your business?";
en.portfolio.ctaBtn = "Free consultation";
en.portfolio.categoryDefault = "Project";

// ── Leaderboard (bang-xep-hang) ─────────────────────────────────────────────────
if (!vi.leaderboard) vi.leaderboard = {};
vi.leaderboard.heroTitle = "BẢNG XẾP HẠNG LP";
vi.leaderboard.heroDesc = "Hành trình từ Iron đến Diamond — tích lũy LP qua mỗi dự án, nhiệm vụ và sự kiện.";
vi.leaderboard.statTotalLp = "Tổng LP đã phát hành";
vi.leaderboard.statTasks = "Tổng nhiệm vụ hoàn thành";
vi.leaderboard.statMembers = "Thành viên tích cực";
vi.leaderboard.statWeek = "Tuần của Season III";
vi.leaderboard.topLabel = "TOP 3 · HUYỀN THOẠI SEASON III";
vi.leaderboard.seasonBadge = "ĐANG DIỄN RA";
vi.leaderboard.youBadge = "BẠN";
vi.leaderboard.memberCount = "thành viên";
vi.leaderboard.avgLp = "LP trung bình";
vi.leaderboard.filterAll = "Tất cả";
vi.leaderboard.filterAlpha = "Alpha";
vi.leaderboard.filterSigma = "Sigma";
vi.leaderboard.filterOmega = "Omega";
vi.leaderboard.myRank = "VỊ TRÍ CỦA BẠN · SEASON III";
vi.leaderboard.rankDist = "PHÂN PHỐI RANK";
vi.leaderboard.lpTop10 = "LP TOP 10 THÀNH VIÊN";
vi.leaderboard.teamSummary = "TỔNG QUAN THEO NHÓM";
vi.leaderboard.searchPlaceholder = "Tìm thành viên...";
vi.leaderboard.rankListTitle = "BẢNG XẾP HẠNG · {n} THÀNH VIÊN";
vi.leaderboard.sortBy = "Sắp xếp theo";
vi.leaderboard.emptySearch = "Không tìm thành viên phù hợp";
vi.leaderboard.ctaTitle = "THAM GIA LOOP — LEO BẢNG XẾP HẠNG";
vi.leaderboard.ctaDesc = "Tích lũy LP qua mỗi dự án, nhiệm vụ và sự kiện. Thăng hạng từ Iron đến Diamond.";
vi.leaderboard.ctaBtnJoin = "Tham gia ngay";
vi.leaderboard.ctaBtnLogin = "Đăng nhập";
vi.leaderboard.sectionMembers = "THÀNH VIÊN";

if (!en.leaderboard) en.leaderboard = {};
en.leaderboard.heroTitle = "LP LEADERBOARD";
en.leaderboard.heroDesc = "Journey from Iron to Diamond — earn LP through projects, quests, and events.";
en.leaderboard.statTotalLp = "Total LP Issued";
en.leaderboard.statTasks = "Total Tasks Completed";
en.leaderboard.statMembers = "Active Members";
en.leaderboard.statWeek = "Season III Week";
en.leaderboard.topLabel = "TOP 3 · SEASON III LEGENDS";
en.leaderboard.seasonBadge = "ACTIVE";
en.leaderboard.youBadge = "YOU";
en.leaderboard.memberCount = "members";
en.leaderboard.avgLp = "Avg LP";
en.leaderboard.filterAll = "All";
en.leaderboard.filterAlpha = "Alpha";
en.leaderboard.filterSigma = "Sigma";
en.leaderboard.filterOmega = "Omega";
en.leaderboard.myRank = "YOUR RANK · SEASON III";
en.leaderboard.rankDist = "RANK DISTRIBUTION";
en.leaderboard.lpTop10 = "TOP 10 LP MEMBERS";
en.leaderboard.teamSummary = "TEAM OVERVIEW";
en.leaderboard.searchPlaceholder = "Search members...";
en.leaderboard.rankListTitle = "LEADERBOARD · {n} MEMBERS";
en.leaderboard.sortBy = "Sort by";
en.leaderboard.emptySearch = "No matching members found";
en.leaderboard.ctaTitle = "JOIN LOOP — CLIMB THE LEADERBOARD";
en.leaderboard.ctaDesc = "Earn LP through projects, quests, and events. Rank up from Iron to Diamond.";
en.leaderboard.ctaBtnJoin = "Join now";
en.leaderboard.ctaBtnLogin = "Login";
en.leaderboard.sectionMembers = "MEMBERS";

// ── Auth / Dang Nhap ────────────────────────────────────────────────────────────
if (!vi.auth) vi.auth = {};
vi.auth.heroTitle1 = "Xây dựng";
vi.auth.heroTitle2 = "Tương lai số";
vi.auth.heroDesc = "Hệ điều hành số dành cho Digital Agency.";
vi.auth.loginTitle = "Đăng nhập";
vi.auth.loginSubtitle = "Chào mừng bạn quay trở lại";
vi.auth.registerTitle = "Đăng ký tài khoản";
vi.auth.registerSubtitle = "Tạo tài khoản để bắt đầu";
vi.auth.emailLabel = "Email";
vi.auth.emailPlaceholder = "email@company.vn";
vi.auth.passwordLabel = "Mật khẩu";
vi.auth.passwordPlaceholder = "Nhập mật khẩu";
vi.auth.passwordMinChars = "Tối thiểu 8 ký tự";
vi.auth.nameLabel = "Họ và tên";
vi.auth.namePlaceholder = "Nguyễn Văn A";
vi.auth.companyLabel = "Công ty";
vi.auth.companyPlaceholder = "Công ty TNHH ABC";
vi.auth.btnLogin = "Đăng nhập";
vi.auth.btnRegister = "Đăng ký";
vi.auth.btnSubmit = "Tiếp tục";
vi.auth.forgotPassword = "Quên mật khẩu?";
vi.auth.noAccount = "Chưa có tài khoản?";
vi.auth.hasAccount = "Đã có tài khoản?";
vi.auth.backHome = "Quay lại trang chủ";
vi.auth.orContinue = "Hoặc tiếp tục với";
vi.auth.otpTitle = "Xác minh email";
vi.auth.otpSent = "Mã OTP đã gửi đến";
vi.auth.otpResend = "Gửi lại mã";
vi.auth.otpResendIn = "Gửi lại sau {n} giây";
vi.auth.placeholderPassword = "••••••••";

if (!en.auth) en.auth = {};
en.auth.heroTitle1 = "Building";
en.auth.heroTitle2 = "Digital Future";
en.auth.heroDesc = "The digital operating system for Digital Agencies.";
en.auth.loginTitle = "Login";
en.auth.loginSubtitle = "Welcome back";
en.auth.registerTitle = "Create account";
en.auth.registerSubtitle = "Create an account to get started";
en.auth.emailLabel = "Email";
en.auth.emailPlaceholder = "email@company.vn";
en.auth.passwordLabel = "Password";
en.auth.passwordPlaceholder = "Enter password";
en.auth.passwordMinChars = "Minimum 8 characters";
en.auth.nameLabel = "Full name";
en.auth.namePlaceholder = "John Doe";
en.auth.companyLabel = "Company";
en.auth.companyPlaceholder = "ABC Corp";
en.auth.btnLogin = "Login";
en.auth.btnRegister = "Register";
en.auth.btnSubmit = "Continue";
en.auth.forgotPassword = "Forgot password?";
en.auth.noAccount = "Don't have an account?";
en.auth.hasAccount = "Already have an account?";
en.auth.backHome = "Back to home";
en.auth.orContinue = "Or continue with";
en.auth.otpTitle = "Verify email";
en.auth.otpSent = "OTP code sent to";
en.auth.otpResend = "Resend code";
en.auth.otpResendIn = "Resend in {n}s";
en.auth.placeholderPassword = "••••••••";

// ── Customer Portal / Khach Hang ───────────────────────────────────────────────
if (!vi.customer) vi.customer = {};
if (!en.customer) en.customer = {};

const CUSTOMER_KEYS = [
  "statusPending_payment","statusPaid","statusIn_progress","statusDemo_ready","statusClient_review","statusDone","statusCancelled",
  "statusConfirmed","statusInProgress","statusDelivered","statusApproved","statusRejected",
  "kpiActiveOrders","kpiTotalOrders",
  "tabOverview","tabProjects","tabCourses","tabInvoices","tabWallet","tabReferral","tabSupport","tabSettings",
  "orderServiceDefault",
  "emptyOrders","emptyProjects","emptyCourses","emptyTransactions",
  "progress","completed",
  "coursesHeading","coursesEmptyDesc",
  "walletBalance","walletTotalEarned","walletTotalSpent","walletHistory",
  "supportHeading","supportDesc","supportEmail","supportHotline","supportZalo",
  "referralHeading","referralDesc","referralBtn",
  "invoicesPlaceholder","settingsPlaceholder",
  "loadingState",
  "projectsActive","projectsCompleted","projectsEmpty",
];

const customerVI = {
  statusPending_payment: "Chờ thanh toán", statusPaid: "Đã thanh toán",
  statusIn_progress: "Đang thực hiện", statusDemo_ready: "Demo sẵn sàng",
  statusClient_review: "Khách hàng review", statusDone: "Hoàn thành",
  statusCancelled: "Đã hủy", statusConfirmed: "Đã xác nhận",
  statusInProgress: "Đang thực hiện", statusDelivered: "Đã bàn giao",
  statusApproved: "Đã duyệt", statusRejected: "Từ chối",
  kpiActiveOrders: "Đơn đang hoạt động", kpiTotalOrders: "Tổng đơn hàng",
  tabOverview: "Tổng quan", tabProjects: "Dự án", tabCourses: "Khóa học",
  tabInvoices: "Hóa đơn", tabWallet: "Ví LP", tabReferral: "Giới thiệu",
  tabSupport: "Hỗ trợ", tabSettings: "Cài đặt",
  orderServiceDefault: "Dịch vụ LOOP",
  emptyOrders: "Chưa có đơn hàng nào", emptyProjects: "Chưa có dự án nào",
  emptyCourses: "Chưa có khóa học", emptyTransactions: "Chưa có giao dịch nào",
  progress: "Tiến độ", completed: "Hoàn thành",
  coursesHeading: "Khóa học của bạn",
  coursesEmptyDesc: "Đăng ký khóa học tại LOOP Academy để bắt đầu học.",
  walletBalance: "SỐ DƯ LP", walletTotalEarned: "TỔNG TÍCH LŨY", walletTotalSpent: "ĐÃ DÙNG", walletHistory: "Lịch sử giao dịch",
  supportHeading: "Liên hệ hỗ trợ",
  supportDesc: "Đội ngũ LOOP luôn sẵn sàng hỗ trợ bạn 24/7.",
  supportEmail: "Email", supportHotline: "Hotline", supportZalo: "Zalo",
  referralHeading: "Giới thiệu bạn bè",
  referralDesc: "Giới thiệu khách hàng mới, nhận LP cho mỗi khách thành công!",
  referralBtn: "Sao chép link giới thiệu",
  invoicesPlaceholder: "Hóa đơn sẽ được cập nhật sớm",
  settingsPlaceholder: "Cài đặt tài khoản sẽ được cập nhật sớm",
  loadingState: "Đang tải...",
  projectsActive: "Dự án đang thực hiện", projectsCompleted: "Hoàn thành",
  projectsEmpty: "Chưa có dự án nào",
};

const customerEN = {
  statusPending_payment: "Pending Payment", statusPaid: "Paid",
  statusIn_progress: "In Progress", statusDemo_ready: "Demo Ready",
  statusClient_review: "Client Review", statusDone: "Completed",
  statusCancelled: "Cancelled", statusConfirmed: "Confirmed",
  statusInProgress: "In Progress", statusDelivered: "Delivered",
  statusApproved: "Approved", statusRejected: "Rejected",
  kpiActiveOrders: "Active Orders", kpiTotalOrders: "Total Orders",
  tabOverview: "Overview", tabProjects: "Projects", tabCourses: "Courses",
  tabInvoices: "Invoices", tabWallet: "LP Wallet", tabReferral: "Referral",
  tabSupport: "Support", tabSettings: "Settings",
  orderServiceDefault: "LOOP Service",
  emptyOrders: "No orders yet", emptyProjects: "No projects yet",
  emptyCourses: "No courses yet", emptyTransactions: "No transactions yet",
  progress: "Progress", completed: "Completed",
  coursesHeading: "Your Courses",
  coursesEmptyDesc: "Enroll at LOOP Academy to start learning.",
  walletBalance: "LP BALANCE", walletTotalEarned: "TOTAL EARNED", walletTotalSpent: "TOTAL SPENT", walletHistory: "Transaction History",
  supportHeading: "Contact Support",
  supportDesc: "The LOOP team is available 24/7 to assist you.",
  supportEmail: "Email", supportHotline: "Hotline", supportZalo: "Zalo",
  referralHeading: "Refer Friends",
  referralDesc: "Refer new customers, earn LP for each successful referral!",
  referralBtn: "Copy referral link",
  invoicesPlaceholder: "Invoices will be updated soon",
  settingsPlaceholder: "Account settings will be updated soon",
  loadingState: "Loading...",
  projectsActive: "Active Projects", projectsCompleted: "Completed",
  projectsEmpty: "No projects yet",
};

Object.assign(vi.customer, customerVI);
Object.assign(en.customer, customerEN);

// ── Onboarding ────────────────────────────────────────────────────────────────
if (!vi.onboarding) vi.onboarding = {};
if (!en.onboarding) en.onboarding = {};

const onboardingVI = {
  welcomeBadge: "CHÀO MỪNG ĐẾN VỚI", welcomeTitle: "LOOP SOLUTIONS",
  welcomeDesc: "Hệ điều hành số dành cho Digital Agency — quản lý dự án, thăng hạng LP, và học tập tại một nền tảng.",
  scrollHint: "NHẤN TIẾP TỤC ĐỂ KHÁM PHÁ",
  aboutBadge: "VỀ CHÚNG TÔI", aboutTitle: "LOOP SOLUTIONS LÀ AI?",
  aboutDesc1: "LOOP Solutions là đối tác công nghệ tin cậy của doanh nghiệp Việt Nam. Chúng tôi thiết kế, phát triển và vận hành giải pháp số toàn diện — từ website đến hệ thống quản lý nội bộ.",
  aboutDesc2: "Hệ điều hành số dành cho Digital Agency.",
  pillar1Title: "Uy tín", pillar1Desc: "7+ năm kinh nghiệm triển khai thực tế.",
  pillar2Title: "Tốc độ", pillar2Desc: "Giao sản phẩm nhanh, tối ưu chi phí.",
  pillar3Title: "Chất lượng", pillar3Desc: "Thiết kế theo chuẩn quốc tế.",
  servicesBadge: "DỊCH VỤ CHÍNH", servicesTitle: "GIẢI PHÁP TOÀN DIỆN",
  service1: "Thiết kế Website", service2: "Phát triển App & SaaS",
  service3: "Dashboard & Analytics", service4: "SEO & Digital Marketing",
  growthBadge: "SỐ LIỆU TĂNG TRƯỞNG", growthTitle: "TẠI SAO CHỌN LOOP?",
  growthStat1: "Dự án hoàn thành", growthStat2: "Khách hàng hài lòng",
  growthStat3: "Đối tác tin cậy", growthStat4: "Tăng trưởng 2025",
  growthChartLabel: "BIỂU ĐỒ TĂNG TRƯỞNG KHÁCH HÀNG 2025",
  growthReasonsLabel: "LÝ DO ĐỒNG HÀNH CÙNG LOOP",
  rankIron: "Sắt", rankBronze: "Đồng", rankSilver: "Bạc",
  rankGold: "Vàng", rankPlatinum: "Bạch Kim", rankRuby: "Hồng Ngọc", rankDiamond: "Kim Cương",
  actionExplore: "Khám phá Dịch vụ", actionBook: "Đặt lịch Tư vấn",
  actionPortfolio: "Xem Portfolio", actionTeam: "Gặp đội ngũ",
  lpBadge: "HỆ THỐNG LP & THĂNG HẠNG", lpTitle: "TÍCH LŨY — THĂNG HẠNG — NHẬN THƯỞNG",
  lpDesc: "LP (Loop Points) là điểm thưởng nội bộ. Tích lũy qua dự án, nhiệm vụ và sự kiện. Đổi giảm giá dịch vụ, khóa học và quà tặng nội bộ.",
  ctaJoin: "BẮT ĐẦU KHÁM PHÁ",
  skipHint: "Bạn có thể xem lại hướng dẫn này bất kỳ lúc nào",
  slideWelcome: "Chào mừng", slideAbout: "Về chúng tôi", slideServices: "Dịch vụ",
  slideGrowth: "Tăng trưởng", slideGetStarted: "Bắt đầu",
  btnBack: "Quay lại", btnNext: "Tiếp tục", btnSkip: "Bỏ qua →", btnSkipTop: "BỎ QUA",
};

const onboardingEN = {
  welcomeBadge: "WELCOME TO", welcomeTitle: "LOOP SOLUTIONS",
  welcomeDesc: "The digital operating system for Digital Agencies — manage projects, rank up with LP, and learn on one platform.",
  scrollHint: "PRESS NEXT TO EXPLORE",
  aboutBadge: "ABOUT US", aboutTitle: "WHO IS LOOP SOLUTIONS?",
  aboutDesc1: "LOOP Solutions is Vietnam's trusted tech partner. We design, develop, and operate comprehensive digital solutions — from websites to internal management systems.",
  aboutDesc2: "The digital operating system for Digital Agencies.",
  pillar1Title: "Reputation", pillar1Desc: "7+ years of real-world implementation.",
  pillar2Title: "Speed", pillar2Desc: "Fast delivery, optimized costs.",
  pillar3Title: "Quality", pillar3Desc: "International-standard design.",
  servicesBadge: "CORE SERVICES", servicesTitle: "COMPREHENSIVE SOLUTIONS",
  service1: "Website Design", service2: "App & SaaS Development",
  service3: "Dashboard & Analytics", service4: "SEO & Digital Marketing",
  growthBadge: "GROWTH METRICS", growthTitle: "WHY CHOOSE LOOP?",
  growthStat1: "Projects Completed", growthStat2: "Happy Clients",
  growthStat3: "Trusted Partners", growthStat4: "Growth 2025",
  growthChartLabel: "CUSTOMER GROWTH CHART 2025",
  growthReasonsLabel: "REASONS TO PARTNER WITH LOOP",
  rankIron: "Iron", rankBronze: "Bronze", rankSilver: "Silver",
  rankGold: "Gold", rankPlatinum: "Platinum", rankRuby: "Ruby", rankDiamond: "Diamond",
  actionExplore: "Explore Services", actionBook: "Book Consultation",
  actionPortfolio: "View Portfolio", actionTeam: "Meet the Team",
  lpBadge: "LP & RANKING SYSTEM", lpTitle: "EARN — RANK UP — GET REWARDED",
  lpDesc: "LP (Loop Points) is an internal reward system. Earn through projects, quests, and events. Redeem for service discounts, courses, and internal gifts.",
  ctaJoin: "START EXPLORING",
  skipHint: "You can revisit this guide anytime",
  slideWelcome: "Welcome", slideAbout: "About Us", slideServices: "Services",
  slideGrowth: "Growth", slideGetStarted: "Get Started",
  btnBack: "Back", btnNext: "Next", btnSkip: "Skip →", btnSkipTop: "SKIP",
};

Object.assign(vi.onboarding, onboardingVI);
Object.assign(en.onboarding, onboardingEN);

// ── Footer ─────────────────────────────────────────────────────────────────────
if (!vi.footer) vi.footer = {};
if (!en.footer) en.footer = {};
vi.footer.ctaBadge = "BẮT ĐẦU HÀNH TRÌNH";
en.footer.ctaBadge = "START YOUR JOURNEY";

// ── Team member slug ────────────────────────────────────────────────────────────
if (!vi.teamMember) vi.teamMember = {};
if (!en.teamMember) en.teamMember = {};
vi.teamMember.tChallenge = "Thách thức";
vi.teamMember.tSolution = "Giải pháp";
vi.teamMember.tResult = "Kết quả";
en.teamMember.tChallenge = "Challenge";
en.teamMember.tSolution = "Solution";
en.teamMember.tResult = "Result";

// Write back
fs.writeFileSync("src/i18n/messages/vi.json", JSON.stringify(vi, null, 2));
fs.writeFileSync("src/i18n/messages/en.json", JSON.stringify(en, null, 2));
console.log("Done! All keys added to vi.json and en.json");