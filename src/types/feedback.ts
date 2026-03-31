export type ChurnStatus = 'active' | 'at_risk' | 'inactive' | 'churned' | 'lead';
export type Segment = 'primeira' | 'recorrente' | 'fiel' | 'vip';
export type StepType = 'yesno' | 'text' | 'end';

export interface EndConfig {
  message: string;
  tip?: string;
  couponCode?: string;
  discountPercent?: number;
  ctaLabel: string;
  ctaUrl: string;
  showWhatsApp?: boolean;
  hasTextField?: boolean;
  textFieldPlaceholder?: string;
}

export interface SurveyStep {
  id: string;
  dragonVoice: string;
  question: string;
  type: StepType;
  textPlaceholder?: string;
  onYes?: string;
  onNo?: string;
  endConfig?: EndConfig;
}
