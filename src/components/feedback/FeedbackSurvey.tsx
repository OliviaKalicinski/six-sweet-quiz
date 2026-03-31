import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProgressBar } from "@/components/ProgressBar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ChurnStatus, Segment, SurveyStep } from "@/types/feedback";
import logo from "@/assets/logo.png";

// ─── CONSTANTS ─────────────────────────────────────────────────────────────────

const LOJA_URL = "https://www.comidadedragao.com.br/collections/produtos";
const WHATSAPP_URL = "https://wa.me/552139500576";

const OPENINGS: Record<ChurnStatus, string> = {
  active:   "O Dragão me contou que você experimentou algo diferente. Conta pra gente como foi? 🐉",
  at_risk:  "O Dragão percebeu que você sumiu. Tá tudo bem com o pet e com você?",
  inactive: "O Dragão não deixa ninguém pra trás. Você sumiu há um tempo — o que aconteceu?",
  churned:  "O Dragão vê tudo. E eu sei que faz tempo que a gente não se fala. Estamos aqui — sem pressão.",
  lead:     "O Dragão tem um recado especial pra você. Pode ser direto?",
};

const ENTRY_STEPS: Record<ChurnStatus, string> = {
  active:   "active_q1",
  at_risk:  "risk_q1",
  inactive: "inactive_q1",
  churned:  "churned_q1",
  lead:     "lead_q1",
};

// ─── SURVEY STEPS ──────────────────────────────────────────────────────────────

