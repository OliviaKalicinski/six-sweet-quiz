import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

interface QuizNavigationProps {
  onBack: () => void;
  onNext: () => void;
  showBack: boolean;
  isLastQuestion: boolean;
  canProceed: boolean;
  isSubmitting?: boolean;
}

export const QuizNavigation = ({
  onBack,
  onNext,
  showBack,
  isLastQuestion,
  canProceed,
  isSubmitting = false,
}: QuizNavigationProps) => {
  return (
    <div className="w-full max-w-3xl mx-auto flex gap-4 justify-between mt-8">
      {showBack ? (
        <Button
          onClick={onBack}
          variant="outline"
          size="lg"
          className="flex-1 max-w-xs font-special"
          disabled={isSubmitting}
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Voltar
        </Button>
      ) : (
        <div className="flex-1 max-w-xs" />
      )}
      <Button
        onClick={onNext}
        disabled={!canProceed || isSubmitting}
        size="lg"
        className="flex-1 max-w-xs font-special"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Enviando...
          </>
        ) : isLastQuestion ? (
          <>
            Finalizar
            <ArrowRight className="ml-2 h-5 w-5" />
          </>
        ) : (
          <>
            Próximo
            <ArrowRight className="ml-2 h-5 w-5" />
          </>
        )}
      </Button>
    </div>
  );
};
