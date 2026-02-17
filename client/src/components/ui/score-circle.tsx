import { motion } from "framer-motion";

interface ScoreCircleProps {
  score: number;
  label: string;
  subLabel?: string;
}

export function ScoreCircle({ score, label, subLabel }: ScoreCircleProps) {
  const radius = 52;
  const stroke = 5;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreColor = (s: number) => {
    if (s >= 70) return "hsl(142, 71%, 45%)";
    if (s >= 40) return "hsl(45, 93%, 47%)";
    return "hsl(0, 0%, 60%)";
  };

  return (
    <div className="flex flex-col items-center gap-4" data-testid={`score-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="relative flex items-center justify-center w-32 h-32">
        <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
          <circle
            stroke="hsl(var(--border))"
            strokeWidth={stroke}
            fill="transparent"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <motion.circle
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
            stroke={getScoreColor(score)}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="transparent"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            style={{ strokeDasharray: circumference + ' ' + circumference }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-3xl font-semibold tracking-tight"
          >
            {Math.round(score)}
          </motion.span>
        </div>
      </div>
      <div className="text-center space-y-0.5">
        <div className="text-sm font-medium text-foreground">{label}</div>
        {subLabel && <div className="text-xs text-muted-foreground">{subLabel}</div>}
      </div>
    </div>
  );
}
