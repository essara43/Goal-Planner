interface ProgressBarProps {
  /** Ratio entre 0 et 1. */
  value: number;
  /** Description lue par les lecteurs d'écran. */
  label: string;
}

export function ProgressBar({ value, label }: ProgressBarProps) {
  const percent = Math.round(Math.min(Math.max(value, 0), 1) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={`${percent} %`}
      className="h-2 w-full overflow-hidden rounded-full bg-slate-800"
    >
      <div
        className="h-full rounded-full bg-sky-400 transition-[width] duration-300"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
