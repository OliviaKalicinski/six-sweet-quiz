export interface QuizAnswers {
  [questionId: number]: string;
}

export interface Product {
  id: string;
  name: string;
  emoji: string;
  description: string;
  couponCode: string;
}
