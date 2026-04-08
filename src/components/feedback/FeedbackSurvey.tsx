import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import { ProgressBar } from "@/components/ProgressBar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ChurnStatus, Segment, SurveyStep } from "@/types/feedback";
import logo from "@/assets/logo.png";

// ─── CONSTANTS ─────────────────────────────────────────────────────────────────

const LOJA_URL     = "https://www.comidadedragao.com.br/collections/produtos";
const WHATSAPP_URL = "https://wa.me/552139500576";

const OPENINGS: Record<ChurnStatus, string> = {
  active:   "O Dragão me contou que você experimentou algo diferente. Conta pra gente como foi?",
  at_risk:  "O Dragão percebeu que você sumiu. Tá tudo bem com o pet e com você?",
  inactive: "O Dragão não deixa ninguém pra trás. Você sumiu há um tempo — o que aconteceu?",
  churned:  "O Dragão vê tudo. E eu sei que faz tempo que a gente não se fala. Estamos aqui — sem pressão.",
  lead:     "O Dragão tem um recado especial pra você. Pode ser direto?",
};

// Todos os fluxos começam pelo gate "já experimentou?"
const ENTRY_STEPS: Record<ChurnStatus, string> = {
  active:   "gate_tried",
  at_risk:  "gate_tried",
  inactive: "gate_tried",
  churned:  "gate_tried",
  lead:     "gate_tried",
};

// Após o gate, quem respondeu SIM vai pro fluxo original do churn
// Lead redireciona pro Active (se já experimentou, não faz sentido perguntar "já conhece?")
const CHURN_ENTRY: Record<ChurnStatus, string> = {
  active:   "active_q1",
  at_risk:  "risk_q1",
  inactive: "inactive_q1",
  churned:  "churned_q1",
  lead:     "active_q1",
};

// ─── ALL SURVEY STEPS ──────────────────────────────────────────────────────────

