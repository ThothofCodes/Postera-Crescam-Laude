// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// PCL — Logo with breathing-glow animation

export default function PCLLogo({ size = 40, showText = true, textSize = '15px' }) {
  const useWordmark = showText || size >= 36;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: Math.round(size * 0.3) }}>
      <img
        src={useWordmark ? '/postera-wordmark.png' : '/postera-mark.png'}
        alt="Postera Crescam Laude"
        style={{
          height: size,
          width: 'auto',
          objectFit: 'contain',
          flexShrink: 0,
          filter: 'drop-shadow(0 0 8px rgba(43,182,163,0.3))',
        }}
      />
    </div>
  );
}
