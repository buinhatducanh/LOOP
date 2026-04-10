const fs = require('fs');
const vi = JSON.parse(fs.readFileSync('src/i18n/messages/vi.json', 'utf8'));
const en = JSON.parse(fs.readFileSync('src/i18n/messages/en.json', 'utf8'));

// AboutPage new keys
vi.AboutPage.statsProjects = 'Dự án hoàn thành';
vi.AboutPage.statsClients = 'Khách hàng';
vi.AboutPage.statsMembers = 'Thành viên';
vi.AboutPage.statsYears = 'Năm hoạt động';
vi.AboutPage.viewCaseStudies = 'Xem Case Studies';

en.AboutPage.statsProjects = 'Projects Completed';
en.AboutPage.statsClients = 'Happy Clients';
en.AboutPage.statsMembers = 'Team Members';
en.AboutPage.statsYears = 'Years Operating';
en.AboutPage.viewCaseStudies = 'View Case Studies';

// Seo keys
vi.seo = vi.seo || {};
en.seo = en.seo || {};

const seoKeys = [
  'resourcesTitle', 'resourcesDescription', 'testimonialsTitle', 'testimonialsDescription',
  'changelogTitle', 'changelogDescription', 'caseStudiesTitle', 'caseStudiesDescription',
  'faqTitle', 'faqDescription', 'mediaBookingTitle', 'mediaBookingDescription',
  'careersTitle', 'careersDescription', 'whyUsTitle', 'whyUsDescription',
  'partnersTitle', 'partnersDescription', 'consultationTitle', 'consultationDescription'
];
seoKeys.forEach(k => {
  if (!vi.seo[k]) vi.seo[k] = '';
  if (!en.seo[k]) en.seo[k] = '';
});

// ResourcesPage
vi.ResourcesPage = {
  title: 'Trung tâm kiến thức',
  description: 'Hướng dẫn chuyên sâu, checklist và case study cho doanh nghiệp Việt Nam',
  heroTitle: 'Trung tâm kiến thức',
  heroHighlight: 'LOOP Resources',
  heroDesc: 'Hướng dẫn chuyên sâu, checklist và case study giúp doanh nghiệp Việt Nam chuyển đổi số hiệu quả hơn.',
  filterAll: 'Tất cả',
  filterGuide: 'Hướng dẫn',
  filterChecklist: 'Checklist',
  filterCaseStudy: 'Case Study',
  filterTechnical: 'Kỹ thuật',
  filterVideo: 'Video',
  newsletterTitle: 'Nhận bài viết mới nhất',
  newsletterDesc: 'Đăng ký newsletter để cập nhật những bài viết chuyên sâu mới nhất.',
  newsletterPlaceholder: 'email@doanhnghiep.com',
  newsletterButton: 'Đăng ký'
};

en.ResourcesPage = {
  title: 'Resource Center',
  description: 'In-depth guides, checklists and case studies for Vietnamese businesses',
  heroTitle: 'Resource Center',
  heroHighlight: 'LOOP Resources',
  heroDesc: 'In-depth guides, checklists and case studies to help Vietnamese businesses digitize more effectively.',
  filterAll: 'All',
  filterGuide: 'Guides',
  filterChecklist: 'Checklists',
  filterCaseStudy: 'Case Studies',
  filterTechnical: 'Technical',
  filterVideo: 'Video',
  newsletterTitle: 'Get the latest articles',
  newsletterDesc: 'Subscribe to newsletter for the latest in-depth articles.',
  newsletterPlaceholder: 'email@company.com',
  newsletterButton: 'Subscribe'
};

// TestimonialsPage
vi.TestimonialsPage = {
  title: 'Khách hàng nói gì',
  description: 'Đọc review và testimonial thực tế từ khách hàng đã hợp tác với LOOP Solutions',
  heroTitle: 'Khách hàng',
  heroHighlight: 'Nói gì về chúng tôi',
  heroDesc: 'Hơn 200 doanh nghiệp đã tin tưởng LOOP Solutions — đọc câu chuyện thành công của họ.',
  filterAll: 'Tất cả',
  filterWeb: 'Website',
  filterMobile: 'Mobile App',
  filterDashboard: 'Dashboard',
  filterSeo: 'SEO',
  filterMedia: 'Media',
  filterAllServices: 'Tất cả dịh vụ'
};

en.TestimonialsPage = {
  title: 'What clients say',
  description: 'Read real reviews and testimonials from clients who have partnered with LOOP Solutions',
  heroTitle: 'What clients',
  heroHighlight: 'Say about us',
  heroDesc: 'Over 200 businesses have trusted LOOP Solutions — read their success stories.',
  filterAll: 'All',
  filterWeb: 'Website',
  filterMobile: 'Mobile App',
  filterDashboard: 'Dashboard',
  filterSeo: 'SEO',
  filterMedia: 'Media',
  filterAllServices: 'All services'
};

// ChangelogPage
vi.ChangelogPage = {
  title: 'Cập nhật sản phẩm',
  description: 'Những cập nhật mới nhất của nền tảng LOOP Solutions',
  heroTitle: 'Cập nhật',
  heroHighlight: 'Sản phẩm',
  heroDesc: 'Theo dõi những tính năng mới, cải tiến và sửa lỗi trên nền tảng LOOP Solutions.',
  filterAll: 'Tất cả',
  filterFeature: 'Tính năng mới',
  filterImprovement: 'Cải tiến',
  filterBugfix: 'Sửa lỗi',
  filterSecurity: 'Bảo mật',
  new: 'Mới',
  improved: 'Cải tiến',
  fixed: 'Đã sửa',
  security: 'Bảo mật'
};

en.ChangelogPage = {
  title: 'Product Updates',
  description: 'The latest product updates from LOOP Solutions',
  heroTitle: 'Product',
  heroHighlight: 'Updates',
  heroDesc: 'Track new features, improvements and bug fixes on the LOOP Solutions platform.',
  filterAll: 'All',
  filterFeature: 'New Features',
  filterImprovement: 'Improvements',
  filterBugfix: 'Bug Fixes',
  filterSecurity: 'Security',
  new: 'New',
  improved: 'Improved',
  fixed: 'Fixed',
  security: 'Security'
};

fs.writeFileSync('src/i18n/messages/vi.json', JSON.stringify(vi, null, 2), 'utf8');
fs.writeFileSync('src/i18n/messages/en.json', JSON.stringify(en, null, 2), 'utf8');
console.log('Done. VI keys:', Object.keys(vi).length, 'EN keys:', Object.keys(en).length);
