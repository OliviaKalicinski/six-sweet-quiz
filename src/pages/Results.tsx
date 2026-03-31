import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import logo from "@/assets/logo.png";
import { SurveyAnswers } from "@/types/feedback";

const Results = () => {
  const couponCode = "FALOUEDISSE";
  const [answers, setAnswers] = useState<Partial<SurveyAnswers>>({});

  useEffect(() => {
    const stored = localStorage.getItem("feedbackAnswers");
    if (stored) {
      try {
        setAnswers(JSON.parse(stored));
      } catch (e) {
        console.error("Error parsing feedback answers:", e);
      }
    }
  }, []);

  const firstName = answers.customerName?.split(" ")[0] || "";
  const willRepurchase = answers.wouldRepurchase === "yes";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg animate-in fade-in duration-700">
        <Card className="p-8 md:p-12 bg-card border-2 border-border rounded-3xl shadow-lg">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img
              src={logo}
              alt="Comida de Dragão"
              className="w-40 md:w-52 h-auto"
            />
          </div>

          {/* Dragon emoji */}
          <div className="text-center mb-4">
            <span className="text-7xl md:text-8xl">🐉</span>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-special font-bold text-question mb-3">
              {firstName
                ? `${firstName}, o Dragão agradece!`
                : "O Dragão agradece!"}
            </h1>
            <p className="text-base font-special text-foreground leading-relaxed">
              {willRepurchase
                ? "Que bom que você vai voltar. A revolução agradece 🌿"
                : "Sua opinião vai guiar os próximos passos da revolução."}
            </p>
          </div>

          {/* Coupon */}
          <div className="bg-primary/10 border-2 border-primary rounded-2xl p-6 mb-8 text-center">
            <p className="text-sm md:text-base font-special text-foreground mb-3">
              Aqui está seu cupom de{" "}
              <span className="font-bold">15% OFF</span>:
            </p>
            <div className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-full text-2xl md:text-3xl font-bold font-special mb-3 tracking-widest">
              {couponCode}
            </div>
            <p className="text-xs font-special text-muted-foreground">
              Um uso por cliente · válido no site
            </p>
          </div>

          {/* CTA */}
          <Button
            onClick={() =>
              window.open(
                "https://www.comidadedragao.com.br/collections/produtos",
                "_blank"
              )
            }
            size="lg"
            className="text-base md:text-lg font-special px-8 py-6 rounded-full w-full hover:scale-105 transition-transform"
          >
            Ir pra loja e usar o cupom 🛒
          </Button>

          {/* Footer */}
          <p className="text-center text-xs font-special text-muted-foreground mt-8 leading-relaxed">
            P.S.: O Dragão vê tudo — inclusive quando você precisar de ajuda.
            <br />
            Chama no WhatsApp:{" "}
            <a
              href="https://wa.me/552139500576"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              (21) 3950-0576
            </a>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Results;
