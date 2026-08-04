import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import { ProgressBar } from "@/components/ProgressBar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";
import { captureEntryUtms, buildCheckoutUrl, getEntryUtms, getEntryParam } from "@/lib/utm";
import "./blog-style.css";

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
      hasTextField:    true,
      textPlaceholder: "Como foi a recusa? (cheirou e saiu, nem chegou perto, comeu e não quis mais…)",
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
      textPlaceholder: "O que seu pet fez na primeira vez que provou?",
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
      hasTextField:    true,
      textPlaceholder: "Quanto de frete você pagaria sem pensar duas vezes?",
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
      hasTextField:    true,
      textPlaceholder: "Você comparou com outro petisco? Qual, e por quanto?",
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
      hasTextField:    true,
      textPlaceholder: "Qual foi a dúvida? Escreve aqui que o Dragão responde no WhatsApp.",
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
      hasTextField:    true,
      textPlaceholder: "O que você tava fazendo quando parou?",
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
      textPlaceholder: "O que te impediu? Pode ser sincero, o Dragão aguenta.",
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
          utms:      getEntryUtms(),
          contact_id: getEntryParam("cid"),
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

  const persistEndText = () => {
    if (!endText.trim() || !savedIdRef.current) return;
    supabase.from("feedback_responses")
      .update({ survey_answers: { flow: flowKey, nps, reaction: choices["buyer_reaction"] || null, pesou: choices["buyer_pesou"] || null, ab_reason: choices["ab_q1"] || null, gate: choices["gate"] || null, end_text: endText, utms: getEntryUtms(), contact_id: getEntryParam("cid"), ...texts } })
      .eq("id", savedIdRef.current)
      .then(({ error }) => { if (error) console.error("End text persist error:", error); });
  };

  const handleCtaClick = (url: string) => {
    persistEndText();
    const finalUrl = url.startsWith("https://wa.me") ? url : buildCheckoutUrl(url, UTM_FALLBACK, currentId);
    window.open(finalUrl, "_blank");
  };

  // ── WELCOME ──────────────────────────────────────────────────────────────
  if (!started) {
    return (
      <div className="bd sv-screen">
        <div className="sv-wrap">
          <div className="bd-win">
            <div className="bd-win-bar">
              <span className="bd-btns">× − ▢</span>
              <span className="bd-grow" />
              <span className="bd-title">survey_do_dragão</span>
            </div>
            <div className="bd-win-body">
              <img src={logo} alt="Comida de Dragão" className="sv-brand" />
              <p className="sv-voice">// o Dragão quer trocar uma ideia rápida com você</p>
              <h1 className="sv-q sv-q-xl">
                {displayName ? `${displayName}, ` : ""}<span className="sv-hl">responde o Dragão.</span>
              </h1>
              <p className="sv-msg">Pesquisa rapidíssima. Poucas perguntas e, no fim, um <b>cupom é seu</b>.</p>
              {!name && (
                <div className="sv-field">
                  <label className="sv-flabel">Seu nome</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleStart()}
                    placeholder="digite aqui…"
                    className="sv-input"
                    autoFocus
                  />
                </div>
              )}
              <button onClick={handleStart} disabled={!customerName.trim()} className="bd-btn">Bora →</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── END ────────────────────────────────────────────────────────────────────
  if (step?.type === "end") {
    const cfg = step.end;
    return (
      <div className="bd sv-screen">
        <div className="sv-wrap">
          <div className="bd-win">
            <div className="bd-win-bar">
              <span className="bd-btns">× − ▢</span>
              <span className="bd-grow" />
              <span className="bd-title">resposta.txt</span>
            </div>
            <div className="bd-win-body">
              <h1 className="sv-q">{cfg.headline}</h1>
              <p className="sv-msg">{cfg.message}</p>
              {cfg.tip && <div className="sv-tip">{cfg.tip}</div>}
              {cfg.hasTextField && (
                <textarea
                  value={endText}
                  onChange={(e) => setEndText(e.target.value)}
                  onBlur={persistEndText}
                  placeholder={cfg.textPlaceholder}
                  className="sv-ta"
                  maxLength={300}
                />
              )}
              {cfg.couponCode && (
                <div className="sv-coupon">
                  <div className="l">seu cupom — {cfg.discountLabel}</div>
                  <div className="c">{cfg.couponCode}</div>
                  <div className="l" style={{ marginTop: "4px" }}>um uso por cliente · válido no site</div>
                </div>
              )}
              <button onClick={() => handleCtaClick(cfg.ctaUrl)} className="bd-btn">{cfg.ctaLabel} →</button>
              <p className="sv-help">Precisou de ajuda? <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">(21) 3950-0576</a></p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!step) return null;

  // ── QUESTION (choice / nps / text) ──────────────────────────────────────────
  return (
    <div className="bd sv-screen">
      <div className="sv-wrap">
        <div className="bd-win">
          <div className="bd-win-bar">
            <span className="bd-btns">× − ▢</span>
            <span className="bd-grow" />
            <span className="bd-title">survey_do_dragão</span>
          </div>
          <div className="bd-win-body">
            <button onClick={handleBack} className="sv-back">← voltar</button>
            <div className="sv-prog">// pergunta <b>{progressCurrent}</b> de {progressTotal}</div>
            <div key={currentId} className="sv-anim">
              <p className="sv-voice">{step.voice}</p>
              <h2 className="sv-q">{step.question}</h2>

              {step.type === "choice" && (
                <div className="sv-opts">
                  {step.options.map((opt) => (
                    <button key={opt.value} onClick={() => handleChoice(opt.value, opt.next)} className="sv-opt">
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {step.type === "nps" && (
                <div>
                  <div className="sv-nps">
                    {Array.from({ length: 11 }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => handleNps(i, step.next)}
                        className={`sv-npscell${npsSelected === i ? " sel" : ""}`}
                      >
                        {i}
                      </button>
                    ))}
                  </div>
                  <div className="sv-npslbl"><span>0 · não indicaria</span><span>indicaria · 10</span></div>
                </div>
              )}

              {step.type === "text" && (
                <div>
                  <textarea
                    value={texts[currentId] || ""}
                    onChange={(e) => setTexts((p) => ({ ...p, [currentId]: e.target.value }))}
                    placeholder={step.placeholder}
                    className="sv-ta"
                    maxLength={300}
                    autoFocus
                  />
                  <button onClick={() => goTo(step.next)} className="bd-btn">Continuar →</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
