import { motion } from "framer-motion";

interface ScoreCircleProps {
  score: number;
  label: string;
  subLabel?: string;
  size?: "sm" | "md" | "lg";
  color?: string;
}

export function ScoreCircle({ score, label, subLabel, size = "md", color = "currentColor" }: ScoreCircleProps) {
  const radius = size === "lg" ? 60 : size === "md" ? 40 : 24;
  const stroke = size === "lg" ? 8 : size === "md" ? 6 : 4;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const sizeClasses = {
    sm: "w-16 h-16 text-xs",
    md: "w-32 h-32 text-sm",
    lg: "w-48 h-48 text-base",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`relative flex items-center justify-center ${sizeClasses[size]}`}>
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90 drop-shadow-lg"
        >
          <circle
            stroke="hsl(var(--muted))"
            strokeWidth={stroke}
            fill="transparent"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <motion.circle
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="transparent"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            style={{ strokeDasharray: circumference + ' ' + circumference }}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <motion.span 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={`font-serif font-bold ${size === 'lg' ? 'text-4xl' : 'text-2xl'}`}
          >
            {Math.round(score)}
          </motion.span>
        </div>
      </div>
      <div className="text-center">
        <h4 className="font-medium uppercase tracking-wider text-muted-foreground text-xs">{label}</h4>
        {subLabel && <p className="text-xs text-muted-foreground/70 mt-1">{subLabel}</p>}
      </div>
    </div>
  );
}
