import { Textarea } from "@/components/ui/textarea";

interface TextAreaWithCounterProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  required?: boolean;
}

export const TextAreaWithCounter = ({
  value,
  onChange,
  placeholder = "",
  maxLength = 280,
  required = false,
}: TextAreaWithCounterProps) => {
  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        placeholder={placeholder}
        className="min-h-[100px] font-special resize-none"
        maxLength={maxLength}
      />
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{required ? "" : "(Opcional)"}</span>
        <span>
          {value.length}/{maxLength}
        </span>
      </div>
    </div>
  );
};
