import { Progress } from "@/components/ui/progress";

interface ProgressBarProps {
  progress: number;
}

export default function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Trwa generowanie fiszek...</h3>
        <span className="text-sm font-medium text-primary">{progress}%</span>
      </div>

      <Progress
        value={progress}
        aria-label="Postęp generowania"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2"
      />

      <p className="text-sm text-muted-foreground">AI analizuje tekst i tworzy propozycje fiszek</p>
    </div>
  );
}
