import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { calculateResult } from "@/lib/quizResults";
import { Product, QuizAnswers } from "@/types/quiz";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    const answers = (location.state?.answers as QuizAnswers) || 
                    JSON.parse(localStorage.getItem("quizAnswers") || "{}");

    if (Object.keys(answers).length === 0) {
      navigate("/");
      return;
    }

    const result = calculateResult(answers);
    setProduct(result);
  }, [location.state, navigate]);

  if (!product) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-3xl animate-in fade-in duration-700">
        <Card className="p-8 md:p-12 bg-card border-2 border-border rounded-3xl shadow-lg">
          <div className="text-center mb-6">
            <div className="text-7xl md:text-8xl mb-4 animate-bounce">
              {product.emoji}
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-question mb-6">
              Seu Resultado
            </h1>
            <h2 className="text-xl md:text-2xl font-display font-semibold text-primary mb-4">
              {product.name}
            </h2>
          </div>

          <p className="text-base md:text-lg font-special text-foreground leading-relaxed mb-8 text-center">
            {product.description}
          </p>

          <div className="bg-primary/10 border-2 border-primary rounded-2xl p-6 mb-8">
            <p className="text-center text-sm md:text-base font-special font-medium text-foreground mb-2">
              🛒 Quer conhecer mais? Visite nossa loja e garanta a nutrição que seu pet merece!
            </p>
            <p className="text-center text-lg md:text-xl font-special font-bold text-primary">
              Use o código <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full">{product.couponCode}</span> para 10% de desconto na primeira compra!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => window.open("https://comidadedragao.com.br", "_blank")}
              size="lg"
              className="text-base md:text-lg font-special px-8 py-6 rounded-full"
            >
              Visitar Loja
            </Button>
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              size="lg"
              className="text-base md:text-lg font-special px-8 py-6 rounded-full"
            >
              Refazer Quiz
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Results;
