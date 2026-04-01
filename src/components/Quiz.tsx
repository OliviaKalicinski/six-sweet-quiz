import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "./ProgressBar";
import { QuizMultipleChoice } from "./QuizMultipleChoice";
import { QuizNavigation } from "./QuizNavigation";
import logo from "@/assets/logo.png";

interface Question {
  id: number;
  question: string;
  options: { value: string; label: string }[];
}

// ── Pergunta 0: gate "já experimentou?" ──────────────────────────────────────
const gateQuestion: Question = {
  id: 0,
  question: "Você já experimentou Comida de Dragão?",
  options: [
    { value: "A", label: "A) ✅ Sim, já experimentei!" },
    { value: "B", label: "B) 👀 Ainda não, mas tenho curiosidade" },
    { value: "C", label: "C) 🤔 Ouvi falar mas nunca comprei" },
    { value: "D", label: "D) ❌ Não conheço ainda" },
  ],
};

// ── Sub-perguntas para quem respondeu NÃO (B, C ou D) ───────────────────────
const noFollowUpQuestions: Question[] = [
  {
    id: 100,
    question: "O que te impede de experimentar?",
    options: [
      { value: "A", label: "A) 💰 Preço — parece caro pra testar" },
      { value: "B", label: "B) 🤢 Barreira psicológica — insetos são estranhos pra mim" },
      { value: "C", label: "C) 🤷 Falta de informação — não sei como funciona" },
      { value: "D", label: "D) 🐾 Meu pet é exigente — tenho medo dele rejeitar" },
    ],
  },
  {
    id: 101,
    question: "Qual é o seu pet?",
    options: [
      { value: "A", label: "A) 🐕 Cachorro" },
      { value: "B", label: "B) 🐈 Gato" },
      { value: "C", label: "C) 🦎 Réptil ou Anfíbio (gecko, pogona, rã, etc.)" },
      { value: "D", label: "D) 🐦 Ave, peixe ou outro pequeno mamífero" },
    ],
  },
];

// ── Perguntas principais do quiz (quem respondeu SIM) ────────────────────────
const mainQuestions: Question[] = [
  {
    id: 1,
    question: "Qual é o seu pet?",
    options: [
      { value: "A", label: "A) 🐕 Cachorro" },
      { value: "B", label: "B) 🐈 Gato" },
      { value: "C", label: "C) 🦎 Réptil ou Anfíbio (gecko, pogona, rã, etc.)" },
      { value: "D", label: "D) 🐦 Ave, peixe ou outro pequeno mamífero" },
    ],
  },
  {
    id: 2,
    question: "E aí, qual é a sua com insetos?",
    options: [
      { value: "A", label: "A) Tenho muito nojo, não consigo segurar" },
      { value: "B", label: "B) Tô pronto(a) pra vencer a barreira psicológica" },
      { value: "C", label: "C) De boa, sem drama!" },
      { value: "D", label: "D) Adoro insetos! Inovação e sustentabilidade sempre!" },
    ],
  },
  {
    id: 3,
    question: "O que você busca pro seu pet?",
    options: [
      { value: "A", label: "A) Petisco para recompensa, agrado ou treino" },
      { value: "B", label: "B) Suplementar a alimentação com proteína extra" },
      { value: "C", label: "C) Substituir insetos vivos na alimentação" },
      { value: "D", label: "D) Um lanche funcional com benefícios extras" },
    ],
  },
  {
    id: 4,
    question: "Seu pet tem algum problema com comida?",
    options: [
      { value: "A", label: "A) Sim, tem alergias ou sensibilidades alimentares" },
      { value: "B", label: "B) Não, mas prefiro algo 100% natural" },
      { value: "C", label: "C) Não sei ao certo" },
      { value: "D", label: "D) Precisa de nutrientes específicos (ex: taurina para gatos)" },
    ],
  },
  {
    id: 5,
    question: "Como você prefere dar o alimento?",
    options: [
      { value: "A", label: "A) Apenas um ingrediente 100% natural" },
      { value: "B", label: "B) Para suplementar a ração ou comida do pet" },
      { value: "C", label: "C) Um alimento específico p/ animais exóticos" },
      { value: "D", label: "D) Biscoitinho com ingredientes naturais extras" },
    ],
  },
  {
    id: 6,
    question: "Que benefício você mais valoriza?",
    options: [
      { value: "A", label: "A) Máxima proteína pura, sem misturas" },
      { value: "B", label: "B) Antioxidantes e anti-inflamatórios naturais" },
      { value: "C", label: "C) Energia e nutrição balanceada" },
      { value: "D", label: "D) Ômegas e gorduras saudáveis preservadas" },
    ],
  },
  {
    id: 7,
    question: "O que pesa mais na sua escolha?",
    options: [
      { value: "A", label: "A) Praticidade total - quanto mais simples, melhor" },
      { value: "B", label: "B) Versatilidade - serve para várias situações" },
      { value: "C", label: "C) Inovação - algo único no mercado" },
      { value: "D", label: "D) Ingredientes premium com superalimentos" },
    ],
  },
];

