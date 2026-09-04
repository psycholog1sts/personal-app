import { ImageResponse } from 'next/og';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 14,
          background: '#070a0d',
          border: '4px solid #57e6a6',
          color: '#f4f7f5',
          fontFamily: 'sans-serif',
          fontSize: 34,
          fontWeight: 800,
        }}
      >
        R
      </div>
    ),
    size,
  );
}
