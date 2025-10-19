import { Progress } from "@/components/ui/progress";

interface ProgressBarProps {
  progress: number;
}

export default function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className="space-y-3" data-test-id="generation-progress-container">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Generating flashcards...</h3>
        <span className="text-sm font-medium text-primary" data-test-id="generation-progress-value">
          {progress}%
        </span>
      </div>

      <Progress
        value={progress}
        aria-label="Generation progress"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2"
        data-test-id="generation-progress-bar"
      />

      <p className="text-sm text-muted-foreground">AI is analyzing the text and creating flashcard proposals</p>
    </div>
  );
}
