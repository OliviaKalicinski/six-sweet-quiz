import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/admin`,
          },
        });
        if (error) throw error;
        toast({
          title: "Conta criada!",
          description: "Você já pode fazer login.",
        });
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate("/admin");
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao autenticar",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <Card className="w-full max-w-md p-8 bg-card border-2 border-border rounded-3xl">
        <div className="text-center mb-8">
          <div className="mb-4 flex justify-center">
            <img src={logo} alt="Comida de Dragão" className="w-32 h-auto" />
          </div>
          <h1 className="text-2xl font-display font-bold text-question">
            Área Administrativa
          </h1>
          <p className="text-sm text-muted-foreground font-special mt-2">
            {isSignUp ? "Criar nova conta" : "Faça login para continuar"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="font-special"
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="font-special"
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full font-special"
            size="lg"
          >
            {isLoading ? "Carregando..." : isSignUp ? "Criar conta" : "Entrar"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-primary hover:underline font-special"
          >
            {isSignUp ? "Já tem conta? Fazer login" : "Não tem conta? Criar agora"}
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Auth;