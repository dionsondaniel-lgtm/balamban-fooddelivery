export default function ElectricBorder({ children }) {
  return (
    <div className="electric-wrapper">
      {/* Rotating gradient */}
      <div className="electric-border" />

      {/* Branching lightning */}
      <svg
        className="lightning-layer"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <polyline className="bolt bolt-1" points="10,0 14,18 8,36 16,54 10,72 14,100" />
        <polyline className="bolt bolt-2" points="90,0 86,22 94,44 84,66 90,88 86,100" />
        <polyline className="bolt bolt-3" points="0,28 18,26 36,30 54,24 72,28 100,26" />
        <polyline className="bolt bolt-4" points="0,72 16,70 34,74 56,68 78,72 100,70" />
      </svg>

      {/* Content */}
      <div className="electric-content">
        {children}
      </div>
    </div>
  );
}