const STEPS: Record<string, SurveyStep> = {

  // ════════════════════════════════════════════════════════════════════════════
  // GATE — Você já experimentou Comida de Dragão?
  // ════════════════════════════════════════════════════════════════════════════

  gate_tried: {
    id: "gate_tried", type: "yesno",
    dragonVoice: "O Dragão quer saber uma coisa antes de tudo.",
    question: "VOCÊ JÁ EXPERIMENTOU COMIDA DE DRAGÃO?",
    onYes: "__churn_entry__",     // resolvido em runtime → vai pro fluxo do churn
    onNo:  "nottried_q1",
  },

  // ── Fluxo NÃO EXPERIMENTOU ────────────────────────────────────────────────

  nottried_q1: {
    id: "nottried_q1", type: "yesno",
    dragonVoice: "Sem julgamento — o Dragão só quer entender.",
    question: "VOCÊ JÁ OUVIU FALAR DA COMIDA DE DRAGÃO?",
    onYes: "nottried_q2_conhece",
    onNo:  "nottried_q2_nao_conhece",
  },

  nottried_q2_conhece: {
    id: "nottried_q2_conhece", type: "yesno",
    dragonVoice: "O Dragão quer saber o que te travou.",
    question: "ALGUMA COISA TE IMPEDIU DE EXPERIMENTAR?",
    onYes: "nottried_q3_barreira",
    onNo:  "end_nottried_curioso",
  },

  nottried_q3_barreira: {
    id: "nottried_q3_barreira", type: "yesno",
    dragonVoice: "Direto ao ponto — o Dragão respeita seu tempo.",
    question: "FOI POR PREÇO?",
    onYes: "end_nottried_preco",
    onNo:  "nottried_q4_psico",
  },

  nottried_q4_psico: {
    id: "nottried_q4_psico", type: "yesno",
    dragonVoice: "O Dragão entende — insetos causam estranheza no começo.",
    question: "FOI PELA BARREIRA PSICOLÓGICA COM INSETOS?",
    onYes: "end_nottried_barreira",
    onNo:  "end_nottried_outro",
  },

  nottried_q2_nao_conhece: {
    id: "nottried_q2_nao_conhece", type: "yesno",
    dragonVoice: "Proteína de inseto pra pets — sustentável, hipoalergênica, nutritiva.",
    question: "QUER CONHECER?",
    onYes: "end_nottried_novo",
    onNo:  "end_nottried_nao",
  },

  // ── END STATES — NÃO EXPERIMENTOU ─────────────────────────────────────────

  end_nottried_curioso: {
    id: "end_nottried_curioso", type: "end", dragonVoice: "", question: "",
    endConfig: { message: "O Dragão preparou um cupom pra você dar o primeiro passo. Sem risco.", couponCode: "FALOUEDISSE", discountPercent: 15, ctaLabel: "CONHECER OS PRODUTOS", ctaUrl: LOJA_URL },
  },
  end_nottried_preco: {
    id: "end_nottried_preco", type: "end", dragonVoice: "", question: "",
    endConfig: { message: "O Dragão entende. Aqui vai o maior cupom pra primeira compra.", couponCode: "FALOUEDISSE", discountPercent: 15, ctaLabel: "VER PRODUTOS COM DESCONTO", ctaUrl: LOJA_URL },
  },
  end_nottried_barreira: {
    id: "end_nottried_barreira", type: "end", dragonVoice: "", question: "",
    endConfig: { message: "O Dragão ouviu. Sua opinião vai ajudar a derrubar barreiras. Aqui vai um presente.", couponCode: "FALOUEDISSE", discountPercent: 15, ctaLabel: "EXPERIMENTAR AGORA", ctaUrl: LOJA_URL },
  },
  end_nottried_novo: {
    id: "end_nottried_novo", type: "end", dragonVoice: "", question: "",
    endConfig: { message: "Bem-vindo à revolução. Esse cupom é pra você começar.", couponCode: "FALOUEDISSE", discountPercent: 15, ctaLabel: "CONHECER OS PRODUTOS", ctaUrl: LOJA_URL },
  },
  end_nottried_outro: {
    id: "end_nottried_outro", type: "end", dragonVoice: "", question: "",
    endConfig: { message: "O Dragão ouviu. Sua opinião ajuda a gente a melhorar.", couponCode: "FALOUEDISSE", discountPercent: 15, ctaLabel: "EXPERIMENTAR AGORA", ctaUrl: LOJA_URL, hasTextField: true, textFieldPlaceholder: "Quer contar o que te impediu? (opcional)" },
  },
  end_nottried_nao: {
    id: "end_nottried_nao", type: "end", dragonVoice: "", question: "",
    endConfig: { message: "Tudo bem. Quando a curiosidade bater, o Dragão tá aqui.", ctaLabel: "VER LOJA", ctaUrl: LOJA_URL },
  },

  // ════════════════════════════════════════════════════════════════════════════
  // FLUXO ACTIVE — até 5 perguntas com profundidade real
  // ════════════════════════════════════════════════════════════════════════════

  // Q1 ── Pet amou?
  active_q1: {
    id: "active_q1", type: "yesno",
    dragonVoice: "O Dragão viu tudo. Mas quer ouvir de você.",
    question: "SEU PET AMOU A COMIDA DE DRAGÃO?",
    onYes: "active_q2",
    onNo:  "active_q2_pet_nao",
  },

  // Q2 ── (SIM no Q1) Produto foi o que esperava?
  active_q2: {
    id: "active_q2", type: "yesno",
    dragonVoice: "Sem filtro — o Dragão só quer a verdade.",
    question: "O PRODUTO FOI O QUE VOCÊ ESPERAVA?",
    onYes: "active_q3",       // dinâmico por segmento
    onNo:  "active_q2_prod_nao",
  },

  // Q2 ── (NÃO no Q1) Pet não aceitou — tentou de jeitos diferentes?
  active_q2_pet_nao: {
    id: "active_q2_pet_nao", type: "yesno",
    dragonVoice: "Antes de qualquer coisa — o Dragão precisa entender.",
    question: "VOCÊ TENTOU OFERECER DE JEITOS DIFERENTES?",
    onYes: "active_q3_pet_tentou",
    onNo:  "end_how",
  },

  // Q3 ── (pet tentou) Como tentou? → text
  active_q3_pet_tentou: {
    id: "active_q3_pet_tentou", type: "text",
    dragonVoice: "Isso nos ajuda muito. O Dragão vai levar isso a sério.",
    question: "COMO VOCÊ TENTOU OFERECER?",
    textPlaceholder: "Descreve o que aconteceu — quantidade, mistura, horário...",
    onYes: "end_dica",
  },

  // Q2 ── (NÃO no Q2) Produto não correspondeu → texto
  active_q2_prod_nao: {
    id: "active_q2_prod_nao", type: "text",
    dragonVoice: "O Dragão precisa ouvir isso. Sem julgamento.",
    question: "O QUE PODERIA TER SIDO MELHOR?",
    textPlaceholder: "Fala o que você esperava e o que veio...",
    onYes: "end_mel",
  },

  // Q3 ── (SIM no Q2) por segmento — dinâmico
  // Resolvido em runtime por resolveNextStep()

  // ── Q3 → Compraria? (primeira / recorrente) ──────────────────────────────

  active_q3_nova: {
    id: "active_q3_nova", type: "yesno",
    dragonVoice: "Essa é a mais importante. O Dragão precisa saber.",
    question: "VOCÊ COMPRARIA DE NOVO?",
    onYes: "active_q4_compraria_sim",
    onNo:  "active_q4_compraria_nao",
  },

  // Q4 ── (SIM no compraria) Conhece todos os produtos?
  active_q4_compraria_sim: {
    id: "active_q4_compraria_sim", type: "yesno",
    dragonVoice: "Ótimo! O Dragão tem mais pra mostrar.",
    question: "VOCÊ CONHECE TODOS OS NOSSOS PRODUTOS?",
    onYes: "end_pos",
    onNo:  "end_descoberta",
  },

  // Q4 ── (NÃO no compraria) Por que não? Preço?
  active_q4_compraria_nao: {
    id: "active_q4_compraria_nao", type: "yesno",
    dragonVoice: "Antes do cupom — o Dragão quer entender de verdade.",
    question: "FOI PRINCIPALMENTE POR PREÇO?",
    onYes: "end_price_compraria",
    onNo:  "active_q5_produto",
  },

  // Q5 ── (NÃO no preço) O que precisaria mudar? → text
  active_q5_produto: {
    id: "active_q5_produto", type: "text",
    dragonVoice: "Isso vale ouro pro Dragão. Fala com sinceridade.",
    question: "O QUE PRECISARIA SER DIFERENTE PARA VOCÊ COMPRAR DE NOVO?",
    textPlaceholder: "Produto, embalagem, sabor, formato, comunicação...",
    onYes: "end_mel",
  },

  // ── Q3 → Indicaria? (fiel / vip) ─────────────────────────────────────────

  active_q3_fiel: {
    id: "active_q3_fiel", type: "yesno",
    dragonVoice: "A revolução cresce com a sua voz.",
    question: "VOCÊ JÁ INDICOU A COMIDA DE DRAGÃO PRA ALGUÉM?",
    onYes: "active_q4_indicou_sim",
    onNo:  "active_q4_indicou_nao",
  },

  // Q4 ── (SIM indicou) A pessoa comprou?
  active_q4_indicou_sim: {
    id: "active_q4_indicou_sim", type: "yesno",
    dragonVoice: "A revolução se espalha. O Dragão viu tudo.",
    question: "A PESSOA QUE VOCÊ INDICOU TAMBÉM COMPROU?",
    onYes: "end_pos",
    onNo:  "end_indica_compartilha",
  },

  // Q4 ── (NÃO indicou) Teve oportunidade?
  active_q4_indicou_nao: {
    id: "active_q4_indicou_nao", type: "yesno",
    dragonVoice: "O Dragão quer entender — sem pressão.",
    question: "VOCÊ JÁ TEVE OPORTUNIDADE DE INDICAR?",
    onYes: "active_q5_indica",       // teve mas não indicou → precisa ouvir
    onNo:  "end_indica_oport",       // não teve chance ainda → OK, cupom pra quando tiver
  },

  // Q5 ── (teve mas não indicou) O que impediu? → text
  active_q5_indica: {
    id: "active_q5_indica", type: "text",
    dragonVoice: "Isso é importante. O Dragão precisa saber o que está faltando.",
    question: "O QUE TE IMPEDIU DE INDICAR?",
    textPlaceholder: "Insegurança com o produto? Não soube como apresentar? Outro motivo?",
    onYes: "end_mel",
  },

  // ════════════════════════════════════════════════════════════════════════════
  // FLUXO AT RISK
  // ════════════════════════════════════════════════════════════════════════════

  risk_q1: {
    id: "risk_q1", type: "yesno",
    dragonVoice: "O Dragão vê tudo — inclusive quando o pote acaba.",
    question: "O ESTOQUE ACABOU?",
    onYes: "end_reab", onNo: "risk_q2",
  },
  risk_q2: {
    id: "risk_q2", type: "yesno",
    dragonVoice: "Sem filtro — o Dragão só quer a verdade.",
    question: "ACONTECEU ALGO COM O PRODUTO OU COM O PET?",
    onYes: "risk_q3_sim", onNo: "risk_q3_nao",
  },
  risk_q3_sim: {
    id: "risk_q3_sim", type: "yesno",
    dragonVoice: "O Dragão quer entender pra poder ajudar.",
    question: "FOI COM O PRODUTO (E NÃO COM O PET)?",
    onYes: "end_prod", onNo: "end_pet",
  },
  risk_q3_nao: {
    id: "risk_q3_nao", type: "yesno",
    dragonVoice: "O Dragão entende. Sem julgamento.",
    question: "FOI POR PREÇO?",
    onYes: "end_price_at", onNo: "end_other",
  },

  // ════════════════════════════════════════════════════════════════════════════
  // FLUXO INACTIVE
  // ════════════════════════════════════════════════════════════════════════════

  inactive_q1: {
    id: "inactive_q1", type: "yesno",
    dragonVoice: "O Dragão não deixa ninguém pra trás.",
    question: "VOCÊ PAROU DE USAR A COMIDA DE DRAGÃO?",
    onYes: "inactive_q2", onNo: "end_reab",
  },
  inactive_q2: {
    id: "inactive_q2", type: "yesno",
    dragonVoice: "O Dragão entende que pets são difíceis às vezes.",
    question: "SEU PET REJEITOU O PRODUTO?",
    onYes: "inactive_q3_sim", onNo: "inactive_q3_nao",
  },
  inactive_q3_sim: {
    id: "inactive_q3_sim", type: "yesno",
    dragonVoice: "Antes de desistir — o Dragão tem um truque.",
    question: "VOCÊ TENTOU MISTURAR COM A RAÇÃO DELE?",
    onYes: "end_empat", onNo: "end_trick",
  },
  inactive_q3_nao: {
    id: "inactive_q3_nao", type: "yesno",
    dragonVoice: "O Dragão entende. Sem julgamento.",
    question: "FOI POR PREÇO?",
    onYes: "end_price_in", onNo: "end_text",
  },

  // ════════════════════════════════════════════════════════════════════════════
  // FLUXO CHURNED
  // ════════════════════════════════════════════════════════════════════════════

  churned_q1: {
    id: "churned_q1", type: "yesno",
    dragonVoice: "O Dragão vê tudo — sem pressão, só curiosidade.",
    question: "VOCÊ AINDA TEM ALGUM PRODUTO NOSSO EM CASA?",
    onYes: "churned_q2_sim", onNo: "churned_q2_nao",
  },
  churned_q2_sim: {
    id: "churned_q2_sim", type: "yesno",
    dragonVoice: "O Dragão ficou feliz em saber.",
    question: "VOCÊ FICOU ESPERANDO PARA PEDIR MAIS?",
    onYes: "end_reab", onNo: "end_novid",
  },
  churned_q2_nao: {
    id: "churned_q2_nao", type: "yesno",
    dragonVoice: "O Dragão preparou algo especial. Pode ser direto?",
    question: "VOCÊ CONSIDERARIA EXPERIMENTAR DE NOVO COM UM CUPOM ESPECIAL?",
    onYes: "end_winback", onNo: "churned_q3_nao",
  },
  churned_q3_nao: {
    id: "churned_q3_nao", type: "yesno",
    dragonVoice: "O Dragão quer melhorar. Sua opinião vale muito.",
    question: "TEM ALGO QUE PRECISARIA MUDAR NO PRODUTO?",
    onYes: "end_text_c", onNo: "end_ok",
  },

  // ════════════════════════════════════════════════════════════════════════════
  // FLUXO LEAD
  // ════════════════════════════════════════════════════════════════════════════

  lead_q1: {
    id: "lead_q1", type: "yesno",
    dragonVoice: "O Dragão me pediu pra perguntar sem rodeios.",
    question: "VOCÊ JÁ CONHECE A COMIDA DE DRAGÃO?",
    onYes: "lead_q2_sim", onNo: "lead_q2_nao",
  },
  lead_q2_sim: {
    id: "lead_q2_sim", type: "yesno",
    dragonVoice: "O Dragão ouve tudo. Literalmente.",
    question: "ALGUMA DÚVIDA TE IMPEDIU DE EXPERIMENTAR?",
    onYes: "lead_text", onNo: "end_lead_pos",
  },
  lead_text: {
    id: "lead_text", type: "text",
    dragonVoice: "Pode perguntar — o Dragão responde tudo.",
    question: "QUAL É A SUA DÚVIDA?",
    textPlaceholder: "Escreva aqui — a gente responde no WhatsApp...",
    onYes: "end_lead_duv",
  },
  lead_q2_nao: {
    id: "lead_q2_nao", type: "yesno",
    dragonVoice: "Proteína de inseto pra pets — sustentável, hipoalergênica.",
    question: "QUER CONHECER?",
    onYes: "end_lead_novo", onNo: "end_lead_nao",
  },

  // ════════════════════════════════════════════════════════════════════════════
  // END STATES
  // ════════════════════════════════════════════════════════════════════════════

  // ── Positivos ──────────────────────────────────────────────────────────────
  end_pos: {
    id: "end_pos", type: "end", dragonVoice: "", question: "",
    endConfig: { message: "Que bom. O Dragão ficou feliz. Tmj!", couponCode: "FALOUEDISSE", discountPercent: 15, ctaLabel: "VER LOJA", ctaUrl: LOJA_URL },
  },
  end_descoberta: {
    id: "end_descoberta", type: "end", dragonVoice: "", question: "",
    endConfig: { message: "Tem muito que você ainda não viu. O Dragão preparou um cupom pra você explorar.", couponCode: "FALOUEDISSE", discountPercent: 15, ctaLabel: "VER CATÁLOGO COMPLETO", ctaUrl: LOJA_URL },
  },
  end_indica_compartilha: {
    id: "end_indica_compartilha", type: "end", dragonVoice: "", question: "",
    endConfig: { message: "A revolução se espalha uma indicação de cada vez. Aqui vai um cupom pra você compartilhar com ela.", tip: "Manda esse código pra ela: FALOUEDISSE — 15% na primeira compra.", couponCode: "FALOUEDISSE", discountPercent: 15, ctaLabel: "VER LOJA", ctaUrl: LOJA_URL },
  },
  end_indica_oport: {
    id: "end_indica_oport", type: "end", dragonVoice: "", question: "",
    endConfig: { message: "Quando a oportunidade chegar, esse cupom é pra você dividir.", tip: "Guarda esse código: FALOUEDISSE — 15% pra quem você indicar.", couponCode: "FALOUEDISSE", discountPercent: 15, ctaLabel: "VER LOJA", ctaUrl: LOJA_URL },
  },

  // ── Melhorias / Feedback ───────────────────────────────────────────────────
  end_mel: {
    id: "end_mel", type: "end", dragonVoice: "", question: "",
    endConfig: { message: "Obrigado pela honestidade. Isso vale mais do que qualquer avaliação 5 estrelas.", couponCode: "FALOUEDISSE", discountPercent: 15, ctaLabel: "VER LOJA", ctaUrl: LOJA_URL },
  },
  end_dica: {
    id: "end_dica", type: "end", dragonVoice: "", question: "",
    endConfig: { message: "O Dragão anotou. Aqui vai uma dica baseada no que você descreveu:", tip: "Ofereça como petisco depois de atividade ou treino — o apetite ajuda na aceitação. Misture 20% com a ração nos primeiros dias.", couponCode: "FALOUEDISSE", discountPercent: 15, ctaLabel: "VER LOJA", ctaUrl: LOJA_URL },
  },
  end_how: {
    id: "end_how", type: "end", dragonVoice: "", question: "",
    endConfig: { message: "Antes de desistir — esse truque funciona na maioria dos pets:", tip: "Misture 20% Comida de Dragão + 80% ração, por 5 dias seguidos. O olfato dele vai se acostumar.", couponCode: "FALOUEDISSE", discountPercent: 15, ctaLabel: "TENTAR DE NOVO", ctaUrl: LOJA_URL },
  },

  // ── Preço ──────────────────────────────────────────────────────────────────
  end_price_compraria: {
    id: "end_price_compraria", type: "end", dragonVoice: "", question: "",
    endConfig: { message: "O Dragão entende. Aqui vai o maior cupom que temos.", couponCode: "FALOUEDISSE", discountPercent: 15, ctaLabel: "USAR CUPOM AGORA", ctaUrl: LOJA_URL },
  },
  end_price_at: {
    id: "end_price_at", type: "end", dragonVoice: "", question: "",
    endConfig: { message: "O Dragão entende. Aqui vai um presente.", couponCode: "FALOUEDISSE", discountPercent: 15, ctaLabel: "USAR CUPOM AGORA", ctaUrl: LOJA_URL },
  },
  end_price_in: {
    id: "end_price_in", type: "end", dragonVoice: "", question: "",
    endConfig: { message: "O Dragão preparou uma oferta especial pra você voltar.", couponCode: "FALOUEDISSE", discountPercent: 15, ctaLabel: "USAR CUPOM AGORA", ctaUrl: LOJA_URL },
  },

  // ── Reabastecimento ────────────────────────────────────────────────────────
  end_reab: {
    id: "end_reab", type: "end", dragonVoice: "", question: "",
    endConfig: { message: "O Dragão reservou isso pra você. Sem deixar o estoque acabar de novo.", couponCode: "FALOUEDISSE", discountPercent: 15, ctaLabel: "REABASTECER AGORA", ctaUrl: LOJA_URL },
  },

  // ── Problema produto / pet ─────────────────────────────────────────────────
  end_prod: {
    id: "end_prod", type: "end", dragonVoice: "", question: "",
    endConfig: { message: "Registrei. O Dragão já foi avisado — chama no WhatsApp pra resolver.", couponCode: "FALOUEDISSE", discountPercent: 15, ctaLabel: "CHAMAR NO WHATSAPP", ctaUrl: WHATSAPP_URL, showWhatsApp: true },
  },
  end_pet: {
    id: "end_pet", type: "end", dragonVoice: "", question: "",
    endConfig: { message: "O Dragão entende. Quando o pet estiver melhor, a gente tá aqui — sem pressão.", couponCode: "FALOUEDISSE", discountPercent: 15, ctaLabel: "VER LOJA", ctaUrl: LOJA_URL },
  },
  end_empat: {
    id: "end_empat", type: "end", dragonVoice: "", question: "",
    endConfig: { message: "Você fez o certo em tentar. Chama no WhatsApp — a gente ajuda a encontrar o jeito certo.", couponCode: "FALOUEDISSE", discountPercent: 15, ctaLabel: "CHAMAR NO WHATSAPP", ctaUrl: WHATSAPP_URL, showWhatsApp: true },
  },
  end_trick: {
    id: "end_trick", type: "end", dragonVoice: "", question: "",
    endConfig: { message: "Antes de desistir — esse truque funciona:", tip: "Misture 20% Comida de Dragão + 80% ração, por 5 dias seguidos. O olfato dele vai se acostumar.", couponCode: "FALOUEDISSE", discountPercent: 15, ctaLabel: "TENTAR DE NOVO", ctaUrl: LOJA_URL },
  },

  // ── Com texto opcional ─────────────────────────────────────────────────────
  end_other: {
    id: "end_other", type: "end", dragonVoice: "", question: "",
    endConfig: { message: "Obrigado por responder. O Dragão leu tudo.", couponCode: "FALOUEDISSE", discountPercent: 15, ctaLabel: "VER LOJA", ctaUrl: LOJA_URL, hasTextField: true, textFieldPlaceholder: "Algo mais que queira compartilhar? (opcional)" },
  },
  end_text: {
    id: "end_text", type: "end", dragonVoice: "", question: "",
    endConfig: { message: "Obrigado pela honestidade. O Dragão leu tudo.", couponCode: "FALOUEDISSE", discountPercent: 15, ctaLabel: "VER LOJA", ctaUrl: LOJA_URL, hasTextField: true, textFieldPlaceholder: "O que poderia ter sido diferente? (opcional)" },
  },
  end_text_c: {
    id: "end_text_c", type: "end", dragonVoice: "", question: "",
    endConfig: { message: "O Dragão ouviu. Sua opinião vai guiar os próximos passos.", couponCode: "FALOUEDISSE", discountPercent: 15, ctaLabel: "VER LOJA", ctaUrl: LOJA_URL, hasTextField: true, textFieldPlaceholder: "O que precisaria mudar? (opcional)" },
  },

  // ── Churned win-back ───────────────────────────────────────────────────────
  end_winback: {
    id: "end_winback", type: "end", dragonVoice: "", question: "",
    endConfig: { message: "Esse cupom é pra provar que vale a pena voltar. O Dragão apostou em você.", couponCode: "FALOUEDISSE", discountPercent: 15, ctaLabel: "VOLTAR PRA LOJA", ctaUrl: LOJA_URL },
  },
  end_novid: {
    id: "end_novid", type: "end", dragonVoice: "", question: "",
    endConfig: { message: "O Dragão tem segredos. Fica atento — novidades chegando.", couponCode: "FALOUEDISSE", discountPercent: 15, ctaLabel: "VER O QUE TEM DE NOVO", ctaUrl: LOJA_URL },
  },
  end_ok: {
    id: "end_ok", type: "end", dragonVoice: "", question: "",
    endConfig: { message: "Tudo bem. Se mudar de ideia, a porta está aberta. O Dragão sempre tá aqui.", ctaLabel: "VER LOJA", ctaUrl: LOJA_URL },
  },

  // ── Lead ───────────────────────────────────────────────────────────────────
  end_lead_pos: {
    id: "end_lead_pos", type: "end", dragonVoice: "", question: "",
    endConfig: { message: "Esse cupom é pra primeira experiência — o Dragão confia que vai valer a pena.", couponCode: "FALOUEDISSE", discountPercent: 15, ctaLabel: "FAZER PRIMEIRA COMPRA", ctaUrl: LOJA_URL },
  },
  end_lead_duv: {
    id: "end_lead_duv", type: "end", dragonVoice: "", question: "",
    endConfig: { message: "Sua dúvida vai pro Dragão agora. E aqui vai um presente pra primeira vez.", couponCode: "FALOUEDISSE", discountPercent: 15, ctaLabel: "CHAMAR NO WHATSAPP", ctaUrl: WHATSAPP_URL, showWhatsApp: true },
  },
  end_lead_novo: {
    id: "end_lead_novo", type: "end", dragonVoice: "", question: "",
    endConfig: { message: "Bem-vindo à revolução. Esse cupom é pra você começar.", couponCode: "FALOUEDISSE", discountPercent: 15, ctaLabel: "CONHECER OS PRODUTOS", ctaUrl: LOJA_URL },
  },
  end_lead_nao: {
    id: "end_lead_nao", type: "end", dragonVoice: "", question: "",
    endConfig: { message: "Tudo bem. Quando a curiosidade bater, o Dragão tá aqui.", ctaLabel: "VER LOJA", ctaUrl: LOJA_URL },
  },
};

