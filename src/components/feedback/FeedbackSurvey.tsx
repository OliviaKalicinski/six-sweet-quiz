import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import { ProgressBar } from "@/components/ProgressBar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";
import { captureEntryUtms, buildCheckoutUrl } from "@/lib/utm";

const LOJA_URL     = "https://www.comidadedragao.com.br/collections/produtos";
const WHATSAPP_URL = "https://wa.me/552139500576";
const HEAD_FONT    = "'Big Shoulders Display', sans-serif";
const UTM_FALLBACK = { utm_source: "survey", utm_medium: "whatsapp", utm_campaign: "survey" };

interface Opt { value: string; label: string; next: string }

interface EndConfig {
  headline: string;
  message: string;
  tip?: string;
  couponCode?: string;
  discountLabel?: string;
  ctaLabel: string;
  ctaUrl: string;
  hasTextField?: boolean;
  textPlaceholder?: string;
}

type Step =
  | { id: string; type: "choice"; voice: string; question: string; options: Opt[] }
  | { id: string; type: "nps";    voice: string; question: string; next: string }
  | { id: string; type: "text";   voice: string; question: string; placeholder?: string; next: string }
  | { id: string; type: "end";    end: EndConfig };

const STEPS: Record<string, Step> = {

  gate: {
    id: "gate", type: "choice",
    voice: "Antes de tudo, o Dragão quer saber uma coisa.",
    question: "VOCÊ JÁ COMPROU A COMIDA DE DRAGÃO?",
    options: [
      { value: "sim", label: "Sim, já comprei",  next: "buyer_nps" },
      { value: "nao", label: "Ainda não comprei", next: "ab_q1" },
    ],
  },

  buyer_nps: {
    id: "buyer_nps", type: "nps",
    voice: "O Dragão viu seu pet experimentar. Agora quer ouvir de você.",
    question: "DE 0 A 10, QUANTO VOCÊ INDICARIA A COMIDA DE DRAGÃO?",
    next: "buyer_reaction",
  },

  buyer_reaction: {
    id: "buyer_reaction", type: "choice",
    voice: "Sem filtro — só a verdade.",
    question: "E O SEU PET, COMO REAGIU?",
    options: [
      { value: "amou",    label: "Amou — come com vontade",   next: "buyer_pesou" },
      { value: "morno",   label: "Comeu, mas sem empolgação", next: "buyer_pesou" },
      { value: "recusou", label: "Recusou",                   next: "end_buyer_recusa" },
    ],
  },

  buyer_pesou: {
    id: "buyer_pesou", type: "choice",
    voice: "Isso ajuda o Dragão a melhorar.",
    question: "O QUE MAIS PESOU NA SUA ESCOLHA?",
    options: [
      { value: "qualidade",   label: "A qualidade / nutrição",               next: "__buyer_final__" },
      { value: "sustentavel", label: "Ser sustentável (proteína de inseto)", next: "__buyer_final__" },
      { value: "pet",         label: "Meu pet ter gostado",                  next: "__buyer_final__" },
      { value: "pratico",     label: "Praticidade",                          next: "__buyer_final__" },
      { value: "preco",       label: "O preço",                              next: "__buyer_final__" },
    ],
  },

  end_buyer_recusa: {
    id: "end_buyer_recusa", type: "end",
    end: {
      headline: "O SEGREDO DA ACEITAÇÃO",
      message:  "Antes de desistir: misture 20% da Comida de Dragão com 80% da ração por 5 dias. O olfato se acostuma e a aceitação dispara.",
      tip:      "Se mesmo assim recusar, o Dragão resolve com você no WhatsApp.",
      ctaLabel: "FALAR COM O DRAGÃO",
      ctaUrl:   WHATSAPP_URL,
    },
  },

  end_buyer_obrigado: {
    id: "end_buyer_obrigado", type: "end",
    end: {
      headline:        "O DRAGÃO AGRADECE",
      message:         "Sua resposta guia os próximos passos da revolução — e o Dragão não esquece quem tá junto.",
      couponCode:      "VOLTEI",
      discountLabel:   "10% OFF NO PRÓXIMO PEDIDO",
      hasTextField:    true,
      textPlaceholder: "Quer deixar um recado pro Dragão? (opcional)",
      ctaLabel:        "VER LOJA",
      ctaUrl:          LOJA_URL,
    },
  },

  ab_q1: {
    id: "ab_q1", type: "choice",
    voice: "O Dragão viu seu carrinho cheio… e depois vazio. Sem cobrança.",
    question: "O QUE TE SEGUROU NA HORA DE FINALIZAR?",
    options: [
      { value: "frete",     label: "O frete (valor ou prazo)",          next: "end_ab_frete" },
      { value: "preco",     label: "O preço do produto",                next: "end_ab_preco" },
      { value: "duvida",    label: "Dúvida se meu pet ia aceitar",      next: "end_ab_duvida" },
      { value: "distracao", label: "Só me distraí — ia voltar depois",  next: "end_ab_distracao" },
      { value: "outro",     label: "Outro motivo",                      next: "end_ab_outro" },
    ],
  },

  end_ab_frete: {
    id: "end_ab_frete", type: "end",
    end: {
      headline:      "O DRAGÃO PAGA O FRETE",
      message:       "Fechando acima de R$150, o frete é por conta do Dragão.",
      couponCode:    "FRETEDRAGAO",
      discountLabel: "FRETE GRÁTIS ACIMA DE R$150",
      ctaLabel:      "FINALIZAR MINHA COMPRA",
      ctaUrl:        LOJA_URL,
    },
  },

  end_ab_preco: {
    id: "end_ab_preco", type: "end",
    end: {
      headline:      "10% PRA FECHAR AGORA",
      message:       "O Dragão entende. Aqui vai 10% pra tirar o peso e finalizar.",
      couponCode:    "VOLTEI",
      discountLabel: "10% OFF",
      ctaLabel:      "FINALIZAR COM 10%",
      ctaUrl:        LOJA_URL,
    },
  },

  end_ab_duvida: {
    id: "end_ab_duvida", type: "end",
    end: {
      headline: "O SEGREDO DA ACEITAÇÃO",
      message:  "Quase todo pet aceita assim: misture 20% da Comida de Dragão com 80% da ração por 5 dias. O olfato se acostuma e a aceitação dispara.",
      tip:      "Se mesmo assim recusar, chama o Dragão no WhatsApp.",
      ctaLabel: "TIRAR DÚVIDA NO WHATSAPP",
      ctaUrl:   WHATSAPP_URL,
    },
  },

  end_ab_distracao: {
    id: "end_ab_distracao", type: "end",
    end: {
      headline:      "O DRAGÃO TE LEVA DE VOLTA",
      message:       "Acontece. 10% de desconto só por voltar e fechar agora.",
      couponCode:    "VOLTEI",
      discountLabel: "10% OFF",
      ctaLabel:      "VOLTAR PRA LOJA",
      ctaUrl:        LOJA_URL,
    },
  },

  end_ab_outro: {
    id: "end_ab_outro", type: "end",
    end: {
      headline:        "CONTA PRO DRAGÃO",
      message:         "O Dragão lê tudo. Se for algo que a gente resolve na hora, é só chamar.",
      hasTextField:    true,
      textPlaceholder: "O que te impediu de finalizar?",
      ctaLabel:        "CHAMAR NO WHATSAPP",
      ctaUrl:          WHATSAPP_URL,
    },
  },
};

