interface ProgressBarProps {
  current: number;
  total: number;
}

export const ProgressBar = ({ current, total }: ProgressBarProps) => {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="w-full max-w-3xl mx-auto mb-12">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-special font-medium text-foreground">
          {current} de {total}
        </span>
        <span className="text-sm font-special font-medium text-foreground">{percentage}%</span>
      </div>
      <div className="w-full h-2 bg-progress-bg rounded-full overflow-hidden">
        <div
          className="h-full bg-progress-fill transition-all duration-500 ease-out rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
