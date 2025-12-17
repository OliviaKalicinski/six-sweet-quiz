import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";

interface CheckboxOption {
  value: string;
  label: string;
}

interface CheckboxOptionsProps {
  options: CheckboxOption[];
  values: string[];
  onChange: (values: string[]) => void;
  maxSelections?: number;
  showOther?: boolean;
  otherValue?: string;
  onOtherChange?: (value: string) => void;
}

export const CheckboxOptions = ({
  options,
  values,
  onChange,
  maxSelections = 2,
  showOther = false,
  otherValue = "",
  onOtherChange,
}: CheckboxOptionsProps) => {
  const handleToggle = (value: string) => {
    if (values.includes(value)) {
      onChange(values.filter((v) => v !== value));
    } else if (values.length < maxSelections) {
      onChange([...values, value]);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground text-center">
        (Escolha até {maxSelections} opções)
      </p>
      {options.map((option) => {
        const isSelected = values.includes(option.value);
        const isDisabled = !isSelected && values.length >= maxSelections;
        
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => handleToggle(option.value)}
            disabled={isDisabled}
            className={cn(
              "w-full p-4 rounded-xl text-left transition-all duration-200",
              "border-2 font-special flex items-center justify-between",
              isSelected
                ? "bg-primary/10 border-primary text-foreground"
                : isDisabled
                ? "bg-muted border-border text-muted-foreground cursor-not-allowed"
                : "bg-card border-border text-foreground hover:border-primary/50"
            )}
          >
            <span>{option.label}</span>
            {isSelected && <Check className="w-5 h-5 text-primary" />}
          </button>
        );
      })}
      {showOther && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => handleToggle("other")}
            disabled={!values.includes("other") && values.length >= maxSelections}
            className={cn(
              "w-full p-4 rounded-xl text-left transition-all duration-200",
              "border-2 font-special flex items-center justify-between",
              values.includes("other")
                ? "bg-primary/10 border-primary text-foreground"
                : values.length >= maxSelections
                ? "bg-muted border-border text-muted-foreground cursor-not-allowed"
                : "bg-card border-border text-foreground hover:border-primary/50"
            )}
          >
            <span>Outro</span>
            {values.includes("other") && <Check className="w-5 h-5 text-primary" />}
          </button>
          {values.includes("other") && (
            <Input
              placeholder="Especifique..."
              value={otherValue}
              onChange={(e) => onOtherChange?.(e.target.value)}
              className="mt-2"
              maxLength={100}
            />
          )}
        </div>
      )}
    </div>
  );
};
