/**
 * SEO Structured Data — Team Page
 * Outputs JSON-LD for: Organization, FAQPage, BreadcrumbList
 */

import type { Member } from '../components/team/memberData';
import type { RankKey } from '../components/team/memberData';

// ── Rank tier label helper ─────────────────────────────────────────────
const RANK_LABELS: Record<RankKey, string> = {
  iron: 'Iron',
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
  ruby: 'Ruby',
  diamond: 'Diamond',
};

// ── Organization Schema ──────────────────────────────────────────────
export function buildTeamOrganizationJsonLd(members: Member[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'LOOP Solutions',
    alternateName: 'LOOP',
    url: 'https://loops.vn',
    logo: 'https://loops.vn/logo.png',
    description:
      'LOOP Solutions — Đội ngũ kỹ thuật số chuyên phát triển Web, App/SaaS, Dashboard, SEO. 27 thành viên với hệ thống rank từ Iron đến Diamond, minh bạch và công bằng.',
    foundingDate: '2022',
    areaServed: { '@type': 'Country', name: 'Vietnam' },
    knowsAbout: [
      'Web Development',
      'Mobile App Development',
      'SaaS Product Development',
      'SEO Optimization',
      'UI/UX Design',
      'Digital Marketing',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'contact@loops.vn',
      url: 'https://loops.vn/lien-he',
    },
    sameAs: [
      'https://loops.vn',
    ],
    member: members.map((m) => ({
      '@type': 'Person',
      name: m.name,
      jobTitle: m.role,
      description: m.bio || m.shortBio || '',
      image: m.img || undefined,
      url: `https://loops.vn/member/${m.id}`,
      memberOf: {
        '@type': 'Organization',
        name: 'LOOP Solutions',
        url: 'https://loops.vn',
      },
      ...(m.achievements.length > 0 && {
        award: m.achievements.map((a) => ({
          '@type': 'Award',
          name: a,
          awardedBy: {
            '@type': 'Organization',
            name: 'LOOP Solutions',
          },
        })),
      }),
      ...(Object.keys(m.skills).length > 0 && {
        knowsAbout: Object.keys(m.skills),
      }),
      additionalProperty: [
        { '@type': 'PropertyValue', name: 'rank', value: RANK_LABELS[m.rank] },
        { '@type': 'PropertyValue', name: 'level', value: m.level },
        {
          '@type': 'PropertyValue',
          name: 'lpBalance',
          value: m.lpBalance,
          unitCode: 'LP',
        },
        { '@type': 'PropertyValue', name: 'missions', value: m.missions },
        { '@type': 'PropertyValue', name: 'department', value: m.team },
      ],
    })),
  };
}

// ── FAQ Schema ────────────────────────────────────────────────────────
export function buildTeamFAQJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'LOOP Solutions có bao nhiêu thành viên?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'LOOP Solutions hiện có 27 thành viên với hệ thống rank từ Iron đến Diamond. Mỗi thành viên được xếp hạng dựa trên LP (LOOP Points) tích lũy từ công việc và thành tựu.',
        },
      },
      {
        '@type': 'Question',
        name: 'Hệ thống rank hoạt động như thế nào?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Thành viên được xếp rank từ Iron (Lv.1–14) → Bronze (Lv.15–34) → Silver (Lv.35–54) → Gold (Lv.55–74) → Platinum (Lv.75–84) → Ruby (Lv.85–94) → Diamond (Lv.95+). Rank thăng tiến bằng LP tích lũy từ hoàn thành task, dự án, khóa học và sự kiện.',
        },
      },
      {
        '@type': 'Question',
        name: 'LP là gì và dùng để làm gì?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'LP (LOOP Points) là điểm thưởng nội bộ. Thành viên kiếm LP từ hoàn thành task, quest, khóa học. LP dùng để đổi giảm giá dịch vụ (tối đa 20%), mua khóa học, hoặc đổi thưởng nội bộ.',
        },
      },
      {
        '@type': 'Question',
        name: 'LOOP Solutions có những dịch vụ gì?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'LOOP Solutions cung cấp 4 dịch vụ chính: Web Development (thiết kế và phát triển website), App/SaaS Development (phát triển ứng dụng và sản phẩm SaaS), Dashboard & Analytics (bảng điều khiển dữ liệu), và SEO & Content Marketing.',
        },
      },
      {
        '@type': 'Question',
        name: 'Có thể đặt lịch tư vấn với đội ngũ không?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Có, bạn có thể đặt lịch tư vấn miễn phí qua trang /dat-lich hoặc liên hệ trực tiếp tại loops.vn. Đội ngũ sẽ phản hồi trong 24 giờ.',
        },
      },
    ],
  };
}

// ── BreadcrumbList Schema ─────────────────────────────────────────────
export function buildTeamBreadcrumbJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Trang chủ',
        item: 'https://loops.vn/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Đội ngũ',
        item: 'https://loops.vn/doi-ngu',
      },
    ],
  };
}

// ── AboutPage Schema (for individual member detail) ────────────────────
export function buildMemberPersonJsonLd(member: Member) {
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    mainEntity: {
      '@type': 'Person',
      name: member.name,
      jobTitle: member.role,
      description: member.bio || member.shortBio || '',
      image: member.img || undefined,
      url: `https://loops.vn/member/${member.id}`,
      memberOf: {
        '@type': 'Organization',
        name: 'LOOP Solutions',
        url: 'https://loops.vn',
      },
      additionalProperty: [
        { '@type': 'PropertyValue', name: 'rank', value: RANK_LABELS[member.rank] },
        { '@type': 'PropertyValue', name: 'level', value: member.level },
        {
          '@type': 'PropertyValue',
          name: 'lpBalance',
          value: member.lpBalance,
          unitCode: 'LP',
        },
        { '@type': 'PropertyValue', name: 'missionsCompleted', value: member.missions },
        { '@type': 'PropertyValue', name: 'department', value: member.team },
      ],
      ...(member.achievements.length > 0 && {
        award: member.achievements.map((a) => ({
          '@type': 'Award',
          name: a,
          awardedBy: { '@type': 'Organization', name: 'LOOP Solutions' },
        })),
      }),
    },
  };
}
