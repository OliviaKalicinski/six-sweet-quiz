import { ReactNode } from "react";

interface QuestionWrapperProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export const QuestionWrapper = ({ title, subtitle, children }: QuestionWrapperProps) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="text-center space-y-2">
        <h2 className="text-xl md:text-2xl font-special font-bold text-question">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm md:text-base text-muted-foreground font-special">
            {subtitle}
          </p>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
};
