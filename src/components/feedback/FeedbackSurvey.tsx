import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ProgressBar";
import { QuizNavigation } from "@/components/QuizNavigation";
import { FeedbackAnswers, initialFeedbackAnswers } from "@/types/feedback";
import { NPSScale } from "./NPSScale";
import { RadioOptions } from "./RadioOptions";
import { CheckboxOptions } from "./CheckboxOptions";
import { TextAreaWithCounter } from "./TextAreaWithCounter";
import { QuestionWrapper } from "./QuestionWrapper";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";
import { Input } from "@/components/ui/input";

const TOTAL_QUESTIONS = 9;

export const FeedbackSurvey = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [surveyStarted, setSurveyStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<FeedbackAnswers>(initialFeedbackAnswers);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canProceed = (): boolean => {
    switch (currentQuestion) {
      case 0: // Name
        return answers.customerName.trim() !== "";
      case 1: // Context
        return answers.petType !== "" && answers.usageTime !== "" && 
               (answers.petType !== "other" || (answers.petTypeOther?.trim() || "") !== "");
      case 2: // NPS
        return answers.npsScore !== null;
      case 3: // Expectations
        return answers.expectations !== "";
      case 4: // Motivation
        return answers.motivations.length > 0 &&
               (!answers.motivations.includes("other") || (answers.motivationOther?.trim() || "") !== "");
      case 5: // Strengths/Weaknesses
        return answers.likedMost.trim() !== "" && answers.wouldChange.trim() !== "";
      case 6: // Acceptance
        if (answers.petAcceptance === "") return false;
        if (answers.petAcceptance === "rejected" && !answers.rejectionAction) return false;
        return true;
      case 7: // Repurchase
        return answers.wouldRepurchase !== "";
      case 8: // Ideal Product (optional)
        return true;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (currentQuestion < TOTAL_QUESTIONS - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      await submitSurvey();
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const submitSurvey = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("feedback_responses").insert({
        customer_name: answers.customerName,
        pet_type: answers.petType,
        pet_type_other: answers.petTypeOther || null,
        usage_time: answers.usageTime,
        nps_score: answers.npsScore,
        expectations: answers.expectations,
        expectations_reason: answers.expectationsReason || null,
        motivations: answers.motivations,
        motivation_other: answers.motivationOther || null,
        liked_most: answers.likedMost,
        would_change: answers.wouldChange,
        pet_acceptance: answers.petAcceptance,
        rejection_action: answers.rejectionAction || null,
        would_repurchase: answers.wouldRepurchase,
        no_repurchase_reason: answers.noRepurchaseReason || null,
        ideal_product: answers.idealProduct || null,
      });

      if (error) throw error;

      localStorage.setItem("feedbackAnswers", JSON.stringify(answers));
      navigate("/results");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível enviar suas respostas. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!surveyStarted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl text-center animate-fade-in">
          <div className="mb-8">
            <div className="mb-6 flex justify-center">
              <img src={logo} alt="Comida de Dragão" className="w-64 md:w-80 h-auto" />
            </div>
            <h1 className="text-3xl md:text-5xl font-special font-bold text-question mb-6">
              🐉 O Dragão quer ouvir você!
            </h1>
            <p className="text-lg md:text-xl font-special text-muted-foreground mb-4">
              Sua experiência com nossos produtos ajuda a gente a criar produtos ainda melhores.
            </p>
            <p className="text-base md:text-lg font-special text-foreground mb-6">
              São só 2 minutos. No final você ganha um <span className="font-bold text-primary">cupom especial</span> 💚
            </p>
          </div>
          <Button
            onClick={() => setSurveyStarted(true)}
            size="lg"
            className="text-lg font-special px-16 py-6 h-auto hover:scale-105 transition-transform"
          >
            Começar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <ProgressBar current={currentQuestion + 1} total={TOTAL_QUESTIONS} />
        
        <div className="mt-8">
          {currentQuestion === 0 && (
            <QuestionWrapper title="Qual é o seu nome?">
              <Input
                type="text"
                value={answers.customerName}
                onChange={(e) => setAnswers({ ...answers, customerName: e.target.value })}
                placeholder="Digite seu nome"
                className="text-lg py-6 text-center font-special"
                autoFocus
              />
            </QuestionWrapper>
          )}

          {currentQuestion === 1 && (
            <div className="space-y-8">
              <QuestionWrapper title="Para qual pet você comprou?">
                <RadioOptions
                  options={[
                    { value: "dog", label: "🐕 Cão" },
                    { value: "cat", label: "🐈 Gato" },
                    { value: "reptile", label: "🦎 Réptil/Anfíbio" },
                  ]}
                  value={answers.petType}
                  onChange={(v) => setAnswers({ ...answers, petType: v })}
                  showOther
                  otherValue={answers.petTypeOther}
                  onOtherChange={(v) => setAnswers({ ...answers, petTypeOther: v })}
                />
              </QuestionWrapper>
              
              <QuestionWrapper title="Há quanto tempo você está usando o produto?">
                <RadioOptions
                  options={[
                    { value: "first_time", label: "Primeira vez / Acabei de receber" },
                    { value: "less_than_1_month", label: "Menos de 1 mês" },
                    { value: "1_to_3_months", label: "1-3 meses" },
                    { value: "more_than_3_months", label: "Mais de 3 meses" },
                  ]}
                  value={answers.usageTime}
                  onChange={(v) => setAnswers({ ...answers, usageTime: v })}
                />
              </QuestionWrapper>
            </div>
          )}

          {currentQuestion === 2 && (
            <QuestionWrapper 
              title="Numa escala de 0 a 10, o quanto você recomendaria Comida de Dragão para outro tutor?"
            >
              <NPSScale
                value={answers.npsScore}
                onChange={(v) => setAnswers({ ...answers, npsScore: v })}
              />
            </QuestionWrapper>
          )}

          {currentQuestion === 3 && (
            <div className="space-y-8">
              <QuestionWrapper title="O produto atendeu às suas expectativas?">
                <RadioOptions
                  options={[
                    { value: "exceeded", label: "Sim, superou! 🎉" },
                    { value: "met", label: "Sim, atendeu" },
                    { value: "partial", label: "Parcialmente" },
                    { value: "not_met", label: "Não atendeu" },
                    { value: "cant_evaluate", label: "Ainda não deu pra avaliar" },
                  ]}
                  value={answers.expectations}
                  onChange={(v) => setAnswers({ ...answers, expectations: v })}
                />
              </QuestionWrapper>
              
              {(answers.expectations === "partial" || answers.expectations === "not_met") && (
                <QuestionWrapper title="Se não atendeu ou foi parcial, por quê?">
                  <TextAreaWithCounter
                    value={answers.expectationsReason || ""}
                    onChange={(v) => setAnswers({ ...answers, expectationsReason: v })}
                    placeholder="Opcional - nos ajuda a melhorar"
                    required={false}
                  />
                </QuestionWrapper>
              )}
            </div>
          )}

          {currentQuestion === 4 && (
            <QuestionWrapper title="O que te motivou a experimentar proteína de inseto?">
              <CheckboxOptions
                options={[
                  { value: "sustainability", label: "🌱 Sustentabilidade / Impacto ambiental" },
                  { value: "allergy", label: "🩺 Alergia do pet a proteínas convencionais" },
                  { value: "curiosity", label: "💡 Curiosidade / Inovação" },
                  { value: "vet_recommendation", label: "👨‍⚕️ Recomendação veterinária" },
                  { value: "nutrition", label: "💪 Qualidade nutricional" },
                  { value: "digestive_issues", label: "🔄 Problemas digestivos do pet" },
                ]}
                values={answers.motivations}
                onChange={(v) => setAnswers({ ...answers, motivations: v })}
                maxSelections={2}
                showOther
                otherValue={answers.motivationOther}
                onOtherChange={(v) => setAnswers({ ...answers, motivationOther: v })}
              />
            </QuestionWrapper>
          )}

          {currentQuestion === 5 && (
            <div className="space-y-8">
              <QuestionWrapper title="O que você MAIS GOSTOU no produto?">
                <TextAreaWithCounter
                  value={answers.likedMost}
                  onChange={(v) => setAnswers({ ...answers, likedMost: v })}
                  placeholder="Conte o que mais te agradou..."
                  required
                />
              </QuestionWrapper>
              
              <QuestionWrapper title="Se pudesse mudar UMA COISA no produto, o que seria?">
                <TextAreaWithCounter
                  value={answers.wouldChange}
                  onChange={(v) => setAnswers({ ...answers, wouldChange: v })}
                  placeholder="Sua sugestão de melhoria..."
                  required
                />
              </QuestionWrapper>
            </div>
          )}

          {currentQuestion === 6 && (
            <div className="space-y-8">
              <QuestionWrapper title="Como foi a aceitação do seu pet?">
                <RadioOptions
                  options={[
                    { value: "loved", label: "Amou de cara! 😍" },
                    { value: "accepted", label: "Aceitou bem" },
                    { value: "accepted_after_tries", label: "Aceitou depois de algumas tentativas" },
                    { value: "rejected", label: "Rejeitou / Não quis comer" },
                    { value: "not_offered", label: "Ainda não ofereci" },
                  ]}
                  value={answers.petAcceptance}
                  onChange={(v) => setAnswers({ ...answers, petAcceptance: v, rejectionAction: undefined })}
                />
              </QuestionWrapper>
              
              {answers.petAcceptance === "rejected" && (
                <QuestionWrapper title="Se rejeitou, você:">
                  <RadioOptions
                    options={[
                      { value: "mixed", label: "Tentou misturar com a ração atual" },
                      { value: "different_time", label: "Ofereceu em outro horário" },
                      { value: "gave_up", label: "Desistiu" },
                      { value: "contacted_us", label: "Entrou em contato com a gente" },
                    ]}
                    value={answers.rejectionAction || ""}
                    onChange={(v) => setAnswers({ ...answers, rejectionAction: v })}
                  />
                </QuestionWrapper>
              )}
            </div>
          )}

          {currentQuestion === 7 && (
            <div className="space-y-8">
              <QuestionWrapper title="Você compraria novamente?">
                <RadioOptions
                  options={[
                    { value: "yes_definitely", label: "Sim, com certeza!" },
                    { value: "yes_probably", label: "Sim, provavelmente" },
                    { value: "maybe", label: "Talvez (depende de X)" },
                    { value: "no", label: "Não" },
                  ]}
                  value={answers.wouldRepurchase}
                  onChange={(v) => setAnswers({ ...answers, wouldRepurchase: v })}
                />
              </QuestionWrapper>
              
              {(answers.wouldRepurchase === "no" || answers.wouldRepurchase === "maybe") && (
                <QuestionWrapper title="Se não, por quê?">
                  <TextAreaWithCounter
                    value={answers.noRepurchaseReason || ""}
                    onChange={(v) => setAnswers({ ...answers, noRepurchaseReason: v })}
                    placeholder="Opcional - queremos entender"
                    required={false}
                  />
                </QuestionWrapper>
              )}
            </div>
          )}

          {currentQuestion === 8 && (
            <QuestionWrapper 
              title="Que produto você gostaria que a gente criasse?"
              subtitle="Exemplos: ração completa, sachê, outro sabor, outro formato..."
            >
              <TextAreaWithCounter
                value={answers.idealProduct || ""}
                onChange={(v) => setAnswers({ ...answers, idealProduct: v })}
                placeholder="Opcional - sua ideia pode virar realidade"
                required={false}
              />
            </QuestionWrapper>
          )}
        </div>

        <QuizNavigation
          onBack={handleBack}
          onNext={handleNext}
          showBack={currentQuestion > 0}
          isLastQuestion={currentQuestion === TOTAL_QUESTIONS - 1}
          canProceed={canProceed()}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
};
