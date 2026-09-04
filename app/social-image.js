import { ImageResponse } from 'next/og';

export const socialImageSize = { width: 1200, height: 630 };

export function createSocialImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#070a0d',
          color: '#f4f7f5',
          padding: '72px 78px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 28, fontWeight: 800 }}>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              border: '4px solid #57e6a6',
              marginRight: 16,
            }}
          />
          RLSProof
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 980 }}>
          <div style={{ color: '#57e6a6', fontSize: 22, fontWeight: 700, letterSpacing: 2.2 }}>
            SUPABASE AUTHORIZATION RELEASE GATE
          </div>
          <div style={{ marginTop: 24, fontSize: 64, lineHeight: 1.04, fontWeight: 800, letterSpacing: -2.2 }}>
            Prove your data boundaries before release.
          </div>
          <div style={{ marginTop: 26, color: '#9aa5a1', fontSize: 28, lineHeight: 1.35 }}>
            RLS checks · tenant isolation · explicit coverage · reproducible release evidence
          </div>
        </div>

        <div style={{ display: 'flex', color: '#9aa5a1', fontSize: 20 }}>
          Deterministic checks. Missing coverage never becomes PASS.
        </div>
      </div>
    ),
    socialImageSize,
  );
}
