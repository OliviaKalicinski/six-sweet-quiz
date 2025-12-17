import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import logo from "@/assets/logo.png";

const Results = () => {
  const couponCode = "FALOUEDISSE";
  const [customerName, setCustomerName] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("feedbackAnswers");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCustomerName(parsed.customerName || "");
      } catch (e) {
        console.error("Error parsing feedback answers:", e);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-3xl animate-in fade-in duration-700">
        <Card className="p-8 md:p-12 bg-card border-2 border-border rounded-3xl shadow-lg">
          <div className="text-center mb-6">
            <div className="mb-6 flex justify-center">
              <img src={logo} alt="Comida de Dragão" className="w-48 md:w-64 h-auto" />
            </div>
            <div className="text-7xl md:text-8xl mb-4">
              🐉
            </div>
            <h1 className="text-2xl md:text-3xl font-special font-bold text-question mb-4">
              {customerName ? `${customerName}, o Dragão agradece!` : "O Dragão agradece!"}
            </h1>
            <p className="text-base md:text-lg font-special text-foreground leading-relaxed mb-6">
              Sua opinião vai guiar os próximos passos da revolução.
            </p>
          </div>

          <div className="bg-primary/10 border-2 border-primary rounded-2xl p-6 mb-8 text-center">
            <p className="text-sm md:text-base font-special text-foreground mb-3">
              Aqui está seu cupom de 15% OFF:
            </p>
            <div className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-full text-2xl md:text-3xl font-bold mb-3">
              {couponCode}
            </div>
            <p className="text-sm font-special text-muted-foreground">
              Um uso por cliente
            </p>
          </div>

          <div className="flex flex-col gap-4 justify-center">
            <Button
              onClick={() => window.open("https://www.comidadedragao.com.br/collections/produtos", "_blank")}
              size="lg"
              className="text-base md:text-lg font-special px-8 py-6 rounded-full w-full"
            >
              Ir para a loja
            </Button>
          </div>

          <p className="text-center text-sm font-special text-muted-foreground mt-8">
            P.S.: O Dragão vê tudo - inclusive quando você precisar de ajuda.
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