const STEPS: Record<string, SurveyStep> = {

  // ── ACTIVE ────────────────────────────────────────────────────────────────

  active_q1: {
    id: "active_q1",
    dragonVoice: "O Dragão viu tudo. Mas quer ouvir de você 👀",
    question: "Seu pet amou a Comida de Dragão?",
    type: "yesno",
    onYes: "active_q2_sim",
    onNo:  "active_q2_nao",
  },

  active_q2_sim: {
    id: "active_q2_sim",
    dragonVoice: "Sem filtro — o Dragão só quer a verdade 🐉",
    question: "O produto foi o que você esperava?",
    type: "yesno",
    onYes: "active_q3",     // resolvido dinamicamente pelo segmento
    onNo:  "active_q2_nao_exp",
  },

  active_q2_nao_exp: {
    id: "active_q2_nao_exp",
    dragonVoice: "Opcional — mas vale muito. O Dragão lê tudo.",
    question: "Tem algo que poderia ter sido melhor?",
    type: "text",
    textPlaceholder: "Sua opinião ajuda a gente a melhorar...",
    onYes: "end_mel",       // "Continuar" navega para end_mel
  },

  active_q3_nova: {
    id: "active_q3_nova",
    dragonVoice: "Essa é a mais importante. O Dragão precisa saber.",
    question: "Você compraria de novo?",
    type: "yesno",
    onYes: "end_pos",
    onNo:  "end_inc",
  },

  active_q3_fiel: {
    id: "active_q3_fiel",
    dragonVoice: "A revolução cresce com a sua voz 🌿",
    question: "Você já indicou a Comida de Dragão pra alguém?",
    type: "yesno",
    onYes: "end_pos",
    onNo:  "end_inc",
  },

  active_q2_nao: {
    id: "active_q2_nao",
    dragonVoice: "Calma — o Dragão tem um truque pra isso 😄",
    question: "Você tentou oferecer de jeitos diferentes?",
    type: "yesno",
    onYes: "end_dica",
    onNo:  "end_how",
  },

  // ── AT RISK ───────────────────────────────────────────────────────────────

  risk_q1: {
    id: "risk_q1",
    dragonVoice: "O Dragão vê tudo — inclusive quando o pote acaba 👀",
    question: "O estoque acabou?",
    type: "yesno",
    onYes: "end_reab",
    onNo:  "risk_q2",
  },

  risk_q2: {
    id: "risk_q2",
    dragonVoice: "Sem filtro — o Dragão só quer a verdade 🐉",
    question: "Aconteceu algo com o produto ou com o pet?",
    type: "yesno",
    onYes: "risk_q3_sim",
    onNo:  "risk_q3_nao",
  },

  risk_q3_sim: {
    id: "risk_q3_sim",
    dragonVoice: "O Dragão quer entender pra poder ajudar.",
    question: "Foi com o produto (e não com o pet)?",
    type: "yesno",
    onYes: "end_prod",
    onNo:  "end_pet",
  },

  risk_q3_nao: {
    id: "risk_q3_nao",
    dragonVoice: "O Dragão entende. Sem julgamento.",
    question: "Foi por preço?",
    type: "yesno",
    onYes: "end_price_at",
    onNo:  "end_other",
  },

  // ── INACTIVE ──────────────────────────────────────────────────────────────

  inactive_q1: {
    id: "inactive_q1",
    dragonVoice: "O Dragão não deixa ninguém pra trás.",
    question: "Você parou de usar a Comida de Dragão?",
    type: "yesno",
    onYes: "inactive_q2",
    onNo:  "end_reab",    // só atrasou → reabastecer
  },

  inactive_q2: {
    id: "inactive_q2",
    dragonVoice: "O Dragão entende que pets são difíceis às vezes 😅",
    question: "Seu pet rejeitou o produto?",
    type: "yesno",
    onYes: "inactive_q3_sim",
    onNo:  "inactive_q3_nao",
  },

  inactive_q3_sim: {
    id: "inactive_q3_sim",
    dragonVoice: "Antes de desistir — o Dragão tem um truque.",
    question: "Você tentou misturar com a ração dele?",
    type: "yesno",
    onYes: "end_empat",
    onNo:  "end_trick",
  },

  inactive_q3_nao: {
    id: "inactive_q3_nao",
    dragonVoice: "O Dragão entende. Sem julgamento.",
    question: "Foi por preço?",
    type: "yesno",
    onYes: "end_price_in",
    onNo:  "end_text",
  },

  // ── CHURNED ───────────────────────────────────────────────────────────────

  churned_q1: {
    id: "churned_q1",
    dragonVoice: "O Dragão vê tudo — sem pressão, só curiosidade.",
    question: "Você ainda tem algum produto nosso em casa?",
    type: "yesno",
    onYes: "churned_q2_sim",
    onNo:  "churned_q2_nao",
  },

  churned_q2_sim: {
    id: "churned_q2_sim",
    dragonVoice: "Boa! O Dragão ficou feliz em saber.",
    question: "Você ficou esperando para pedir mais?",
    type: "yesno",
    onYes: "end_reab",
    onNo:  "end_novid",
  },

  churned_q2_nao: {
    id: "churned_q2_nao",
    dragonVoice: "O Dragão preparou algo especial. Pode ser direto?",
    question: "Você consideraria experimentar de novo com um cupom especial?",
    type: "yesno",
    onYes: "end_winback",
    onNo:  "churned_q3_nao",
  },

  churned_q3_nao: {
    id: "churned_q3_nao",
    dragonVoice: "O Dragão quer melhorar. Sua opinião vale muito.",
    question: "Tem algo que precisaria mudar no produto?",
    type: "yesno",
    onYes: "end_text_c",
    onNo:  "end_ok",
  },

  // ── LEAD ──────────────────────────────────────────────────────────────────

  lead_q1: {
    id: "lead_q1",
    dragonVoice: "O Dragão me pediu pra perguntar sem rodeios 🐉",
    question: "Você já conhece a Comida de Dragão?",
    type: "yesno",
    onYes: "lead_q2_sim",
    onNo:  "lead_q2_nao",
  },

  lead_q2_sim: {
    id: "lead_q2_sim",
    dragonVoice: "O Dragão ouve tudo. Literalmente.",
    question: "Alguma dúvida te impediu de experimentar?",
    type: "yesno",
    onYes: "lead_text",
    onNo:  "end_lead_pos",
  },

  lead_text: {
    id: "lead_text",
    dragonVoice: "Pode perguntar — o Dragão responde tudo.",
    question: "Qual é a sua dúvida?",
    type: "text",
    textPlaceholder: "Escreva aqui — a gente responde no WhatsApp...",
    onYes: "end_lead_duv",
  },

  lead_q2_nao: {
    id: "lead_q2_nao",
    dragonVoice: "Proteína de inseto pra pets — sustentável, hipoalergênica. O Dragão aprova.",
    question: "Quer conhecer?",
    type: "yesno",
    onYes: "end_lead_novo",
    onNo:  "end_lead_nao",
  },

  // ── END STATES ─────────────────────────────────────────────────────────────

  end_pos: {
    id: "end_pos", dragonVoice: "", question: "", type: "end",
    endConfig: {
      message: "Que bom! O Dragão ficou feliz. Tmj! 🐉",
      couponCode: "FALOUEDISSE", discountPercent: 15,
      ctaLabel: "Ver loja", ctaUrl: LOJA_URL,
    },
  },
  end_inc: {
    id: "end_inc", dragonVoice: "", question: "", type: "end",
    endConfig: {
      message: "Quando quiser voltar, a gente tá aqui. O Dragão reservou esse cupom pra você.",
      couponCode: "FALOUEDISSE", discountPercent: 15,
      ctaLabel: "Ver loja", ctaUrl: LOJA_URL,
    },
  },
  end_mel: {
    id: "end_mel", dragonVoice: "", question: "", type: "end",
    endConfig: {
      message: "Obrigado pela honestidade. Isso vale muito pro Dragão.",
      couponCode: "FALOUEDISSE", discountPercent: 15,
      ctaLabel: "Ver loja", ctaUrl: LOJA_URL,
    },
  },
  end_dica: {
    id: "end_dica", dragonVoice: "", question: "", type: "end",
    endConfig: {
      message: "Você fez o certo em tentar! O Dragão tem uma dica:",
      tip: "Misture 20% Comida de Dragão com a ração atual. Continue por 5 dias — muitos pets mudam de ideia.",
      couponCode: "FALOUEDISSE", discountPercent: 15,
      ctaLabel: "Ver loja", ctaUrl: LOJA_URL,
    },
  },
  end_how: {
    id: "end_how", dragonVoice: "", question: "", type: "end",
    endConfig: {
      message: "O Dragão tem um truque antes de desistir:",
      tip: "Misture 20% Comida de Dragão com a ração dele, nos primeiros 5 dias. Funciona na maioria dos pets.",
      couponCode: "FALOUEDISSE", discountPercent: 15,
      ctaLabel: "Ver loja", ctaUrl: LOJA_URL,
    },
  },
  end_reab: {
    id: "end_reab", dragonVoice: "", question: "", type: "end",
    endConfig: {
      message: "O Dragão reservou isso pra você. Sem deixar o estoque acabar de novo! 🐉",
      couponCode: "VOLTADRAGO", discountPercent: 20,
      ctaLabel: "Reabastecer agora", ctaUrl: LOJA_URL,
    },
  },
  end_prod: {
    id: "end_prod", dragonVoice: "", question: "", type: "end",
    endConfig: {
      message: "Registrei. O Dragão já foi avisado — chama no WhatsApp pra resolver.",
      couponCode: "VOLTADRAGO", discountPercent: 20,
      ctaLabel: "Chamar no WhatsApp", ctaUrl: WHATSAPP_URL,
      showWhatsApp: true,
    },
  },
  end_pet: {
    id: "end_pet", dragonVoice: "", question: "", type: "end",
    endConfig: {
      message: "O Dragão entende. Quando o pet estiver melhor, a gente tá aqui — sem pressão.",
      couponCode: "SEMPRESSA", discountPercent: 15,
      ctaLabel: "Ver loja", ctaUrl: LOJA_URL,
    },
  },
  end_price_at: {
    id: "end_price_at", dragonVoice: "", question: "", type: "end",
    endConfig: {
      message: "O Dragão entende. Aqui vai um presente.",
      couponCode: "PRECODRAGO", discountPercent: 25,
      ctaLabel: "Usar cupom agora", ctaUrl: LOJA_URL,
    },
  },
  end_other: {
    id: "end_other", dragonVoice: "", question: "", type: "end",
    endConfig: {
      message: "Obrigado por responder. O Dragão leu tudo.",
      couponCode: "FALOUEDISSE", discountPercent: 15,
      ctaLabel: "Ver loja", ctaUrl: LOJA_URL,
      hasTextField: true,
      textFieldPlaceholder: "Algo mais que queira compartilhar? (opcional)",
    },
  },
  end_empat: {
    id: "end_empat", dragonVoice: "", question: "", type: "end",
    endConfig: {
      message: "Você fez o certo em tentar. Chama no WhatsApp — a gente ajuda a encontrar o jeito certo.",
      couponCode: "TENTOUDRAGO", discountPercent: 20,
      ctaLabel: "Chamar no WhatsApp", ctaUrl: WHATSAPP_URL,
      showWhatsApp: true,
    },
  },
  end_trick: {
    id: "end_trick", dragonVoice: "", question: "", type: "end",
    endConfig: {
      message: "Antes de desistir — esse truque funciona na maioria dos pets:",
      tip: "Misture 20% Comida de Dragão + 80% ração atual, por 5 dias seguidos. O olfato dele vai se acostumar.",
      couponCode: "TENTOUDRAGO", discountPercent: 20,
      ctaLabel: "Tentar de novo", ctaUrl: LOJA_URL,
    },
  },
  end_price_in: {
    id: "end_price_in", dragonVoice: "", question: "", type: "end",
    endConfig: {
      message: "O Dragão preparou uma oferta especial pra você voltar.",
      couponCode: "PRECODRAGO", discountPercent: 25,
      ctaLabel: "Usar cupom agora", ctaUrl: LOJA_URL,
    },
  },
  end_text: {
    id: "end_text", dragonVoice: "", question: "", type: "end",
    endConfig: {
      message: "Obrigado pela honestidade. O Dragão leu tudo.",
      couponCode: "VOLTADRAGO", discountPercent: 20,
      ctaLabel: "Ver loja", ctaUrl: LOJA_URL,
      hasTextField: true,
      textFieldPlaceholder: "O que poderia ter sido diferente? (opcional)",
    },
  },
  end_winback: {
    id: "end_winback", dragonVoice: "", question: "", type: "end",
    endConfig: {
      message: "Esse cupom é pra provar que vale a pena voltar. O Dragão apostou em você. 🐉",
      couponCode: "SUMIU", discountPercent: 30,
      ctaLabel: "Voltar pra loja", ctaUrl: LOJA_URL,
    },
  },
  end_novid: {
    id: "end_novid", dragonVoice: "", question: "", type: "end",
    endConfig: {
      message: "O Dragão tem segredos. Fica atento — novidades chegando.",
      couponCode: "NOVIDADES", discountPercent: 15,
      ctaLabel: "Ver o que tem de novo", ctaUrl: LOJA_URL,
    },
  },
  end_text_c: {
    id: "end_text_c", dragonVoice: "", question: "", type: "end",
    endConfig: {
      message: "O Dragão ouviu. Sua opinião vai guiar os próximos passos.",
      couponCode: "VOLTADRAGO", discountPercent: 20,
      ctaLabel: "Ver loja", ctaUrl: LOJA_URL,
      hasTextField: true,
      textFieldPlaceholder: "O que precisaria mudar? (opcional)",
    },
  },
  end_ok: {
    id: "end_ok", dragonVoice: "", question: "", type: "end",
    endConfig: {
      message: "Tudo bem. Se mudar de ideia, a porta está aberta. O Dragão sempre tá aqui.",
      ctaLabel: "Ver loja", ctaUrl: LOJA_URL,
    },
  },
  end_lead_pos: {
    id: "end_lead_pos", dragonVoice: "", question: "", type: "end",
    endConfig: {
      message: "Que bom! Esse cupom é pra primeira experiência — o Dragão confia que vai valer a pena. 🐉",
      couponCode: "PRIMEIRODRAGO", discountPercent: 20,
      ctaLabel: "Fazer primeira compra", ctaUrl: LOJA_URL,
    },
  },
  end_lead_duv: {
    id: "end_lead_duv", dragonVoice: "", question: "", type: "end",
    endConfig: {
      message: "Sua dúvida vai pro Dragão agora. E aqui vai um presente pra primeira vez.",
      couponCode: "PRIMEIRODRAGO", discountPercent: 20,
      ctaLabel: "Chamar no WhatsApp", ctaUrl: WHATSAPP_URL,
      showWhatsApp: true,
    },
  },
  end_lead_novo: {
    id: "end_lead_novo", dragonVoice: "", question: "", type: "end",
    endConfig: {
      message: "Bem-vindo à revolução. Esse cupom é pra você começar com o pé direito.",
      couponCode: "DESCOBERTA", discountPercent: 15,
      ctaLabel: "Conhecer os produtos", ctaUrl: LOJA_URL,
    },
  },
  end_lead_nao: {
    id: "end_lead_nao", dragonVoice: "", question: "", type: "end",
    endConfig: {
      message: "Tudo bem. Quando a curiosidade bater, o Dragão tá aqui.",
      ctaLabel: "Ver loja", ctaUrl: LOJA_URL,
    },
  },
};

