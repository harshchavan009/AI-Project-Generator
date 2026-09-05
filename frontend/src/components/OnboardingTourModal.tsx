import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft, CheckCircle, Compass, Cpu, Layers, MessageSquareCode, Sparkles } from 'lucide-react';

interface OnboardingTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
}

export const OnboardingTourModal: React.FC<OnboardingTourModalProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  const steps = [
    {
      title: "Welcome to Meridian",
      subtitle: "Your Final-Year Project Partner",
      icon: <Sparkles className="w-8 h-8 text-[#1d6e5c]" />,
      badge: "Step 1 of 3",
      headline: "1. Tell Us What You Know & What You Have",
      description: "Start by selecting the programming languages and tools you've used, your team size, and your computer hardware (like CPU-only or laptop). We'll only suggest projects you can realistically build and finish within your semester timeline.",
      cta: "Set Your Skills",
      route: "/profile"
    },
    {
      title: "Find Your Perfect Project",
      subtitle: "Ideas Matched to Your Exact Skills",
      icon: <Layers className="w-8 h-8 text-[#1d6e5c]" />,
      badge: "Step 2 of 3",
      headline: "2. Explore Ideas with Match & Originality Scores",
      description: "Browse 100+ curated project ideas on a visual bubble graph. Green bubbles mean highly original projects that avoid duplicating previous submissions. The match score shows how ready your team is to begin immediately.",
      cta: "Find Projects",
      route: "/"
    },
    {
      title: "Build & Defend with Confidence",
      subtitle: "Step-by-Step Guidance & Viva Prep",
      icon: <MessageSquareCode className="w-8 h-8 text-[#1d6e5c]" />,
      badge: "Step 3 of 3",
      headline: "3. Complete Roadmap, Code Tasks & Viva Practice",
      description: "Adopt an idea to get a clear blueprint, MVP checklist, and milestone tasks. Chat with Dr. Aris (your technical advisor) whenever you hit a roadblock, and practice answering realistic viva voce oral defense questions.",
      cta: "Open Project Studio",
      route: "/project"
    }
  ];

  const step = steps[currentStep];

  const handleFinish = () => {
    if (dontShowAgain) {
      localStorage.setItem('capstoneforge_has_seen_tour', 'true');
    }
    onClose();
  };

  const handleCtaClick = () => {
    handleFinish();
    onNavigate(step.route);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-modal-title"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="bg-[#fbf9f5] border border-[#d6cfc4] rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#ede8df] border-b border-[#d6cfc4] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-white shadow-xs border border-[#d6cfc4]">
              {step.icon}
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#1d6e5c] bg-[#1d6e5c]/10 px-2 py-0.5 rounded-full">
                {step.badge}
              </span>
              <h2 id="tour-modal-title" className="text-base font-bold text-[#1c1917] font-serif-heading mt-0.5">
                {step.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Skip guided tour"
            className="p-1 rounded-md text-[#78716c] hover:text-[#1c1917] hover:bg-[#e2dcd2] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Content */}
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-[#1c1917]">
              {step.headline}
            </h3>
            <p className="text-xs leading-relaxed text-[#57534e]">
              {step.description}
            </p>
          </div>

          {/* Progress Indicator Dots */}
          <div className="flex items-center justify-center gap-2 py-2">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                aria-label={`Go to step ${idx + 1}`}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStep
                    ? 'w-6 bg-[#1d6e5c]'
                    : 'w-2 bg-[#d6cfc4] hover:bg-[#a8a29e]'
                }`}
              />
            ))}
          </div>

          {/* Don't show again checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="dontShowAgain"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-[#d6cfc4] text-[#1d6e5c] focus:ring-[#1d6e5c]"
            />
            <label htmlFor="dontShowAgain" className="text-xs text-[#78716c] cursor-pointer">
              Don't show this guided tour on next visit
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-[#ede8df] border-t border-[#d6cfc4] flex items-center justify-between">
          <div>
            {currentStep > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="px-3 py-1.5 rounded-lg border border-[#d6cfc4] bg-white text-xs font-semibold text-[#57534e] hover:bg-[#f3eee5] transition-all flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCtaClick}
              className="px-3 py-1.5 rounded-lg bg-white border border-[#1d6e5c]/30 text-xs font-semibold text-[#1d6e5c] hover:bg-[#1d6e5c]/10 transition-all"
            >
              {step.cta}
            </button>

            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="px-4 py-1.5 rounded-lg bg-[#1d6e5c] text-white text-xs font-semibold hover:bg-[#165849] transition-all flex items-center gap-1.5 shadow-sm"
              >
                Next <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="px-4 py-1.5 rounded-lg bg-[#1d6e5c] text-white text-xs font-semibold hover:bg-[#165849] transition-all flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Get Started
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
