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
  // Extract answers for all 7 questions
  const q1 = answers[1]; // Pet type
  const q2 = answers[2]; // Comfort with insects
  const q3 = answers[3]; // What you seek for your pet
  const q4 = answers[4]; // Food problems
  const q5 = answers[5]; // How to give the food
  const q6 = answers[6]; // Benefits you value
  const q7 = answers[7]; // What weighs more in your choice

  // TODO: Add your custom logic here to determine which product to recommend
  // based on the 7 answers (q1 through q7)
  
  // For now, returning the default "original" product as a placeholder
  return products.find(p => p.id === "original")!;
};