const FLOW_TOTAL: Record<string, number> = { yes: 3, no: 1, gate: 4 };

export const FeedbackSurvey = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const tried = searchParams.get("tried");
  const name  = searchParams.get("name") || "";

  const [started, setStarted]           = useState(false);
  const [customerName, setCustomerName] = useState(name);

  const [currentId, setCurrentId]       = useState<string>("");
  const [history, setHistory]           = useState<string[]>([]);
  const [choices, setChoices]           = useState<Record<string, string>>({});
  const [nps, setNps]                   = useState<number | null>(null);
  const [npsSelected, setNpsSelected]   = useState<number | null>(null);
  const [texts, setTexts]               = useState<Record<string, string>>({});
  const [endText, setEndText]           = useState("");
  const [saved, setSaved]               = useState(false);

  const flowKey     = tried === "yes" ? "yes" : tried === "no" ? "no" : "gate";
  const step        = STEPS[currentId] ?? null;
  const displayName = customerName.split(" ")[0];

  // Captura a UTM que veio no link (Reportana etc.) — first-touch
  useEffect(() => { captureEntryUtms(); }, []);

  const answeredCount = history.filter((id) => { const t = STEPS[id]?.type; return t === "choice" || t === "nps" || t === "text"; }).length;
  const progressTotal = FLOW_TOTAL[flowKey];
  const progressCurrent = Math.min(answeredCount + 1, progressTotal);

  const handleStart = () => {
    if (!customerName.trim()) return;
    const entry = tried === "yes" ? "buyer_nps" : tried === "no" ? "ab_q1" : "gate";
    setCurrentId(entry);
    setHistory([]);
    setStarted(true);
  };

  const resolveNext = (raw: string): string => {
    if (raw === "__buyer_final__") return "end_buyer_obrigado";
    return raw;
  };

  const goTo = (next: string) => {
    setHistory((h) => [...h, currentId]);
    setCurrentId(resolveNext(next));
  };

  const handleChoice = (value: string, next: string) => {
    if (currentId) setChoices((c) => ({ ...c, [currentId]: value }));
    goTo(next);
  };

  const handleNps = (value: number, next: string) => {
    setNps(value);
    setNpsSelected(value);
    setTimeout(() => { goTo(next); setNpsSelected(null); }, 320);
  };

  const handleBack = () => {
    if (history.length === 0) { setStarted(false); return; }
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setCurrentId(prev);
  };

  const savingRef  = useRef(false);
  const savedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (step?.type !== "end" || saved || savingRef.current) return;
    savingRef.current = true;

    const doSave = async () => {
      try {
        const surveyPath = [...history, currentId];
        const surveyAnswers = {
          flow:      flowKey,
          nps,
          reaction:  choices["buyer_reaction"] || null,
          pesou:     choices["buyer_pesou"] || null,
          ab_reason: choices["ab_q1"] || null,
          gate:      choices["gate"] || null,
          end_text:  endText || "",
          ...texts,
        };
        const generatedId = crypto.randomUUID();
        savedIdRef.current = generatedId;

        const { error } = await supabase.from("feedback_responses").insert({
          id:               generatedId,
          customer_name:    customerName,
          phone:            null,
          nps_score:        nps ?? 0,
          pet_acceptance:   choices["buyer_reaction"] || "",
          usage_time:       tried || "",
          pet_type:         "",
          expectations:     "",
          motivations:      [],
          liked_most:       choices["buyer_pesou"] || "",
          would_change:     "",
          would_repurchase: "",
          survey_version:   "v5",
          survey_path:      surveyPath,
          survey_answers:   surveyAnswers,
          end_state:        currentId,
        });

        if (error) {
          console.error("Supabase insert error:", error);
          toast({ title: "Erro ao salvar", description: "Tente novamente mais tarde.", variant: "destructive" });
          savingRef.current = false;
          savedIdRef.current = null;
          return;
        }
        setSaved(true);
        localStorage.setItem("feedbackAnswers", JSON.stringify({ customerName, nps, choices, texts }));
      } catch {
        toast({ title: "Erro ao enviar", description: "Não foi possível enviar. Tente novamente.", variant: "destructive" });
        savingRef.current = false;
      }
    };
    doSave();
  }, [step?.type, saved]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCtaClick = (url: string) => {
    if (endText.trim() && savedIdRef.current) {
      supabase.from("feedback_responses")
        .update({ survey_answers: { flow: flowKey, nps, reaction: choices["buyer_reaction"] || null, pesou: choices["buyer_pesou"] || null, ab_reason: choices["ab_q1"] || null, end_text: endText, ...texts } })
        .eq("id", savedIdRef.current)
        .then(({ error }) => { if (error) console.error("End text update error:", error); });
    }
    const finalUrl = url.startsWith("https://wa.me") ? url : buildCheckoutUrl(url, UTM_FALLBACK, currentId);
    window.open(finalUrl, "_blank");
  };

  // ── WELCOME ──────────────────────────────────────────────────────────────
  if (!started) {
    return (
      <div className="grain min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md animate-in fade-in duration-500">
          <div className="flex justify-center mb-6">
            <img src={logo} alt="Comida de Dragão" className="w-32 md:w-40 h-auto" />
          </div>

          <p className="text-xs font-special text-muted-foreground italic mb-3 tracking-wide">"O Dragão quer trocar uma ideia rápida com você."</p>

          <h1 className="text-4xl md:text-5xl font-black uppercase leading-none text-foreground mb-3" style={{ fontFamily: HEAD_FONT, letterSpacing: "-0.02em" }}>
            {displayName ? `${displayName}, ` : ""}<span className="text-primary">RESPONDE O DRAGÃO.</span>
          </h1>

          <p className="text-sm font-special text-muted-foreground mb-6 leading-relaxed">
            Pesquisa rapidíssima da Comida de Dragão. São poucas perguntas e, no fim, um <span className="text-primary font-semibold">cupom é seu</span>.
          </p>

          <div className="w-full h-px bg-border mb-6" />

          {!name && (
            <div className="mb-6">
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2" style={{ fontFamily: HEAD_FONT }}>Seu nome</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleStart()}
                placeholder="Digite aqui..."
                className="w-full bg-transparent border-b-2 border-foreground/30 focus:border-primary outline-none text-foreground text-xl py-2 font-special transition-colors placeholder:text-muted-foreground"
                autoFocus
              />
            </div>
          )}

          <button
            onClick={handleStart}
            disabled={!customerName.trim()}
            className="w-full py-4 bg-primary text-primary-foreground text-2xl font-black uppercase tracking-wider hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ fontFamily: HEAD_FONT }}
          >
            BORA →
          </button>
        </div>
      </div>
    );
  }

  // ── END ────────────────────────────────────────────────────────────────────
  if (step?.type === "end") {
    const cfg = step.end;
    return (
      <div className="grain min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md animate-in fade-in duration-700">
          <div className="flex justify-center mb-5">
            <img src={logo} alt="Comida de Dragão" className="w-28 md:w-36 h-auto" />
          </div>

          <h1 className="text-3xl md:text-4xl font-black uppercase text-foreground leading-tight mb-3" style={{ fontFamily: HEAD_FONT }}>
            {displayName ? <>{displayName},<br /><span className="text-primary">{cfg.headline}</span></> : <span className="text-primary">{cfg.headline}</span>}
          </h1>

          <p className="text-sm md:text-base font-special text-muted-foreground mb-4 leading-relaxed">{cfg.message}</p>

          {cfg.tip && (
            <div className="border border-primary/40 p-3 mb-4">
              <p className="text-sm font-special text-foreground leading-relaxed"><span className="text-primary font-bold">// </span>{cfg.tip}</p>
            </div>
          )}

          {cfg.couponCode && (
            <div className="border-2 border-primary p-4 mb-4 text-center">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2" style={{ fontFamily: HEAD_FONT }}>SEU CUPOM — {cfg.discountLabel}</p>
              <div className="text-3xl md:text-4xl font-black text-primary tracking-widest" style={{ fontFamily: HEAD_FONT }}>{cfg.couponCode}</div>
              <p className="text-xs text-muted-foreground mt-2 font-special">Um uso por cliente · válido no site</p>
            </div>
          )}

          {cfg.hasTextField && (
            <Textarea
              value={endText}
              onChange={(e) => setEndText(e.target.value)}
              placeholder={cfg.textPlaceholder}
              className="bg-transparent border border-border text-foreground font-special text-sm rounded-none mb-4 min-h-[80px] resize-none focus:border-primary"
              maxLength={300}
            />
          )}

          <button
            onClick={() => handleCtaClick(cfg.ctaUrl)}
            className="w-full py-4 bg-primary text-primary-foreground font-black uppercase tracking-wider text-lg md:text-xl hover:opacity-90 active:scale-[0.98] transition-all"
            style={{ fontFamily: HEAD_FONT }}
          >
            {cfg.ctaLabel} →
          </button>

          <p className="text-center text-xs font-special text-muted-foreground mt-4">
            Precisou de ajuda? <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">(21) 3950-0576</a>
          </p>
        </div>
      </div>
    );
  }

  if (!step) return null;

  // ── QUESTION (choice / nps / text) ──────────────────────────────────────────
  return (
    <div className="grain min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <ProgressBar current={progressCurrent} total={progressTotal} />

        <button onClick={handleBack} className="mt-4 mb-6 text-xs uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors" style={{ fontFamily: HEAD_FONT }}>← VOLTAR</button>

        <div className="animate-in fade-in duration-300" key={currentId}>
          <p className="text-xs font-special text-muted-foreground italic mb-3 leading-relaxed">"{step.voice}"</p>

          <h2 className="text-2xl md:text-3xl font-black text-foreground uppercase leading-tight mb-5" style={{ fontFamily: HEAD_FONT, letterSpacing: "-0.01em" }}>{step.question}</h2>

          {step.type === "choice" && (
            <div className="space-y-2.5">
              {step.options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleChoice(opt.value, opt.next)}
                  className="w-full text-left px-4 py-3.5 border-2 border-foreground/30 text-foreground hover:border-primary hover:bg-primary/5 active:scale-[0.99] transition-all"
                >
                  <span className="text-base font-special font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          )}

          {step.type === "nps" && (
            <div className="space-y-3">
              <div className="flex flex-wrap justify-center gap-2">
                {Array.from({ length: 11 }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => handleNps(i, step.next)}
                    className={`w-11 h-11 border-2 font-black text-lg transition-all ${
                      npsSelected === i
                        ? "bg-primary text-primary-foreground border-primary scale-110"
                        : "bg-transparent text-foreground border-foreground/30 hover:border-primary hover:scale-105"
                    }`}
                    style={{ fontFamily: HEAD_FONT }}
                  >
                    {i}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground font-special px-1">
                <span>0 · não indicaria</span>
                <span>indicaria · 10</span>
              </div>
            </div>
          )}

          {step.type === "text" && (
            <div className="space-y-4">
              <Textarea
                value={texts[currentId] || ""}
                onChange={(e) => setTexts((p) => ({ ...p, [currentId]: e.target.value }))}
                placeholder={step.placeholder}
                className="bg-transparent border border-border text-foreground font-special text-base rounded-none min-h-[110px] resize-none focus:border-primary placeholder:text-muted-foreground"
                maxLength={300}
                autoFocus
              />
              <button onClick={() => goTo(step.next)} className="w-full py-4 bg-primary text-primary-foreground font-black uppercase tracking-wider text-xl hover:opacity-90 active:scale-[0.98] transition-all" style={{ fontFamily: HEAD_FONT }}>CONTINUAR →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