// ─── HELPERS ───────────────────────────────────────────────────────────────────

function resolveNextStep(stepId: string, answer: "yes" | "no", segment: Segment): string {
  const step = STEPS[stepId];
  const raw = answer === "yes" ? step.onYes : step.onNo;
  // Q3 do fluxo active é dinâmico — depende do segmento
  if (raw === "active_q3") {
    return segment === "fiel" || segment === "vip" ? "active_q3_fiel" : "active_q3_nova";
  }
  return raw || "";
}

// ─── YES/NO BUTTON ─────────────────────────────────────────────────────────────

const YesNoButton = ({
  value, selected, onSelect,
}: { value: "yes" | "no"; selected: "yes" | "no" | null; onSelect: (v: "yes" | "no") => void }) => {
  const isYes = value === "yes";
  const isSelected = selected === value;
  const base = "flex-1 py-6 md:py-8 rounded-2xl text-2xl md:text-3xl font-bold font-special transition-all duration-200 border-2 select-none cursor-pointer flex flex-col items-center gap-2";
  const active = isYes
    ? "bg-secondary text-secondary-foreground border-secondary scale-105 shadow-lg"
    : "bg-destructive text-destructive-foreground border-destructive scale-105 shadow-lg";
  const idle = "bg-background text-foreground border-border hover:scale-105 hover:shadow-md";
  return (
    <button type="button" className={`${base} ${isSelected ? active : idle}`} onClick={() => onSelect(value)}>
      <span className="text-3xl md:text-4xl">{isYes ? "✅" : "❌"}</span>
      <span>{isYes ? "SIM" : "NÃO"}</span>
    </button>
  );
};

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────

