import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProgressBar } from "@/components/ProgressBar";
import { SurveyAnswers, initialSurveyAnswers, YesNo } from "@/types/feedback";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

const TOTAL_STEPS = 6; // 0: name, 1-4: yes/no, 5: open text

// ─── YES/NO Button ─────────────────────────────────────────────────────────────
interface YesNoButtonProps {
  value: YesNo;
  selected: YesNo | null;
  onSelect: (v: YesNo) => void;
}

const YesNoButton = ({ value, selected, onSelect }: YesNoButtonProps) => {
  const isSelected = selected === value;
  const isYes = value === "yes";

  const base =
    "flex-1 py-6 md:py-8 rounded-2xl text-2xl md:text-3xl font-bold font-special transition-all duration-200 border-2 select-none cursor-pointer flex flex-col items-center gap-2";

  const active = isYes
    ? "bg-secondary text-secondary-foreground border-secondary scale-105 shadow-lg"
    : "bg-destructive text-destructive-foreground border-destructive scale-105 shadow-lg";

  const idle =
    "bg-background text-foreground border-border hover:scale-105 hover:shadow-md";

  return (
    <button
      type="button"
      className={`${base} ${isSelected ? active : idle}`}
      onClick={() => onSelect(value)}
    >
      <span className="text-3xl md:text-4xl">{isYes ? "✅" : "❌"}</span>
      <span>{isYes ? "SIM" : "NÃO"}</span>
    </button>
  );
};

// ─── Question config ────────────────────────────────────────────────────────────
const yesNoQuestions: {
  field: keyof Pick<
    SurveyAnswers,
    "petLoved" | "metExpectations" | "wouldRecommend" | "wouldRepurchase"
  >;
  dragonVoice: string;
  question: string;
}[] = [
  {
    field: "petLoved",
    dragonVoice: "O Dragão viu tudo. Mas quer ouvir de você 👀",
    question: "Seu pet amou a Comida de Dragão?",
  },
  {
    field: "metExpectations",
    dragonVoice: "Sem filtro — o Dragão só quer a verdade 🐉",
    question: "O produto foi o que você esperava?",
  },
  {
    field: "wouldRecommend",
    dragonVoice: "A revolução cresce com a sua voz 🌿",
    question: "Você indicaria pra outro tutor?",
  },
  {
    field: "wouldRepurchase",
    dragonVoice: "Essa é a mais importante. O Dragão precisa saber.",
    question: "Você compraria de novo?",
  },
];

