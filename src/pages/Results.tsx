import { useEffect, useState } from "react";
import logo from "@/assets/logo.png";

const LOJA_URL     = "https://www.comidadedragao.com.br/collections/produtos";
const WHATSAPP_URL = "https://wa.me/552139500576";

const Results = () => {
  const couponCode = "FALOUEDISSE";
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone]         = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]         = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("feedbackAnswers");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setFirstName(parsed.customerName?.split(" ")[0] || "");
      } catch { /* silent */ }
    }
  }, []);

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2)  return digits;
    if (digits.length <= 7)  return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
    setError("");
  };

  const handlePhoneSubmit = () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      setError("Telefone inválido. Coloca DDD + número.");
      return;
    }
    localStorage.setItem("feedbackPhone", phone);
    setSubmitted(true);
  };

  // ── GATE: coleta telefone antes do cupom ────────────────────────────────────
  if (!submitted) {
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
            {firstName
              ? <>{firstName},<br /><span className="text-primary">QUASE LÁ.</span></>
              : <span className="text-primary">QUASE LÁ.</span>
            }
          </h1>

          <p className="text-base font-special text-muted-foreground mb-8 leading-relaxed">
            O Dragão preparou um cupom especial pra você. Deixa seu telefone e a gente libera.
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
            {error && (
              <p className="text-xs text-destructive mt-2 font-special">{error}</p>
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

        </div>
      </div>
    );
  }

  // ── CUPOM ───────────────────────────────────────────────────────────────────
  return (
    <div className="grain min-h-screen bg-background flex flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-lg animate-in fade-in duration-700">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src={logo} alt="Comida de Dragão" className="w-36 md:w-44 h-auto" />
        </div>

        {/* Dragon */}
        <div className="text-center mb-4">
          <span className="text-6xl">🐉</span>
        </div>

        {/* Headline */}
        <h1
          className="text-4xl md:text-5xl font-black uppercase text-foreground leading-tight mb-3"
          style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
        >
          {firstName
            ? <>{firstName},<br /><span className="text-primary">O DRAGÃO AGRADECE.</span></>
            : <span className="text-primary">O DRAGÃO AGRADECE.</span>
          }
        </h1>

        <p className="text-base font-special text-muted-foreground mb-8 leading-relaxed">
          Sua opinião vai guiar os próximos passos da revolução.
        </p>

        {/* Coupon */}
        <div className="border-2 border-primary p-6 mb-6 text-center">
          <p
            className="text-xs uppercase tracking-widest text-muted-foreground mb-3"
            style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
          >
            SEU CUPOM — 15% OFF
          </p>
          <div
            className="text-3xl md:text-4xl font-black text-primary tracking-widest"
            style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
          >
            {couponCode}
          </div>
          <p className="text-xs text-muted-foreground mt-3 font-special">
            Um uso por cliente · válido no site
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={() => window.open(LOJA_URL, "_blank")}
          className="w-full py-5 bg-primary text-primary-foreground font-black uppercase tracking-wider text-xl hover:opacity-90 active:scale-[0.98] transition-all mb-4"
          style={{ fontFamily: "'Big Shoulders Display', sans-serif" }}
        >
          IR PRA LOJA E USAR O CUPOM →
        </button>

        {/* Footer */}
        <p className="text-center text-xs font-special text-muted-foreground leading-relaxed">
          P.S.: O Dragão vê tudo — inclusive quando você precisar de ajuda.
          <br />
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            (21) 3950-0576
          </a>
        </p>

      </div>
    </div>
  );
};

export default Results;
