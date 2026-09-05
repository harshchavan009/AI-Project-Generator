import React, { useState } from 'react';
import { Compass, ArrowRight, X } from 'lucide-react';

interface NextStepPromptProps {
  stepText: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const NextStepPrompt: React.FC<NextStepPromptProps> = ({
  stepText,
  actionLabel,
  onAction,
  className = ''
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed || !stepText) return null;

  return (
    <div
      className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-30 max-w-xl w-[92%] sm:w-auto bg-[#1c1917] text-white px-4 py-2.5 rounded-full shadow-2xl border border-[#44403c] flex items-center justify-between gap-3 animate-in slide-in-from-bottom-3 duration-300 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="p-1 rounded-full bg-[#1d6e5c] text-white shrink-0">
          <Compass className="w-3.5 h-3.5" />
        </span>
        <div className="text-xs truncate">
          <span className="font-semibold text-emerald-400 mr-1.5 uppercase font-mono text-[10px] tracking-wide">
            Next:
          </span>
          <span className="text-[#f5f1e8] font-medium">{stepText}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="px-2.5 py-1 rounded-full bg-[#1d6e5c] hover:bg-[#165849] text-white text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-xs"
          >
            <span>{actionLabel}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
        <button
          onClick={() => setIsDismissed(true)}
          aria-label="Dismiss next step hint"
          className="p-1 rounded-full text-[#a8a29e] hover:text-white hover:bg-[#292524] transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
