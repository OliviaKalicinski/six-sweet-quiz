import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { calculateResult } from "@/lib/quizResults";
import { Product, QuizAnswers } from "@/types/quiz";
import logo from "@/assets/logo.png";

const LOJA_URL     = "https://www.comidadedragao.com.br/collections/produtos";
const WHATSAPP_URL = "https://wa.me/552139500576";

// ── Resultado para quem NÃO experimentou ainda ──────────────────────────────
const NotTriedResult = ({ answers }: { answers: Record<number, string> }) => {
  const impediment = answers[100]; // O que te impede
  const petType    = answers[101]; // Qual é o pet

  // Mensagem personalizada baseada no impedimento
  const getMessage = () => {
    switch (impediment) {
      case "A": return "O Dragão entende. Aqui vai um cupom pra você dar o primeiro passo sem peso no bolso.";
      case "B": return "A barreira psicológica é real — mas os pets adoram. O inseto vira um ingrediente processado, sem patas, sem antenas. Experimenta!";
      case "C": return "Proteína de inseto BSF: hipoalergênica, sustentável, com até 55% de proteína. Seu pet merece conhecer.";
      case "D": return "Misture 20% com a ração dele nos primeiros 5 dias. O olfato se acostuma e a aceitação é altíssima.";
      default:  return "O Dragão preparou algo especial pra sua primeira experiência.";
    }
  };

  // Sugestão de produto baseada no tipo de pet
  const getSuggestion = () => {
    switch (petType) {
      case "B": return "SUPLEMENTO PARA GATOS — formulação exclusiva com taurina";
      case "C": return "GRUB — alimento em gel para répteis e anfíbios, sem insetos vivos";
      case "D": return "COMIDA DE DRAGÃO ORIGINAL — versátil, aceito por quase todos os animais";
      default:  return "COMIDA DE DRAGÃO ORIGINAL — 100% larvas BSF, zero aditivos, máxima proteína";
    }
  };

  return (
    <div className="grain min-h-screen bg-background flex flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-lg animate-in fade-in duration-700">

        <div className="flex justify-center mb-8">
          <img src={logo} alt="Comida de Dragão" className="w-36 md:w-44 h-auto" />
        </div>

        <div className="text-center mb-4">
          <span className="text-6xl">🐉</span>
        </div>

        <h1
          className="text-4xl md:text-5xl font-black uppercase text-foreground leading-tight mb-3"
          style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
        >
          <span className="text-primary">BEM-VINDO À REVOLUÇÃO.</span>
        </h1>

        <p className="text-base font-special text-muted-foreground mb-6 leading-relaxed">
          {getMessage()}
        </p>

        {/* Sugestão de produto */}
        <div className="border border-primary/40 p-4 mb-6">
          <p
            className="text-xs uppercase tracking-widest text-muted-foreground mb-2"
            style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
          >
            SUGESTÃO PRA COMEÇAR
          </p>
          <p className="text-sm font-special text-foreground leading-relaxed">
            <span className="text-primary font-bold">→ </span>{getSuggestion()}
          </p>
        </div>

        {/* Cupom */}
        <div className="border-2 border-primary p-6 mb-6 text-center">
          <p
            className="text-xs uppercase tracking-widest text-muted-foreground mb-3"
            style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
          >
            SEU CUPOM — 20% OFF NA PRIMEIRA COMPRA
          </p>
          <div
            className="text-3xl md:text-4xl font-black text-primary tracking-widest"
            style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
          >
            PRIMEIRODRAGO
          </div>
          <p className="text-xs text-muted-foreground mt-3 font-special">
            Um uso por cliente · válido no site
          </p>
        </div>

        <button
          onClick={() => window.open(LOJA_URL, "_blank")}
          className="w-full py-5 bg-primary text-primary-foreground font-black uppercase tracking-wider text-xl hover:opacity-90 active:scale-[0.98] transition-all mb-4"
          style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
        >
          CONHECER OS PRODUTOS →
        </button>

        <p className="text-center text-xs font-special text-muted-foreground leading-relaxed">
          Dúvidas? O Dragão responde tudo.{" "}
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            (21) 3950-0576
          </a>
        </p>

      </div>
    </div>
  );
};

