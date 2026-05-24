interface BrandLogoProps {
  size?: number
  className?: string
}

/**
 * The "a." emerald brand mark.
 * Renders the square with lowercase "a" and the white dot.
 */
export default function BrandLogo({ size = 26, className }: BrandLogoProps) {
  const fontSize = Math.round(size * 0.5)
  const dotSize = Math.round(size * 0.115)
  const dotOffset = Math.round(size * 0.077)

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.269),
        background: '#2d5a4f',
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'center',
        position: 'relative',
        flexShrink: 0,
        paddingBottom: Math.round(size * 0.154),
      }}
    >
      <span
        style={{
          color: '#fff',
          fontSize,
          fontWeight: 700,
          fontFamily: "'Inter', system-ui, sans-serif",
          letterSpacing: '-0.05em',
          lineHeight: 1,
        }}
      >
        a
      </span>
      {/* The dot */}
      <div
        style={{
          position: 'absolute',
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          background: '#fff',
          right: dotOffset,
          bottom: Math.round(size * 0.23),
        }}
      />
    </div>
  )
}
