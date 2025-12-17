export interface FeedbackAnswers {
  // Question 1: Context
  petType: string;
  petTypeOther?: string;
  usageTime: string;
  
  // Question 2: NPS
  npsScore: number | null;
  
  // Question 3: Expectations
  expectations: string;
  expectationsReason?: string;
  
  // Question 4: Motivation (max 2)
  motivations: string[];
  motivationOther?: string;
  
  // Question 5: Strengths and Weaknesses
  likedMost: string;
  wouldChange: string;
  
  // Question 6: Acceptance
  petAcceptance: string;
  rejectionAction?: string;
  
  // Question 7: Repurchase
  wouldRepurchase: string;
  noRepurchaseReason?: string;
  
  // Question 8: Ideal Product
  idealProduct?: string;
}

export const initialFeedbackAnswers: FeedbackAnswers = {
  petType: "",
  usageTime: "",
  npsScore: null,
  expectations: "",
  motivations: [],
  likedMost: "",
  wouldChange: "",
  petAcceptance: "",
  wouldRepurchase: "",
};
