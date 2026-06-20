export default function Logo({
  size = 36,
  showText = true,
  markColor = "#15433a",
  plusColor = "#ffffff",
  textPrimary = "#1a2e29",
}) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.55rem" }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect x="6" y="8" width="36" height="27" rx="9" fill={markColor} />
        <polygon points="14,33 14,44 25,33" fill={markColor} />
        <rect x="22.6" y="14.5" width="2.8" height="14" rx="1.4" fill={plusColor} />
        <rect x="17" y="20.1" width="14" height="2.8" rx="1.4" fill={plusColor} />
      </svg>
      {showText && (
        <span style={{ fontSize: size * 0.52, fontWeight: 700, letterSpacing: "-0.5px", lineHeight: 1 }}>
          <span style={{ color: "#15433a" }}>See</span>
          <span style={{ color: textPrimary }}>Doc</span>
        </span>
      )}
    </span>
  );
}
