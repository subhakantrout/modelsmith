import { type SVGProps } from "react";

type LogoVariant = "icon" | "horizontal";

interface LogoProps extends SVGProps<SVGSVGElement> {
  variant?: LogoVariant;
}

export function Logo({ variant = "icon", ...props }: LogoProps) {
  if (variant === "horizontal") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 120" fill="none" {...props}>
        <defs>
          <linearGradient id="hGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <g transform="translate(10, 10) scale(0.65)">
          <path d="M72 128 L120 64 L184 64 L232 128Z" fill="url(#hGrad)" opacity={0.9} />
          <rect x={88} y={128} width={128} height={16} rx={3} fill="url(#hGrad)" />
          <path d="M184 64 L208 40 L224 40 L208 64Z" fill="url(#hGrad)" opacity={0.85} />
          <path d="M120 64 L96 40 L80 40 L96 64Z" fill="url(#hGrad)" opacity={0.85} />
          <rect x={144} y={24} width={16} height={40} rx={4} fill="url(#hGrad)" />
        </g>
        <text x={160} y={72} fontFamily="system-ui" fontWeight="800" fontSize={36} fill="#e2e8f0" letterSpacing="-0.5">Model</text>
        <text x={296} y={72} fontFamily="system-ui" fontWeight="300" fontSize={36} fill="#a78bfa" letterSpacing={1}>Smith</text>
      </svg>
    );
  }

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" {...props}>
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <linearGradient id="logoGrad2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
      </defs>
      <path d="M96 384 L160 256 L352 256 L416 384Z" fill="url(#logoGrad)" opacity={0.9} />
      <rect x={128} y={384} width={256} height={32} rx={4} fill="url(#logoGrad2)" />
      <path d="M352 256 L416 192 L448 192 L416 256Z" fill="url(#logoGrad)" opacity={0.85} />
      <path d="M160 256 L96 192 L64 192 L96 256Z" fill="url(#logoGrad)" opacity={0.85} />
      <rect x={224} y={96} width={64} height={48} rx={6} fill="url(#logoGrad2)" />
      <rect x={244} y={144} width={24} height={80} rx={3} fill="url(#logoGrad)" opacity={0.7} />
      <circle cx={200} cy={160} r={4} fill="#c4b5fd" opacity={0.8} />
      <circle cx={312} cy={144} r={3} fill="#c4b5fd" opacity={0.6} />
      <circle cx={176} cy={200} r={2.5} fill="#a78bfa" opacity={0.5} />
      <circle cx={336} cy={176} r={3.5} fill="#a78bfa" opacity={0.7} />
      <circle cx={256} cy={80} r={3} fill="#c4b5fd" opacity={0.9} />
      <circle cx={220} cy={120} r={2} fill="#a78bfa" opacity={0.4} />
      <circle cx={292} cy={112} r={2.5} fill="#a78bfa" opacity={0.5} />
    </svg>
  );
}
