interface JWIconProps {
  active: boolean;
  size?: number;
}

/**
 * JW.org 공식 아이콘 스타일:
 * 파란 둥근 사각형 + 흰색 "JW" (큰 글씨) + ".ORG" (작은 글씨)
 */
export default function JWIcon({ active, size = 56 }: JWIconProps) {
  const bg = active ? '#5571A8' : '#D9E2F3';
  const fg = active ? '#FFFFFF' : '#5571A8';

  return (
    <svg
      viewBox="0 0 56 56"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="JW.ORG"
    >
      <rect width="56" height="56" rx="10" ry="10" fill={bg} />

      {/* "JW" 큰 글씨 */}
      <text
        x="28"
        y="28"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif"
        fontWeight="700"
        fontSize="22"
        fill={fg}
        letterSpacing="0.5"
      >
        JW
      </text>

      {/* ".ORG" 작은 글씨 */}
      <text
        x="28"
        y="43"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif"
        fontWeight="700"
        fontSize="11"
        fill={fg}
        letterSpacing="0.5"
      >
        .ORG
      </text>
    </svg>
  );
}
