import { ImageResponse } from 'next/og';

export const alt = 'LOOP - Thiet ke Website & Ung dung chuyen nghiep';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #020617 0%, #0F172A 50%, #1E293B 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, Arial, sans-serif',
          position: 'relative',
        }}
      >
        {/* Decorative gradient orbs */}
        <div
          style={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -100,
            left: -100,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)',
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 80,
            height: 80,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
            marginBottom: 32,
            fontSize: 48,
            fontWeight: 700,
            color: 'white',
          }}
        >
          L
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
            backgroundClip: 'text',
            color: 'transparent',
            marginBottom: 16,
          }}
        >
          LOOP
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 28,
            color: '#94A3B8',
            textAlign: 'center',
            maxWidth: 800,
          }}
        >
          Thiet ke Website & Ung dung chuyen nghiep
        </div>

        {/* Tags */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            marginTop: 40,
          }}
        >
          {['Web Design', 'Mobile App', 'SEO', 'E-commerce'].map((tag) => (
            <div
              key={tag}
              style={{
                padding: '8px 20px',
                borderRadius: 24,
                border: '1px solid rgba(99,102,241,0.4)',
                color: '#818CF8',
                fontSize: 18,
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
