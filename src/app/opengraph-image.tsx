import { ImageResponse } from 'next/og';

export const alt = 'LOOP - Premium Web Development Agency';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#020617',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, Arial, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle gradient overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(99,102,241,0.12) 0%, rgba(147,51,234,0.06) 40%, transparent 70%)',
          }}
        />

        {/* Top decorative line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'linear-gradient(90deg, transparent, #6366F1, #9333EA, transparent)',
          }}
        />

        {/* LOOP text - large and bold with gradient */}
        <div
          style={{
            fontSize: 128,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #9333EA 100%)',
            backgroundClip: 'text',
            color: 'transparent',
            lineHeight: 1,
            marginBottom: 24,
            display: 'flex',
          }}
        >
          LOOP
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 32,
            fontWeight: 400,
            color: '#94A3B8',
            letterSpacing: '0.08em',
            textTransform: 'uppercase' as const,
            display: 'flex',
          }}
        >
          Premium Web Development Agency
        </div>

        {/* Decorative bottom accent */}
        <div
          style={{
            position: 'absolute',
            bottom: 48,
            display: 'flex',
            gap: 8,
          }}
        >
          <div
            style={{
              width: 48,
              height: 3,
              borderRadius: 2,
              background: '#6366F1',
              display: 'flex',
            }}
          />
          <div
            style={{
              width: 48,
              height: 3,
              borderRadius: 2,
              background: '#8B5CF6',
              display: 'flex',
            }}
          />
          <div
            style={{
              width: 48,
              height: 3,
              borderRadius: 2,
              background: '#9333EA',
              display: 'flex',
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
