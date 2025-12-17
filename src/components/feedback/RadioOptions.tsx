import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface RadioOption {
  value: string;
  label: string;
}

interface RadioOptionsProps {
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  showOther?: boolean;
  otherValue?: string;
  onOtherChange?: (value: string) => void;
}

export const RadioOptions = ({
  options,
  value,
  onChange,
  showOther = false,
  otherValue = "",
  onOtherChange,
}: RadioOptionsProps) => {
  return (
    <div className="space-y-3">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "w-full p-4 rounded-xl text-left transition-all duration-200",
            "border-2 font-special",
            value === option.value
              ? "bg-primary/10 border-primary text-foreground"
              : "bg-card border-border text-foreground hover:border-primary/50"
          )}
        >
          {option.label}
        </button>
      ))}
      {showOther && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => onChange("other")}
            className={cn(
              "w-full p-4 rounded-xl text-left transition-all duration-200",
              "border-2 font-special",
              value === "other"
                ? "bg-primary/10 border-primary text-foreground"
                : "bg-card border-border text-foreground hover:border-primary/50"
            )}
          >
            Outro
          </button>
          {value === "other" && (
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
