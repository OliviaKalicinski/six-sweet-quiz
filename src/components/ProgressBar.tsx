interface ProgressBarProps {
  current: number;
  total: number;
}

export const ProgressBar = ({ current, total }: ProgressBarProps) => {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="w-full">
      {/* Thin neon line */}
      <div className="w-full h-[3px] bg-muted overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {/* Step counter */}
      <div className="flex items-center justify-end mt-2">
        <span
          className="text-xs text-muted-foreground uppercase tracking-widest"
          style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
        >
          {current}/{total}
        </span>
      </div>
    </div>
  );
};
