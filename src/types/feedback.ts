export type YesNo = 'yes' | 'no';

export interface SurveyAnswers {
  // Step 0: Name
  customerName: string;

  // Step 1: Pet loved it?
  petLoved: YesNo | null;

  // Step 2: Met expectations?
  metExpectations: YesNo | null;

  // Step 3: Would recommend?
  wouldRecommend: YesNo | null;

  // Step 4: Would repurchase?
  wouldRepurchase: YesNo | null;

  // Step 5: Open feedback (optional)
  improvement?: string;
}

export const initialSurveyAnswers: SurveyAnswers = {
  customerName: '',
  petLoved: null,
  metExpectations: null,
  wouldRecommend: null,
  wouldRepurchase: null,
  improvement: '',
};