// ─── HELPERS ───────────────────────────────────────────────────────────────────

function resolveNextStep(stepId: string, answer: "yes" | "no", segment: Segment, churn: ChurnStatus): string {
  const step = STEPS[stepId];
  const raw  = answer === "yes" ? step.onYes : step.onNo;
  // Gate: SIM → vai pro fluxo do churn status
  if (raw === "__churn_entry__") {
    return CHURN_ENTRY[churn] || "active_q1";
  }
  // Q3 do fluxo active: depende do segmento do cliente
  if (raw === "active_q3") {
    return segment === "fiel" || segment === "vip" ? "active_q3_fiel" : "active_q3_nova";
  }
  return raw || "";
}

// Conta quantos passos SIM/NÃO (não texto) estão no caminho percorrido
function countDecisionSteps(history: string[]): number {
  return history.filter((id) => STEPS[id]?.type === "yesno").length;
}

// ─── YES/NO BUTTON ─────────────────────────────────────────────────────────────

const YesNoButton = ({
  value, selected, onSelect,
}: { value: "yes" | "no"; selected: "yes" | "no" | null; onSelect: (v: "yes" | "no") => void }) => {
  const isYes      = value === "yes";
  const isSelected = selected === value;

  const base = [
    "flex-1 py-8 md:py-10",
    "border-2 transition-all duration-200 select-none cursor-pointer",
    "flex flex-col items-center gap-2 uppercase tracking-wider",
  ].join(" ");

  const activeStyle = isYes
    ? "bg-primary text-primary-foreground border-primary scale-[1.03] shadow-[0_0_24px_rgba(204,255,0,0.35)]"
    : "bg-destructive text-destructive-foreground border-destructive scale-[1.03] shadow-[0_0_24px_rgba(255,128,0,0.35)]";

  const idleStyle = "bg-transparent text-foreground border-foreground/30 hover:border-foreground hover:scale-[1.02]";

  return (
    <button
      type="button"
      className={`${base} ${isSelected ? activeStyle : idleStyle}`}
      style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
      onClick={() => onSelect(value)}
    >
      <span className="text-4xl md:text-5xl font-black leading-none">
        {isYes ? "SIM" : "NÃO"}
      </span>
      <span className="text-2xl">{isYes ? "✓" : "✗"}</span>
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

  const [started, setStarted]           = useState(false);
  const [customerName, setCustomerName] = useState(name);
  const [currentId, setCurrentId]       = useState<string>("");
  const [history, setHistory]           = useState<string[]>([]);
  const [selected, setSelected]         = useState<"yes" | "no" | null>(null);
  const [textAnswers, setTextAnswers]   = useState<Record<string, string>>({});
  const [endTextField, setEndTextField] = useState("");
  
  const [phone, setPhone]               = useState("");
  const [phoneCollected, setPhoneCollected] = useState(false);
  const [phoneError, setPhoneError]     = useState("");
  const [saved, setSaved]               = useState(false);

  const step        = STEPS[currentId] ?? null;
  const displayName = customerName.split(" ")[0];

  // Barra de progresso: baseada nas decisões tomadas
  const decisionsTaken  = countDecisionSteps(history);
  const progressCurrent = Math.min(decisionsTaken + 1, 5);
  const progressTotal   = 5;

  // ── Phone helpers ───────────────────────────────────────────────────────────
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2)  return digits;
    if (digits.length <= 7)  return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
    setPhoneError("");
  };

  const handlePhoneSubmit = () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length > 0 && digits.length < 10) {
      setPhoneError("Telefone inválido. Coloca DDD + número.");
      return;
    }
    localStorage.setItem("feedbackPhone", phone);
    setPhoneCollected(true);
  };

  const handlePhoneSkip = () => {
    setPhoneCollected(true);
  };

  // ── Start ──────────────────────────────────────────────────────────────────
  const handleStart = () => {
    if (!customerName.trim()) return;
    setCurrentId(ENTRY_STEPS[churn] || "active_q1");
    setHistory([]);
    setStarted(true);
  };

  // ── YES/NO ─────────────────────────────────────────────────────────────────
  const handleYesNo = (answer: "yes" | "no") => {
    setSelected(answer);
    setTimeout(() => {
      const next = resolveNextStep(currentId, answer, segment, churn);
      if (!next) return;
      setHistory((h) => [...h, currentId]);
      setCurrentId(next);
      setSelected(null);
    }, 320);
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

  // ── Auto-save when reaching end state ──────────────────────────────────────
  const savingRef  = useRef(false);
  const savedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (step?.type !== "end" || saved || savingRef.current) return;
    savingRef.current = true;

    const doSave = async () => {
      try {
        const surveyPath = [...history, currentId];
        const surveyAnswersData = {
          ...textAnswers,
          end_text: endTextField || "",
        };

        const { data: insertData, error } = await supabase.from("feedback_responses").insert({
          customer_name:        customerName,
          phone:                null,
          pet_type:             segment,
          usage_time:           churn,
          segment:              segment,
          churn_status:         churn,
          nps_score:            0,
          expectations:         "",
          motivations:          [],
          liked_most:           "",
          would_change:         "",
          pet_acceptance:       "",
          would_repurchase:     "",
          survey_version:       "v4",
          survey_path:          surveyPath,
          survey_answers:       surveyAnswersData,
          end_state:            currentId,
        }).select("id").single();
        if (error) {
          console.error("Supabase insert error:", error);
          toast({ title: "Erro ao salvar", description: "Tente novamente mais tarde.", variant: "destructive" });
          savingRef.current = false;
          return;
        }
        savedIdRef.current = insertData?.id ?? null;
        setSaved(true);
        localStorage.setItem("feedbackSubmitted", JSON.stringify({ timestamp: Date.now() }));
        localStorage.setItem("feedbackAnswers", JSON.stringify({
          customerName, segment, churn,
          pathTaken: [...history, currentId],
          textAnswers,
          phone: phone || "",
        }));
      } catch {
        toast({ title: "Erro ao enviar", description: "Não foi possível enviar. Tente novamente.", variant: "destructive" });
        savingRef.current = false;
      }
    };
    doSave();
  }, [step?.type, saved]);

  // ── Update phone in DB after phone collection ─────────────────────────────
  useEffect(() => {
    if (!phoneCollected || !phone || !saved || !savedIdRef.current) return;
    supabase.from("feedback_responses")
      .update({ phone })
      .eq("id", savedIdRef.current)
      .then(({ error }) => {
        if (error) console.error("Phone update error:", error);
      });
  }, [phoneCollected]);

  // ── CTA click — atualiza endTextField se preenchido, depois navega ────────
  const handleCtaClick = (url?: string) => {
    if (endTextField.trim() && savedIdRef.current) {
      const updatedAnswers = { ...textAnswers, end_text: endTextField };
      supabase.from("feedback_responses")
        .update({ survey_answers: updatedAnswers })
        .eq("id", savedIdRef.current)
        .then(({ error }) => {
          if (error) console.error("EndTextField update error:", error);
        });
    }
    if (url) window.open(url, "_blank");
    navigate("/results");
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER — WELCOME
  // ─────────────────────────────────────────────────────────────────────────────

  if (!started) {
    return (
      <div className="grain min-h-screen bg-background flex flex-col items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-lg animate-in fade-in duration-500">

          <div className="flex justify-center mb-10">
            <img src={logo} alt="Comida de Dragão" className="w-44 md:w-56 h-auto" />
          </div>

          <p className="text-xs font-special text-muted-foreground italic mb-6 tracking-wide">
            "{ OPENINGS[churn] }"
          </p>

          <h1
            className="text-5xl md:text-7xl font-black uppercase leading-none text-foreground mb-2"
            style={{ fontFamily: "'Big Shoulders Display', sans-serif", letterSpacing: "-0.02em" }}
          >
            {displayName ? `${displayName},` : ""}
            <br />
            <span className="text-primary">SÓ SIM</span>
            <br />
            E NÃO.
          </h1>

          <p className="text-sm font-special text-muted-foreground mt-4 mb-8">
            5 perguntas. No final tem um mimo especial.
          </p>

          <div className="w-full h-px bg-border mb-8" />

          {!name && (
            <div className="mb-6">
              <label
                className="block text-xs uppercase tracking-widest text-muted-foreground mb-2"
                style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
              >
                Seu nome
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && customerName.trim() && handleStart()}
                placeholder="Digite aqui..."
                className="w-full bg-transparent border-b-2 border-foreground/30 focus:border-primary outline-none text-foreground text-xl py-2 font-special transition-colors placeholder:text-muted-foreground"
                autoFocus
              />
            </div>
          )}

          <button
            onClick={handleStart}
            disabled={!customerName.trim()}
            className="w-full py-5 bg-primary text-primary-foreground text-2xl font-black uppercase tracking-wider hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
          >
            BORA LÁ →
          </button>

        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER — END STATE (fase 1: telefone → fase 2: cupom)
  // ─────────────────────────────────────────────────────────────────────────────

  if (step?.type === "end") {
    const cfg = step.endConfig!;

    // ── Fase 1: coleta telefone (opcional) antes de revelar cupom ────────────
    if (!phoneCollected && cfg.couponCode) {
      return (
        <div className="grain min-h-screen bg-background flex flex-col items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-lg animate-in fade-in duration-500">

            <div className="flex justify-center mb-10">
              <img src={logo} alt="Comida de Dragão" className="w-36 md:w-44 h-auto" />
            </div>

            <div className="text-center mb-4">
              <span className="text-6xl">🐉</span>
            </div>

            <h1
              className="text-4xl md:text-5xl font-black uppercase text-foreground leading-tight mb-3"
              style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
            >
              {displayName
                ? <>{displayName},<br /><span className="text-primary">QUASE LÁ.</span></>
                : <span className="text-primary">QUASE LÁ.</span>
              }
            </h1>

            <p className="text-base font-special text-muted-foreground mb-8 leading-relaxed">
              O Dragão preparou um cupom especial pra você. Deixa seu WhatsApp e a gente libera.
            </p>

            <div className="mb-2">
              <label
                className="block text-xs uppercase tracking-widest text-muted-foreground mb-2"
                style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
              >
                Seu WhatsApp
              </label>
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                onKeyDown={(e) => e.key === "Enter" && handlePhoneSubmit()}
                placeholder="(21) 99999-9999"
                className="w-full bg-transparent border-b-2 border-foreground/30 focus:border-primary outline-none text-foreground text-xl py-2 font-special transition-colors placeholder:text-muted-foreground"
                autoFocus
              />
              {phoneError && (
                <p className="text-xs text-destructive mt-2 font-special">{phoneError}</p>
              )}
            </div>

            <p className="text-xs text-muted-foreground font-special mb-8 mt-3">
              Só pra mandar o cupom. Sem spam, promessa de Dragão.
            </p>

            <button
              onClick={handlePhoneSubmit}
              disabled={!phone.trim()}
              className="w-full py-5 bg-primary text-primary-foreground text-2xl font-black uppercase tracking-wider hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
            >
              QUERO MEU CUPOM →
            </button>

            <button
              onClick={handlePhoneSkip}
              className="w-full mt-3 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors py-3"
              style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
            >
              PULAR
            </button>

            <p className="text-center text-xs font-special text-muted-foreground mt-4 leading-relaxed">
              O Dragão respeita. Se não quiser deixar, só pula.
            </p>

          </div>
        </div>
      );
    }

    // ── Fase 2: cupom revelado ───────────────────────────────────────────────
    return (
      <div className="grain min-h-screen bg-background flex flex-col items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-lg animate-in fade-in duration-700">

          <div className="flex justify-center mb-8">
            <img src={logo} alt="Comida de Dragão" className="w-36 md:w-44 h-auto" />
          </div>

          <h1
            className="text-4xl md:text-5xl font-black uppercase text-foreground leading-tight mb-3"
            style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
          >
            {displayName
              ? <>{displayName},<br /><span className="text-primary">O DRAGÃO AGRADECE.</span></>
              : <span className="text-primary">O DRAGÃO AGRADECE.</span>
            }
          </h1>

          <p className="text-base font-special text-muted-foreground mb-6 leading-relaxed">
            {cfg.message}
          </p>

          {cfg.tip && (
            <div className="border border-primary/40 p-4 mb-6">
              <p className="text-sm font-special text-foreground leading-relaxed">
                <span className="text-primary font-bold">// </span>{cfg.tip}
              </p>
            </div>
          )}

          {cfg.couponCode && (
            <div className="border-2 border-primary p-6 mb-6 text-center">
              <p
                className="text-xs uppercase tracking-widest text-muted-foreground mb-3"
                style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
              >
                SEU CUPOM — {cfg.discountPercent}% OFF
              </p>
              <div
                className="text-3xl md:text-4xl font-black text-primary tracking-widest"
                style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
              >
                {cfg.couponCode}
              </div>
              <p className="text-xs text-muted-foreground mt-3 font-special">
                Um uso por cliente · válido no site
              </p>
            </div>
          )}

          {cfg.hasTextField && (
            <Textarea
              value={endTextField}
              onChange={(e) => setEndTextField(e.target.value)}
              placeholder={cfg.textFieldPlaceholder}
              className="bg-transparent border border-border text-foreground font-special text-sm rounded-none mb-4 min-h-[90px] resize-none focus:border-primary"
              maxLength={300}
            />
          )}

          <button
            onClick={() => handleCtaClick(cfg.ctaUrl)}
            className="w-full py-5 bg-primary text-primary-foreground font-black uppercase tracking-wider text-xl hover:opacity-90 active:scale-[0.98] transition-all"
            style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
          >
            {cfg.ctaLabel} →
          </button>

          <p className="text-center text-xs font-special text-muted-foreground mt-6">
            Precisou de ajuda?{" "}
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              (21) 3950-0576
            </a>
          </p>

        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER — QUESTION
  // ─────────────────────────────────────────────────────────────────────────────

  if (!step) return null;

  return (
    <div className="grain min-h-screen bg-background flex flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-lg">

        <ProgressBar current={progressCurrent} total={progressTotal} />

        <button
          onClick={handleBack}
          className="mt-6 mb-8 text-xs uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
          style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
        >
          ← VOLTAR
        </button>

        <div className="animate-in fade-in duration-300" key={currentId}>

          <p className="text-xs font-special text-muted-foreground italic mb-5 leading-relaxed">
            "{ step.dragonVoice }"
          </p>

          <h2
            className="text-3xl md:text-4xl font-black text-foreground uppercase leading-tight mb-8"
            style={{ fontFamily: "'Big Shoulders Display', sans-serif", letterSpacing: "-0.01em" }}
          >
            {step.question}
          </h2>

          {step.type === "yesno" && (
            <div className="flex gap-3">
              <YesNoButton value="yes" selected={selected} onSelect={handleYesNo} />
              <YesNoButton value="no"  selected={selected} onSelect={handleYesNo} />
            </div>
          )}

          {step.type === "text" && (
            <div className="space-y-4">
              <Textarea
                value={textAnswers[currentId] || ""}
                onChange={(e) => setTextAnswers((prev) => ({ ...prev, [currentId]: e.target.value }))}
                placeholder={step.textPlaceholder}
                className="bg-transparent border border-border text-foreground font-special text-base rounded-none min-h-[120px] resize-none focus:border-primary placeholder:text-muted-foreground"
                maxLength={300}
                autoFocus
              />
              <button
                onClick={handleTextContinue}
                className="w-full py-5 bg-primary text-primary-foreground font-black uppercase tracking-wider text-xl hover:opacity-90 active:scale-[0.98] transition-all"
                style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
              >
                CONTINUAR →
              </button>
              <button
                onClick={handleTextContinue}
                className="w-full text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors py-2"
                style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
              >
                PULAR
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
