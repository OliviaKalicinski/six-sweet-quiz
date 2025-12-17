import { cn } from "@/lib/utils";

interface NPSScaleProps {
  value: number | null;
  onChange: (value: number) => void;
}

export const NPSScale = ({ value, onChange }: NPSScaleProps) => {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">
        0 = Definitivamente não | 10 = Com certeza!
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {Array.from({ length: 11 }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            className={cn(
              "w-10 h-10 md:w-12 md:h-12 rounded-full font-bold text-lg transition-all duration-200",
              "border-2 hover:scale-110",
              value === i
                ? "bg-primary text-primary-foreground border-primary shadow-lg"
                : "bg-card border-border text-foreground hover:border-primary"
            )}
          >
            {i}
          </button>
        ))}
      </div>
    </div>
  );
};