// ── Resultado principal: quem JÁ experimentou ───────────────────────────────
const TriedResult = ({ product }: { product: Product }) => {
  return (
    <div className="grain min-h-screen bg-background flex flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-lg animate-in fade-in duration-700">

        <div className="flex justify-center mb-8">
          <img src={logo} alt="Comida de Dragão" className="w-36 md:w-44 h-auto" />
        </div>

        <div className="text-center mb-4">
          <span className="text-6xl">{product.emoji}</span>
        </div>

        <h1
          className="text-4xl md:text-5xl font-black uppercase text-foreground leading-tight mb-3"
          style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
        >
          <span className="text-primary">O DRAGÃO ESCOLHEU.</span>
        </h1>

        {/* Produto recomendado */}
        <div className="border border-primary/40 p-5 mb-6">
          <p
            className="text-xs uppercase tracking-widest text-muted-foreground mb-3"
            style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
          >
            PRODUTO IDEAL PRO SEU PET
          </p>
          <h2
            className="text-xl md:text-2xl font-black text-primary uppercase mb-3"
            style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
          >
            {product.name}
          </h2>
          <p className="text-sm font-special text-foreground/80 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Cupom */}
        <div className="border-2 border-primary p-6 mb-6 text-center">
          <p
            className="text-xs uppercase tracking-widest text-muted-foreground mb-3"
            style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
          >
            SEU CUPOM — 10% OFF
          </p>
          <div
            className="text-3xl md:text-4xl font-black text-primary tracking-widest"
            style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
          >
            {product.couponCode}
          </div>
          <p className="text-xs text-muted-foreground mt-3 font-special">
            Um uso por cliente · válido no site
          </p>
        </div>

        <button
          onClick={() => window.open(LOJA_URL, "_blank")}
          className="w-full py-5 bg-primary text-primary-foreground font-black uppercase tracking-wider text-xl hover:opacity-90 active:scale-[0.98] transition-all mb-4"
          style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
        >
          COMPRAR AGORA →
        </button>

        <p className="text-center text-xs font-special text-muted-foreground leading-relaxed">
          Dúvidas? O Dragão responde tudo.{" "}
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            (21) 3950-0576
          </a>
        </p>

      </div>
    </div>
  );
};

// ── Página principal de resultado ────────────────────────────────────────────
const QuizResult = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const [product, setProduct]       = useState<Product | null>(null);
  const [answers, setAnswers]       = useState<Record<number, string>>({});
  const [triedBefore, setTriedBefore] = useState(true);
  const [ready, setReady]           = useState(false);

  useEffect(() => {
    // Tenta pegar do state da navegação, senão do localStorage
    const state = location.state as { answers?: QuizAnswers; triedBefore?: boolean } | null;
    let ans: QuizAnswers | null = null;
    let tried = true;

    if (state?.answers) {
      ans   = state.answers;
      tried = state.triedBefore ?? true;
    } else {
      const stored = localStorage.getItem("quizAnswers");
      if (stored) {
        try { ans = JSON.parse(stored); } catch { /* silent */ }
      }
    }

    if (!ans) {
      navigate("/quiz");
      return;
    }

    setAnswers(ans);
    setTriedBefore(tried);

    if (tried) {
      setProduct(calculateResult(ans));
    }

    setReady(true);
  }, [location.state, navigate]);

  if (!ready) return null;

  if (!triedBefore) {
    return <NotTriedResult answers={answers} />;
  }

  if (!product) {
    navigate("/quiz");
    return null;
  }

  return <TriedResult product={product} />;
};

export default QuizResult;
