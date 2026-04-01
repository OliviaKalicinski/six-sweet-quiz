import { Product, QuizAnswers } from "@/types/quiz";

const products: Product[] = [
  {
    id: "original",
    name: "COMIDA DE DRAGÃO ORIGINAL",
    emoji: "🐉",
    description: "COMIDA DE DRAGÃO ORIGINAL é perfeito para você! Seu pet merece o máximo de proteína pura e natural. Com 40% de proteína, 100% larvas BSF e zero aditivos, é o petisco mais versátil e nutritivo. Ideal para recompensas, treinos e como complemento diário. Hipoalergênico e aceito por praticamente todos os animais!",
    couponCode: "QUIZDRAGAO10"
  },
  {
    id: "mordida-legumes",
    name: "MORDIDA DE DRAGÃO - LEGUMES",
    emoji: "🥕",
    description: "MORDIDA DE DRAGÃO - LEGUMES é a escolha ideal! Seu pet vai adorar a combinação de proteína de inseto com beterraba, cenoura e cúrcuma. Propriedades anti-inflamatórias naturais, energia balanceada e sabor irresistível. Perfeito para quem busca um snack funcional completo com praticidade!",
    couponCode: "QUIZDRAGAO10"
  },
  {
    id: "mordida-spirulina",
    name: "MORDIDA DE DRAGÃO - SPIRULINA, FLOCOS DE COCO E ESPINAFRE",
    emoji: "🌿",
    description: "MORDIDA DE DRAGÃO - SPIRULINA, FLOCOS DE COCO E ESPINAFRE é para o seu pet! A escolha premium com superalimentos. Spirulina rica em antioxidantes, carotenoides para pelagem brilhante e sistema imunológico fortalecido. Nutrição de alto nível para pets que merecem o melhor!",
    couponCode: "QUIZDRAGAO10"
  },
  {
    id: "suplemento-concentrado",
    name: "SUPLEMENTO PROTEICO CONCENTRADO",
    emoji: "💪",
    description: "SUPLEMENTO PROTEICO CONCENTRADO é o que você precisa! Com 55% de proteína pura, é a maior concentração proteica do mercado pet brasileiro. Ideal para cães que precisam de suplementação extra, são ativos ou têm alergias. Mistura facilmente na ração e é 100% hipoalergênico. Inovação exclusiva!",
    couponCode: "QUIZDRAGAO10"
  },
  {
    id: "suplemento-integral",
    name: "SUPLEMENTO PROTEICO INTEGRAL",
    emoji: "🌟",
    description: "SUPLEMENTO PROTEICO INTEGRAL é perfeito para seu cão! Com 41,5% de proteína e perfil lipídico completo (ômegas 3, 6 e 9 preservados), oferece suplementação balanceada. O ácido láurico garante propriedades antimicrobianas naturais. Nutrição completa que complementa qualquer dieta!",
    couponCode: "QUIZDRAGAO10"
  },
  {
    id: "suplemento-gatos",
    name: "COMIDA DE DRAGÃO - SUPLEMENTO PARA GATOS",
    emoji: "🐱",
    description: "SUPLEMENTO PARA GATOS foi feito especialmente para o seu felino! Formulação exclusiva com taurina, aminoácido essencial para saúde cardíaca e visual dos gatos. Proteína BSF de alta qualidade, hipoalergênica e palatável. A primeira e única linha de suplemento de inseto desenvolvida para gatos no Brasil!",
    couponCode: "QUIZDRAGAO10"
  },
  {
    id: "grub",
    name: "GRUB - ALIMENTO ESPECÍFICO EM GEL",
    emoji: "🦎",
    description: "GRUB revoluciona a alimentação do seu réptil ou anfíbio! Chega de insetos vivos, bagunça e odor. Nutrição consistente com três fontes de proteína (BSF, grilos e tenébrios), enriquecido com spirulina e cúrcuma. Preparo super simples: mistura com água e pronto! Manejo profissional sem complicação. Seu herp merece essa inovação!",
    couponCode: "QUIZDRAGAO10"
  }
];

export const calculateResult = (answers: QuizAnswers): Product => {
  const q1 = answers[1]; // Pet type: A=Cachorro, B=Gato, C=Réptil/Anfíbio, D=Ave/peixe/outro
  const q3 = answers[3]; // What you seek: A=Petisco, B=Suplementar, C=Substituir insetos vivos, D=Lanche funcional
  const q4 = answers[4]; // Food problems: A=Alergias, B=100% natural, C=Não sei, D=Nutrientes específicos (taurina)
  const q5 = answers[5]; // How to give: A=Ingrediente único, B=Suplementar ração, C=Animal exótico, D=Biscoitinho
  const q6 = answers[6]; // Benefits: A=Máx proteína, B=Antioxidantes/anti-inf, C=Energia balanceada, D=Ômegas
  const q7 = answers[7]; // Choice factor: A=Praticidade, B=Versatilidade, C=Inovação, D=Ingredientes premium

  // Répteis, anfíbios → GRUB
  if (q1 === "C") return products.find(p => p.id === "grub")!;

  // Gatos → Suplemento Felino
  if (q1 === "B") return products.find(p => p.id === "suplemento-gatos")!;

  // Aves, peixes, outros pequenos → Original (mais versátil)
  if (q1 === "D") return products.find(p => p.id === "original")!;

  // A partir daqui: Cachorro (q1 === "A")

  // Quer substituir insetos vivos → GRUB
  if (q5 === "C") return products.find(p => p.id === "grub")!;

  // Quer biscoitinho com ingredientes extras
  if (q5 === "D" || q3 === "D") {
    // Antioxidantes / anti-inflamatórios → Spirulina
    if (q6 === "B" || q7 === "D") return products.find(p => p.id === "mordida-spirulina")!;
    // Padrão biscoitinho → Legumes
    return products.find(p => p.id === "mordida-legumes")!;
  }

  // Suplementar a ração
  if (q3 === "B" || q5 === "B") {
    // Máxima proteína → Concentrado
    if (q6 === "A") return products.find(p => p.id === "suplemento-concentrado")!;
    // Ômegas preservados → Integral
    if (q6 === "D") return products.find(p => p.id === "suplemento-integral")!;
    // Nutrientes específicos (taurina) → Suplemento Felino só se gato — já tratado acima; para cão → Integral
    if (q4 === "D") return products.find(p => p.id === "suplemento-integral")!;
    // Padrão suplementação → Concentrado
    return products.find(p => p.id === "suplemento-concentrado")!;
  }

  // Quer ingrediente único puro
  if (q5 === "A" || q3 === "A") {
    return products.find(p => p.id === "original")!;
  }

  // Alergias ou 100% natural → Original (ingrediente único, hipoalergênico)
  if (q4 === "A" || q4 === "B") return products.find(p => p.id === "original")!;

  // Praticidade / versatilidade → Original
  if (q7 === "A" || q7 === "B") return products.find(p => p.id === "original")!;

  // Ingredientes premium com superalimentos → Spirulina
  if (q7 === "D" || q6 === "B") return products.find(p => p.id === "mordida-spirulina")!;

  // Fallback
  return products.find(p => p.id === "original")!;
};
