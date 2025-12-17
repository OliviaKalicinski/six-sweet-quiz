import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Download, LogOut, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FeedbackResponse {
  id: string;
  created_at: string;
  pet_type: string;
  pet_type_other: string | null;
  usage_time: string;
  nps_score: number;
  expectations: string;
  expectations_reason: string | null;
  motivations: string[];
  motivation_other: string | null;
  liked_most: string;
  would_change: string;
  pet_acceptance: string;
  rejection_action: string | null;
  would_repurchase: string;
  no_repurchase_reason: string | null;
  ideal_product: string | null;
}

const petTypeLabels: Record<string, string> = {
  dog: "Cão",
  cat: "Gato",
  reptile: "Réptil/Anfíbio",
  other: "Outro",
};

const usageTimeLabels: Record<string, string> = {
  first_time: "Primeira vez",
  less_than_1_month: "Menos de 1 mês",
  "1_to_3_months": "1-3 meses",
  more_than_3_months: "Mais de 3 meses",
};

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [responses, setResponses] = useState<FeedbackResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    avgNps: 0,
    promoters: 0,
    detractors: 0,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    fetchResponses();
  };

  const fetchResponses = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("feedback_responses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setResponses(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error("Error fetching responses:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as respostas.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (data: FeedbackResponse[]) => {
    const total = data.length;
    const avgNps = total > 0 
      ? data.reduce((sum, r) => sum + r.nps_score, 0) / total 
      : 0;
    const promoters = data.filter((r) => r.nps_score >= 9).length;
    const detractors = data.filter((r) => r.nps_score <= 6).length;

    setStats({ total, avgNps, promoters, detractors });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const exportToCSV = () => {
    if (responses.length === 0) return;

    const headers = [
      "Data",
      "Tipo de Pet",
      "Tempo de Uso",
      "NPS",
      "Expectativas",
      "Razão Expectativas",
      "Motivações",
      "O que mais gostou",
      "O que mudaria",
      "Aceitação do Pet",
      "Compraria novamente",
      "Produto ideal",
    ];

    const rows = responses.map((r) => [
      format(new Date(r.created_at), "dd/MM/yyyy HH:mm"),
      petTypeLabels[r.pet_type] || r.pet_type_other || r.pet_type,
      usageTimeLabels[r.usage_time] || r.usage_time,
      r.nps_score,
      r.expectations,
      r.expectations_reason || "",
      r.motivations.join(", "),
      r.liked_most,
      r.would_change,
      r.pet_acceptance,
      r.would_repurchase,
      r.ideal_product || "",
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(";")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `feedback_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  const exportToJSON = () => {
    if (responses.length === 0) return;

    const blob = new Blob([JSON.stringify(responses, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `feedback_${format(new Date(), "yyyy-MM-dd")}.json`;
    link.click();
  };

  const npsScore = stats.total > 0 
    ? Math.round(((stats.promoters - stats.detractors) / stats.total) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl md:text-3xl font-display font-bold text-question">
            📊 Dashboard de Feedback
          </h1>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 bg-card border-2 border-border">
            <p className="text-sm text-muted-foreground font-special">Total de Respostas</p>
            <p className="text-3xl font-bold text-foreground">{stats.total}</p>
          </Card>
          <Card className="p-4 bg-card border-2 border-border">
            <p className="text-sm text-muted-foreground font-special">Média NPS</p>
            <p className="text-3xl font-bold text-foreground">{stats.avgNps.toFixed(1)}</p>
          </Card>
          <Card className="p-4 bg-card border-2 border-border">
            <p className="text-sm text-muted-foreground font-special">NPS Score</p>
            <p className={`text-3xl font-bold ${npsScore >= 50 ? "text-green-600" : npsScore >= 0 ? "text-yellow-600" : "text-red-600"}`}>
              {npsScore}%
            </p>
          </Card>
          <Card className="p-4 bg-card border-2 border-border">
            <p className="text-sm text-muted-foreground font-special">Promotores</p>
            <p className="text-3xl font-bold text-foreground">{stats.promoters}</p>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Button onClick={fetchResponses} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={exportToCSV} variant="outline" size="sm" disabled={responses.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
          <Button onClick={exportToJSON} variant="outline" size="sm" disabled={responses.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Exportar JSON
          </Button>
        </div>

        {/* Responses Table */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground font-special">Carregando...</p>
          </div>
        ) : responses.length === 0 ? (
          <Card className="p-12 text-center bg-card border-2 border-border">
            <p className="text-muted-foreground font-special">Nenhuma resposta ainda.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {responses.map((response) => (
              <Card key={response.id} className="p-6 bg-card border-2 border-border">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-sm text-muted-foreground font-special">
                      {format(new Date(response.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </span>
                    <div className="flex gap-2 mt-1">
                      <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-special">
                        {petTypeLabels[response.pet_type] || response.pet_type_other || response.pet_type}
                      </span>
                      <span className="px-2 py-1 bg-secondary/10 text-secondary text-xs rounded-full font-special">
                        {usageTimeLabels[response.usage_time] || response.usage_time}
                      </span>
                    </div>
                  </div>
                  <div className={`text-2xl font-bold px-4 py-2 rounded-full ${
                    response.nps_score >= 9 ? "bg-green-100 text-green-700" :
                    response.nps_score >= 7 ? "bg-yellow-100 text-yellow-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {response.nps_score}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 text-sm font-special">
                  <div>
                    <p className="font-semibold text-foreground mb-1">O que mais gostou:</p>
                    <p className="text-muted-foreground">{response.liked_most}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">O que mudaria:</p>
                    <p className="text-muted-foreground">{response.would_change}</p>
                  </div>
                  {response.ideal_product && (
                    <div className="md:col-span-2">
                      <p className="font-semibold text-foreground mb-1">Produto ideal sugerido:</p>
                      <p className="text-muted-foreground">{response.ideal_product}</p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;