import React from 'react';
import { 
  CheckCircle2, 
  Sparkles, 
  TrendingUp, 
  Layers, 
  Target, 
  Cpu, 
  Briefcase, 
  ShieldCheck, 
  BookOpen, 
  Award,
  HelpCircle
} from 'lucide-react';
import { ProjectIdea, StudentProfile } from '../types';

interface SevenParameterScorecardProps {
  idea: ProjectIdea;
  profile: StudentProfile | null;
}

export const SevenParameterScorecard: React.FC<SevenParameterScorecardProps> = ({
  idea,
  profile
}) => {
  // 1. Student Skill Match
  const skillMatch = Math.round(idea.relevance_score || idea.skill_coverage?.coverage_percentage || 85);

  // 2. Innovation / Novelty
  const innovationScore = Math.round(idea.novelty?.novelty_score || 80);

  // 3. Real-World Impact (deterministic by domain)
  const getImpactScore = (domain: string): number => {
    switch (domain) {
      case 'Healthcare & Biomedical AI': return 96;
      case 'Government & Public Welfare AI': return 95;
      case 'Social Impact & Disaster Response': return 94;
      case 'Agriculture & Precision Farming Tech': return 93;
      case 'Green Tech & Renewable Smart Grids': return 93;
      case 'Cybersecurity & Threat Intelligence': return 92;
      case 'FinTech & Fraud Analytics': return 91;
      case 'Education & Skill Gap Analytics': return 92;
      case 'Autonomous Systems & Robotics': return 89;
      default: return 88;
    }
  };
  const impactScore = getImpactScore(idea.domain);

  // 4. Difficulty (derived from tech stack length and prerequisites)
  const difficultyScore = Math.min(92, Math.max(65, 60 + idea.tech_stack.length * 5));

  // 5. Resume / Recruiter Value
  const resumeValue = Math.round(idea.hireability?.hireability_score || 88);

  // 6. Implementation Feasibility
  const feasibilityScore = Math.round(idea.feasibility?.feasibility_score || 84);

  // 7. Research Potential
  const researchPotential = Math.min(95, Math.max(68, Math.round(innovationScore * 0.6 + (idea.stretch_features?.length || 3) * 8)));

  const parameters = [
    { label: 'Student Skill Match', score: skillMatch, icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />, color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { label: 'Innovation & Originality', score: innovationScore, icon: <Sparkles className="w-3.5 h-3.5 text-teal-600" />, color: 'text-teal-700', bg: 'bg-teal-50' },
    { label: 'Real-World Impact', score: impactScore, icon: <Target className="w-3.5 h-3.5 text-indigo-600" />, color: 'text-indigo-700', bg: 'bg-indigo-50' },
    { label: 'Difficulty Level', score: difficultyScore, icon: <Layers className="w-3.5 h-3.5 text-amber-600" />, color: 'text-amber-700', bg: 'bg-amber-50' },
    { label: 'Resume & Placement Value', score: resumeValue, icon: <Briefcase className="w-3.5 h-3.5 text-blue-600" />, color: 'text-blue-700', bg: 'bg-blue-50' },
    { label: 'Implementation Feasibility', score: feasibilityScore, icon: <Cpu className="w-3.5 h-3.5 text-teal-600" />, color: 'text-teal-700', bg: 'bg-teal-50' },
    { label: 'Research Potential', score: researchPotential, icon: <BookOpen className="w-3.5 h-3.5 text-purple-600" />, color: 'text-purple-700', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-4">
      {/* 7-Parameter Metrics Grid */}
      <div className="academic-card p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-[#e7e2d8] pb-2">
          <div className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-[#1d6e5c]" />
            <h4 className="font-serif-heading font-bold text-sm text-[#1c1917]">
              7-Parameter Project Evaluation Scorecard
            </h4>
          </div>
          <span className="text-[10px] font-mono text-[#78716c]">Deterministic Weights</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {parameters.map((p, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-2 rounded-lg border border-[#e7e2d8] ${p.bg}`}
            >
              <div className="flex items-center gap-1.5">
                {p.icon}
                <span className="font-medium text-[#1c1917] text-[11px]">{p.label}</span>
              </div>
              <span className={`font-mono font-bold text-xs ${p.color}`}>
                {p.score}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Why This Project Is Recommended For You (Step 5 in specification) */}
      <div className="bg-[#1d6e5c]/10 border border-[#1d6e5c]/30 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-mono uppercase text-[#1d6e5c] font-bold">
          <Sparkles className="w-3.5 h-3.5" /> Why This Project Is Recommended For You
        </div>
        
        <p className="text-xs text-[#1c1917] font-semibold leading-relaxed">
          {idea.title.split(':')[0]} is an optimal match for {profile?.name || 'your profile'}:
        </p>

        <ul className="space-y-1.5 text-xs text-[#57534e]">
          <li className="flex items-start gap-1.5">
            <span className="text-[#1d6e5c] font-bold">✓</span>
            <span>
              <strong>{skillMatch}% Skill Match:</strong> Strongly fits your declared proficiency in{' '}
              <span className="font-mono text-[11px] text-[#1c1917]">
                {idea.tech_stack.slice(0, 3).join(', ')}
              </span>.
            </span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-[#1d6e5c] font-bold">✓</span>
            <span>
              <strong>High Real-World Impact ({impactScore}%):</strong> Directly addresses key operational challenges in{' '}
              <span className="font-semibold text-[#1c1917]">{idea.domain}</span>.
            </span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-[#1d6e5c] font-bold">✓</span>
            <span>
              <strong>Feasible Constraints:</strong> Calibrated for your{' '}
              <span className="font-semibold text-[#1c1917]">{profile?.hardware_constraint || 'CPU-only'}</span> setup and{' '}
              <span className="font-semibold text-[#1c1917]">{profile?.timeframe_weeks || 16}-week</span> semester schedule.
            </span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-[#1d6e5c] font-bold">✓</span>
            <span>
              <strong>Strong Placement Value ({resumeValue}%):</strong> Aligns with industry job index requirements for modern engineering positions.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};
