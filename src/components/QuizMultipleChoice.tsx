interface QuizMultipleChoiceProps {
  question: string;
  options: { value: string; label: string }[];
  selectedValue: string;
  onChange: (value: string) => void;
}

export const QuizMultipleChoice = ({
  question,
  options,
  selectedValue,
  onChange,
}: QuizMultipleChoiceProps) => {
  return (
    <div className="w-full max-w-3xl mx-auto mb-12 animate-in fade-in duration-500">
      <h2 className="text-3xl md:text-4xl font-display font-bold text-question mb-8">{question}</h2>
      <div className="space-y-3">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 ${
              selectedValue === option.value
                ? "bg-primary border-primary text-primary-foreground shadow-lg scale-[1.02]"
                : "bg-input border-border hover:border-ring hover:shadow-md"
            }`}
          >
            <span className="text-base md:text-lg font-special font-medium">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