export const FeedbackSurvey = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const churn   = (searchParams.get("c") as ChurnStatus)  || "active";
  const segment = (searchParams.get("s") as Segment)       || "primeira";
  const name    = searchParams.get("name") || "";
  const firstName = name.split(" ")[0];

  const [started, setStarted]           = useState(false);
  const [customerName, setCustomerName] = useState(name);
  const [currentId, setCurrentId]       = useState<string>("");
  const [history, setHistory]           = useState<string[]>([]);
  const [selected, setSelected]         = useState<"yes" | "no" | null>(null);
  const [textAnswers, setTextAnswers]   = useState<Record<string, string>>({});
  const [endTextField, setEndTextField] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const step = STEPS[currentId] ?? null;
  const displayName = customerName.split(" ")[0] || firstName;

  // Progress: history length / estimated max path (4 questions)
  const progressCurrent = Math.min(history.length + 1, 4);
  const progressTotal   = 4;

  // ── Start ──────────────────────────────────────────────────────────────────
  const handleStart = () => {
    if (!customerName.trim()) return;
    const entryId = ENTRY_STEPS[churn] || "active_q1";
    setCurrentId(entryId);
    setHistory([]);
    setStarted(true);
  };

  // ── YES/NO ─────────────────────────────────────────────────────────────────
  const handleYesNo = (answer: "yes" | "no") => {
    setSelected(answer);
    setTimeout(() => {
      const next = resolveNextStep(currentId, answer, segment);
      if (!next) return;
      setHistory((h) => [...h, currentId]);
      setCurrentId(next);
      setSelected(null);
    }, 350);
  };

  // ── Text continue ──────────────────────────────────────────────────────────
  const handleTextContinue = () => {
    const next = step?.onYes || "";
    if (!next) return;
    setHistory((h) => [...h, currentId]);
    setCurrentId(next);
  };

  // ── Back ───────────────────────────────────────────────────────────────────
  const handleBack = () => {
    if (history.length === 0) { setStarted(false); return; }
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setCurrentId(prev);
    setSelected(null);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("feedback_responses").insert({
        customer_name:   customerName,
        pet_type:        segment,
        usage_time:      churn,
        nps_score:       null,
        expectations:    "survey_v3",
        motivations:     [],
        liked_most:      JSON.stringify(textAnswers),
        would_change:    endTextField || "",
        pet_acceptance:  "survey_v3",
        would_repurchase: history.includes("active_q3_nova") || history.includes("active_q3_fiel")
          ? "yes_definitely"
          : "survey_v3",
        no_repurchase_reason: null,
        ideal_product:   null,
      });
      if (error) throw error;

      localStorage.setItem("feedbackAnswers", JSON.stringify({
        customerName,
        segment,
        churn,
        pathTaken: [...history, currentId],
        textAnswers,
        wouldRepurchase: history.includes("end_pos") ? "yes" : "no",
      }));
      navigate("/results");
    } catch {
      toast({ title: "Erro ao enviar", description: "Não foi possível enviar. Tente novamente.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Welcome
  // ─────────────────────────────────────────────────────────────────────────────

  if (!started) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-lg text-center animate-in fade-in duration-500 space-y-6">
          <div className="flex justify-center">
            <img src={logo} alt="Comida de Dragão" className="w-56 md:w-72 h-auto" />
          </div>
          <p className="text-sm font-special text-muted-foreground italic leading-relaxed">
            "{OPENINGS[churn]}"
          </p>
          <h1 className="text-3xl md:text-4xl font-special font-bold text-question leading-tight">
            {firstName ? `${firstName}, são só 3 minutos. ` : "São só 3 minutos. "}
            Só sim e não. 🐉
          </h1>
          <p className="text-base font-special text-muted-foreground">
            No final tem um <span className="font-bold text-primary">mimo especial</span> esperando 💚
          </p>

          {!name && (
            <Input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && customerName.trim() && handleStart()}
              placeholder="Seu nome..."
              className="text-xl py-6 text-center font-special rounded-xl"
              autoFocus
            />
          )}

          <Button
            onClick={handleStart}
            disabled={!customerName.trim()}
            size="lg"
            className="w-full text-xl font-special py-6 rounded-full hover:scale-105 transition-transform"
          >
            Bora lá!
          </Button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: End State
  // ─────────────────────────────────────────────────────────────────────────────

  if (step?.type === "end") {
    const cfg = step.endConfig!;
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-lg animate-in fade-in duration-700 space-y-6">
          <div className="flex justify-center">
            <img src={logo} alt="Comida de Dragão" className="w-40 md:w-52 h-auto" />
          </div>

          <div className="text-center space-y-3">
            <div className="text-6xl">🐉</div>
            <h1 className="text-2xl md:text-3xl font-special font-bold text-question">
              {displayName ? `${displayName}, o Dragão agradece!` : "O Dragão agradece!"}
            </h1>
            <p className="text-base font-special text-foreground leading-relaxed">{cfg.message}</p>
          </div>

          {cfg.tip && (
            <div className="bg-secondary/10 border-2 border-secondary rounded-2xl p-4 text-center">
              <p className="text-sm md:text-base font-special text-foreground font-medium">
                💡 {cfg.tip}
              </p>
            </div>
          )}

          {cfg.couponCode && (
            <div className="bg-primary/10 border-2 border-primary rounded-2xl p-6 text-center space-y-2">
              <p className="text-sm font-special text-foreground">
                Seu cupom de <span className="font-bold">{cfg.discountPercent}% OFF</span>:
              </p>
              <div className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-full text-2xl md:text-3xl font-bold font-special tracking-widest">
                {cfg.couponCode}
              </div>
              <p className="text-xs font-special text-muted-foreground">Um uso por cliente · válido no site</p>
            </div>
          )}

          {cfg.hasTextField && (
            <Textarea
              value={endTextField}
              onChange={(e) => setEndTextField(e.target.value)}
              placeholder={cfg.textFieldPlaceholder}
              className="font-special text-base rounded-xl min-h-[100px] resize-none"
              maxLength={300}
            />
          )}

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            size="lg"
            className="w-full text-lg font-special py-6 rounded-full hover:scale-105 transition-transform"
          >
            {isSubmitting ? "Enviando..." : cfg.ctaLabel + " 🛒"}
          </Button>

          {cfg.showWhatsApp && cfg.ctaUrl !== WHATSAPP_URL && (
            <button
              onClick={() => window.open(WHATSAPP_URL, "_blank")}
              className="w-full text-sm font-special text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors"
            >
              Ou fale no WhatsApp: (21) 3950-0576
            </button>
          )}

          <p className="text-center text-xs font-special text-muted-foreground">
            P.S.: O Dragão vê tudo — inclusive quando você precisar de ajuda.
          </p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Question (yesno or text)
  // ─────────────────────────────────────────────────────────────────────────────

  if (!step) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <ProgressBar current={progressCurrent} total={progressTotal} />

        <button
          onClick={handleBack}
          className="mt-4 text-sm font-special text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          ← Voltar
        </button>

        <div className="mt-8 animate-in fade-in duration-300 space-y-6 text-center" key={currentId}>
          <p className="text-sm font-special text-muted-foreground italic">
            "{step.dragonVoice}"
          </p>

          <h2 className="text-2xl md:text-3xl font-special font-bold text-question leading-tight">
            {step.question}
          </h2>

          {displayName && step.type === "yesno" && (
            <p className="text-sm font-special text-muted-foreground">
              ({displayName}, pode ser direto — o Dragão prefere assim 😄)
            </p>
          )}

          {/* YES/NO */}
          {step.type === "yesno" && (
            <div className="flex gap-4 mt-4">
              <YesNoButton value="yes" selected={selected} onSelect={handleYesNo} />
              <YesNoButton value="no"  selected={selected} onSelect={handleYesNo} />
            </div>
          )}

          {/* TEXT */}
          {step.type === "text" && (
            <div className="space-y-4">
              <Textarea
                value={textAnswers[currentId] || ""}
                onChange={(e) => setTextAnswers((prev) => ({ ...prev, [currentId]: e.target.value }))}
                placeholder={step.textPlaceholder}
                className="font-special text-base rounded-xl min-h-[120px] resize-none"
                maxLength={300}
                autoFocus
              />
              <Button onClick={handleTextContinue} size="lg" className="w-full font-special py-6 rounded-full">
                Continuar
              </Button>
              <button
                onClick={handleTextContinue}
                className="text-sm font-special text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors"
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
