import { Input } from "@/components/ui/input";

interface QuizQuestionProps {
  question: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export const QuizQuestion = ({ question, value, onChange, placeholder }: QuizQuestionProps) => {
  return (
    <div className="w-full max-w-3xl mx-auto mb-12 animate-in fade-in duration-500">
      <h2 className="text-3xl md:text-4xl font-bold text-question mb-8">{question}</h2>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-16 text-base px-6 bg-input border-2 border-border rounded-2xl focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all"
      />
    </div>
  );
};
