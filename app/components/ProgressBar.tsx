import { Progress } from "~/components/ui/progress";
import { useEffect, useState } from "react";

interface ProgressBarProps {
  duration: number;
  isPlaying: boolean;
  textColorClass: string;
}

export function ProgressBar({
  duration,
  isPlaying,
  textColorClass,
}: ProgressBarProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let startTime: number;
    let rafId: number | undefined;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const percentage = Math.min((elapsed / duration) * 100, 100);

      setProgress(percentage);

      if (percentage < 100 && isPlaying) {
        rafId = requestAnimationFrame(animate);
      }
    };

    const startAnimation = () => {
      setProgress(0);
      startTime = 0;
      rafId = requestAnimationFrame(animate);
    };

    if (isPlaying) {
      startAnimation();
    } else {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    }

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [isPlaying, duration]);

  return (
    <Progress
      value={progress}
      className={`absolute bottom-0 left-0 right-0 h-[2px] bg-current/20 ${textColorClass}`}
    />
  );
}