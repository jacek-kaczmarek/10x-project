import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface GenerationFormProps {
  sourceText: string;
  validationError: string | null;
  loading: boolean;
  onSourceTextChange: (text: string) => void;
  onGenerate: () => void;
}

export default function GenerationForm({
  sourceText,
  validationError,
  loading,
  onSourceTextChange,
  onGenerate,
}: GenerationFormProps) {
  const charCount = sourceText.length;
  const minChars = 1000;
  const maxChars = 10000;
  const isValid = charCount >= minChars && charCount <= maxChars;

  // Determine progress indicator color
  const getProgressColor = () => {
    if (charCount < minChars) return "text-muted-foreground";
    if (charCount > maxChars) return "text-destructive";
    return "text-primary";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid && !loading) {
      onGenerate();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="source-text" className="text-sm font-medium">
          Source Text
        </label>
        <Textarea
          id="source-text"
          aria-label="Source text"
          placeholder="Paste the text from which AI will generate flashcards (1000-10000 characters)..."
          value={sourceText}
          onChange={(e) => onSourceTextChange(e.target.value)}
          disabled={loading}
          className="min-h-[120px] max-h-[180px] resize-y"
          aria-invalid={validationError ? "true" : "false"}
          aria-describedby={validationError ? "validation-error" : "char-count"}
        />

        <div className="flex items-center justify-between text-sm">
          <span id="char-count" className={getProgressColor()}>
            {charCount} / {minChars}-{maxChars} characters
          </span>

          {validationError && (
            <span id="validation-error" className="text-destructive" role="alert">
              {validationError}
            </span>
          )}
        </div>
      </div>

      <Button type="submit" disabled={!isValid || loading} className="w-full sm:w-auto">
        {loading ? "Generating..." : "Generate Flashcards"}
      </Button>
    </form>
  );
}