// ─── Main Survey Component ─────────────────────────────────────────────────────
export const FeedbackSurvey = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [surveyStarted, setSurveyStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<SurveyAnswers>(initialSurveyAnswers);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Navigation ──────────────────────────────────────────────────────────────
  const canProceed = (): boolean => {
    if (currentStep === 0) return answers.customerName.trim() !== "";
    return true; // all other steps are optional or auto-advance
  };

  const handleYesNo = (
    field: keyof SurveyAnswers,
    value: YesNo
  ) => {
    setAnswers((prev) => ({ ...prev, [field]: value }));
    setTimeout(() => {
      if (currentStep < TOTAL_STEPS - 1) {
        setCurrentStep((prev) => prev + 1);
      }
    }, 350);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  const handleNext = async () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      await submitSurvey();
    }
  };

  // ─── Submit ───────────────────────────────────────────────────────────────────
  const submitSurvey = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("feedback_responses").insert({
        customer_name: answers.customerName,
        pet_type: "survey_v2",
        usage_time: "n/a",
        nps_score: null,
        expectations:
          answers.metExpectations === "yes" ? "exceeded" : "not_met",
        motivations: [],
        liked_most:
          answers.wouldRecommend === "yes" ? "yes_recommend" : "no_recommend",
        would_change: answers.improvement || "",
        pet_acceptance: answers.petLoved === "yes" ? "loved" : "rejected",
        would_repurchase:
          answers.wouldRepurchase === "yes" ? "yes_definitely" : "no",
        no_repurchase_reason: null,
        ideal_product: null,
      });

      if (error) throw error;

      localStorage.setItem("feedbackAnswers", JSON.stringify(answers));
      navigate("/results");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Erro ao enviar",
        description:
          "Não foi possível enviar suas respostas. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Welcome Screen ───────────────────────────────────────────────────────────
  if (!surveyStarted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-lg text-center animate-in fade-in duration-500">
          <div className="mb-8">
            <div className="mb-6 flex justify-center">
              <img
                src={logo}
                alt="Comida de Dragão"
                className="w-56 md:w-72 h-auto"
              />
            </div>
            <p className="text-sm font-special text-muted-foreground uppercase tracking-widest mb-4">
              O Dragão me contou que você experimentou algo diferente.
            </p>
            <h1 className="text-3xl md:text-4xl font-special font-bold text-question mb-4 leading-tight">
              Conta pra gente como foi? 🐉
            </h1>
            <p className="text-base md:text-lg font-special text-foreground mb-2">
              São <span className="font-bold">3 minutos</span>. Só sim e não.
            </p>
            <p className="text-base font-special text-muted-foreground mb-8">
              No final tem um{" "}
              <span className="font-bold text-primary">mimo especial</span>{" "}
              esperando 💚
            </p>
          </div>
          <Button
            onClick={() => setSurveyStarted(true)}
            size="lg"
            className="text-xl font-special px-16 py-6 h-auto rounded-full hover:scale-105 transition-transform"
          >
            Bora lá!
          </Button>
        </div>
      </div>
    );
  }

  // ─── Survey Steps ─────────────────────────────────────────────────────────────
  const firstName = answers.customerName.split(" ")[0] || "";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <ProgressBar current={currentStep + 1} total={TOTAL_STEPS} />

        {/* Back button */}
        {currentStep > 0 && (
          <button
            onClick={handleBack}
            className="mt-4 text-sm font-special text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            ← Voltar
          </button>
        )}

        <div
          className="mt-8 animate-in fade-in duration-300"
          key={currentStep}
        >
          {/* ─ Step 0: Name ─ */}
          {currentStep === 0 && (
            <div className="space-y-6 text-center">
              <p className="text-sm font-special text-muted-foreground italic">
                "O Dragão me pediu pra começar pelo começo."
              </p>
              <h2 className="text-2xl md:text-3xl font-special font-bold text-question">
                Qual é o seu nome?
              </h2>
              <Input
                type="text"
                value={answers.customerName}
                onChange={(e) =>
                  setAnswers({ ...answers, customerName: e.target.value })
                }
                onKeyDown={(e) =>
                  e.key === "Enter" && canProceed() && handleNext()
                }
                placeholder="Digite seu nome..."
                className="text-xl py-6 text-center font-special rounded-xl"
                autoFocus
              />
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                size="lg"
                className="w-full text-lg font-special py-6 rounded-full"
              >
                Continuar
              </Button>
            </div>
          )}

          {/* ─ Steps 1–4: YES/NO ─ */}
          {currentStep >= 1 &&
            currentStep <= 4 &&
            (() => {
              const q = yesNoQuestions[currentStep - 1];
              return (
                <div className="space-y-6 text-center">
                  <p className="text-sm font-special text-muted-foreground italic">
                    "{q.dragonVoice}"
                  </p>
                  <h2 className="text-2xl md:text-3xl font-special font-bold text-question leading-tight">
                    {q.question}
                  </h2>
                  {firstName && (
                    <p className="text-sm font-special text-muted-foreground">
                      ({firstName}, pode ser direto — o Dragão prefere assim 😄)
                    </p>
                  )}
                  <div className="flex gap-4 mt-6">
                    <YesNoButton
                      value="yes"
                      selected={answers[q.field] as YesNo | null}
                      onSelect={(v) => handleYesNo(q.field, v)}
                    />
                    <YesNoButton
                      value="no"
                      selected={answers[q.field] as YesNo | null}
                      onSelect={(v) => handleYesNo(q.field, v)}
                    />
                  </div>
                </div>
              );
            })()}

          {/* ─ Step 5: Open text (optional) ─ */}
          {currentStep === 5 && (
            <div className="space-y-6 text-center">
              <p className="text-sm font-special text-muted-foreground italic">
                "Opcional — mas vale muito. O Dragão lê tudo."
              </p>
              <h2 className="text-2xl md:text-3xl font-special font-bold text-question leading-tight">
                Tem algo que poderia ter sido melhor?
              </h2>
              <p className="text-sm font-special text-muted-foreground">
                Sua ideia pode virar realidade 🪲
              </p>
              <Textarea
                value={answers.improvement || ""}
                onChange={(e) =>
                  setAnswers({ ...answers, improvement: e.target.value })
                }
                placeholder="Escreva aqui (opcional)..."
                className="font-special text-base rounded-xl min-h-[120px] resize-none"
                maxLength={300}
              />
              {answers.improvement && (
                <p className="text-xs font-special text-muted-foreground text-right">
                  {answers.improvement.length}/300
                </p>
              )}
              <Button
                onClick={handleNext}
                disabled={isSubmitting}
                size="lg"
                className="w-full text-lg font-special py-6 rounded-full"
              >
                {isSubmitting ? "Enviando..." : "Enviar pesquisa 🐉"}
              </Button>
              <button
                onClick={() => {
                  setAnswers((prev) => ({ ...prev, improvement: "" }));
                  handleNext();
                }}
                className="text-sm font-special text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors"
                disabled={isSubmitting}
              >
                Pular
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
