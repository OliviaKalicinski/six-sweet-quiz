import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface QuizNavigationProps {
  onBack: () => void;
  onNext: () => void;
  showBack: boolean;
  isLastQuestion: boolean;
  canProceed: boolean;
}

export const QuizNavigation = ({
  onBack,
  onNext,
  showBack,
  isLastQuestion,
  canProceed,
}: QuizNavigationProps) => {
  return (
    <div className="w-full max-w-3xl mx-auto flex gap-4 justify-between">
      {showBack ? (
        <Button
          onClick={onBack}
          variant="outline"
          size="lg"
          className="flex-1 max-w-xs font-special"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Voltar
        </Button>
      ) : (
        <div className="flex-1 max-w-xs" />
      )}
      <Button
        onClick={onNext}
        disabled={!canProceed}
        size="lg"
        className="flex-1 max-w-xs font-special"
      >
        {isLastQuestion ? "Finalizar" : "Próximo"}
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </div>
  );
};