type QuizPhase = "gate" | "main" | "no_followup" | "no_end";

export const Quiz = () => {
  const navigate = useNavigate();
  const [quizStarted, setQuizStarted] = useState(false);
  const [phase, setPhase] = useState<QuizPhase>("gate");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  // Retorna as perguntas do fluxo atual
  const getActiveQuestions = (): Question[] => {
    if (phase === "gate") return [gateQuestion];
    if (phase === "no_followup") return noFollowUpQuestions;
    if (phase === "main") return mainQuestions;
    return [];
  };

  const activeQuestions = getActiveQuestions();
  const currentQuestion = activeQuestions[currentIndex];

  // Total de passos visível para o usuário
  const getTotalSteps = () => {
    if (phase === "gate") return 1 + mainQuestions.length; // estimativa otimista
    if (phase === "no_followup") return 1 + noFollowUpQuestions.length;
    if (phase === "main") return 1 + mainQuestions.length;
    return 1;
  };

  const getCurrentStep = () => {
    if (phase === "gate") return 1;
    if (phase === "no_followup") return 1 + currentIndex + 1;
    if (phase === "main") return 1 + currentIndex + 1;
    return 1;
  };

  const handleAnswer = (value: string) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const handleNext = () => {
    if (!currentQuestion) return;
    const answer = answers[currentQuestion.id];

    // ── Gate: decidir o fluxo ─────────────────────────────────────────────
    if (phase === "gate") {
      if (answer === "A") {
        // Sim, já experimentou → quiz principal
        setPhase("main");
        setCurrentIndex(0);
      } else {
        // B, C ou D → fluxo "não experimentou"
        setPhase("no_followup");
        setCurrentIndex(0);
      }
      return;
    }

    // ── Follow-up do NÃO ─────────────────────────────────────────────────
    if (phase === "no_followup") {
      if (currentIndex < noFollowUpQuestions.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        // Fim do fluxo "não experimentou" → resultado especial
        localStorage.setItem("quizAnswers", JSON.stringify(answers));
        navigate("/quiz-result", { state: { answers, triedBefore: false } });
      }
      return;
    }

    // ── Quiz principal ───────────────────────────────────────────────────
    if (phase === "main") {
      if (currentIndex < mainQuestions.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        // Quiz completo → resultado com recomendação de produto
        localStorage.setItem("quizAnswers", JSON.stringify(answers));
        navigate("/quiz-result", { state: { answers, triedBefore: true } });
      }
      return;
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      return;
    }
    // Voltou pro início do fluxo → volta pro gate
    if (phase === "main" || phase === "no_followup") {
      setPhase("gate");
      setCurrentIndex(0);
    }
  };

  const handleStartQuiz = () => {
    setQuizStarted(true);
  };

  const currentAnswer = currentQuestion ? (answers[currentQuestion.id] || "") : "";
  const canProceed = currentAnswer.trim().length > 0;
  const showBack = phase !== "gate" || currentIndex > 0;
  const isLastQuestion =
    (phase === "main" && currentIndex === mainQuestions.length - 1) ||
    (phase === "no_followup" && currentIndex === noFollowUpQuestions.length - 1);

  // ── Tela inicial ───────────────────────────────────────────────────────────
  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl text-center animate-fade-in">
          <div className="mb-8">
            <div className="mb-6 flex justify-center">
              <img src={logo} alt="Comida de Dragão" className="w-64 md:w-80 h-auto" />
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-bold text-question mb-6">
              QUAL É A COMIDA DE DRAGÃO IDEAL PARA O MEU PET?
            </h1>
            <p className="text-lg md:text-xl font-special text-muted-foreground mb-4">
              Descubra qual produto é perfeito para seu pet!
            </p>
            <div className="flex items-center justify-center gap-2 text-foreground/80">
              <span className="text-2xl">⏱️</span>
              <span className="text-base md:text-lg font-special">Leva apenas 2 minutos</span>
            </div>
          </div>
          <Button
            onClick={handleStartQuiz}
            size="lg"
            className="text-lg font-special px-16 py-6 h-auto hover:scale-105 transition-transform"
          >
            Começar Quiz
          </Button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  // ── Quiz ativo ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <ProgressBar current={getCurrentStep()} total={getTotalSteps()} />

        <QuizMultipleChoice
          question={currentQuestion.question}
          options={currentQuestion.options}
          selectedValue={currentAnswer}
          onChange={handleAnswer}
        />

        <QuizNavigation
          onBack={handleBack}
          onNext={handleNext}
          showBack={showBack}
          isLastQuestion={isLastQuestion}
          canProceed={canProceed}
        />
      </div>
    </div>
  );
};
