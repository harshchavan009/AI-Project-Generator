import React, { useState, useEffect, useMemo } from 'react';
import { 
  Check, 
  Sparkles, 
  Cpu, 
  Users, 
  Calendar, 
  BookOpen, 
  Save, 
  ArrowRight, 
  Layers, 
  ChevronDown,
  GraduationCap,
  Target,
  Zap,
  ShieldCheck,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { TaxonomyCategory, StudentProfile, SkillItem } from '../types';
import { ApiService } from '../services/api';
import { useViewMode } from '../context/ViewModeContext';
import { NextStepPrompt } from '../components/NextStepPrompt';

interface StudentProfilePageProps {
  activeProfile: StudentProfile | null;
  onProfileUpdated: (updated: StudentProfile) => void;
  navigate: (route: string) => void;
}

const DOMAINS_LIST = [
  "Healthcare & Biomedical AI",
  "Edge AI & TinyML / IoT",
  "Government & Public Welfare AI",
  "Education & Skill Gap Analytics",
  "Agriculture & Precision Farming Tech",
  "FinTech & Fraud Analytics",
  "Cybersecurity & Threat Intelligence",
  "Green Tech & Renewable Smart Grids",
  "Social Impact & Disaster Response",
  "Autonomous Systems & Robotics",
  "Distributed Systems & Cloud Infrastructure",
  "Developer Tooling & Program Analysis",
  "Computer Vision & Spatial Computing",
  "NLP & Knowledge Graphs"
];

export const StudentProfilePage: React.FC<StudentProfilePageProps> = ({
  activeProfile,
  onProfileUpdated,
  navigate
}) => {
  const { isSimple } = useViewMode();
  const [categories, setCategories] = useState<TaxonomyCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('languages');
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [name, setName] = useState(activeProfile?.name || 'Student Engineer');
  const [degree, setDegree] = useState<StudentProfile['degree']>(activeProfile?.degree || 'B.Tech');
  const [year, setYear] = useState<StudentProfile['year']>(activeProfile?.year || '4th Year (Final)');
  const [branch, setBranch] = useState(activeProfile?.branch || 'Computer Science & Engineering');
  const [projectGoal, setProjectGoal] = useState<StudentProfile['project_goal']>(activeProfile?.project_goal || 'College Capstone');
  const [preferredComplexity, setPreferredComplexity] = useState<StudentProfile['preferred_complexity']>(activeProfile?.preferred_complexity || 'Intermediate');
  const [projectPreference, setProjectPreference] = useState<StudentProfile['project_preference']>(activeProfile?.project_preference || 'AI / ML');
  const [teamSize, setTeamSize] = useState<number>(activeProfile?.team_size || 2);
  const [timeframe, setTimeframe] = useState<number>(activeProfile?.timeframe_weeks || 16);
  const [hardware, setHardware] = useState<StudentProfile['hardware_constraint']>(
    activeProfile?.hardware_constraint || 'CPU-only'
  );
  const [selectedDomains, setSelectedDomains] = useState<string[]>(
    activeProfile?.interest_domains || ["Healthcare & Biomedical AI", "Edge AI & TinyML / IoT"]
  );
  const [skills, setSkills] = useState<Record<string, number>>(
    activeProfile?.skills || {
      python: 4,
      pytorch: 3,
      fastapi: 2,
      sql: 3
    }
  );

  useEffect(() => {
    ApiService.getTaxonomy()
      .then((res) => {
        if (res.categories) {
          setCategories(res.categories);
          if (res.categories.length > 0) {
            setActiveCategory(res.categories[0].id);
          }
        }
      })
      .catch((err) => console.error('Failed to load taxonomy:', err));
  }, []);

  const handleProficiencyChange = (skillId: string, level: number) => {
    setSkills((prev) => {
      const next = { ...prev };
      if (next[skillId] === level) {
        delete next[skillId];
      } else {
        next[skillId] = level;
      }
      return next;
    });
  };

  const toggleDomain = (domain: string) => {
    setSelectedDomains((prev) => {
      if (prev.includes(domain)) {
        return prev.filter((d) => d !== domain);
      } else {
        return [...prev, domain];
      }
    });
  };

  // Automated Skill Profile Synthesis (Step 3 of user specification)
  const skillProfileAnalysis = useMemo(() => {
    const ratedSkillKeys = Object.keys(skills);
    const strongSkills = ratedSkillKeys.filter((k) => (skills[k] || 0) >= 3);
    const developingSkills = ratedSkillKeys.filter((k) => (skills[k] || 0) < 3);

    // Derive Persona
    let persona = "Full-Stack Software Engineering Lead";
    if (projectPreference === 'AI / ML' || strongSkills.some(s => s.includes('pytorch') || s.includes('onnx') || s.includes('python'))) {
      persona = "Applied AI & Systems Architecture Engineer";
    } else if (projectPreference === 'IoT & Embedded') {
      persona = "Embedded Systems & Edge Computing Engineer";
    } else if (projectPreference === 'Cybersecurity') {
      persona = "Cybersecurity & Infrastructure Systems Specialist";
    }

    // Derive Strengths
    const strengths: string[] = [];
    if (strongSkills.some(s => ['python', 'golang', 'java', 'cplusplus'].includes(s))) {
      strengths.push("Core Algorithmic Programming");
    }
    if (strongSkills.some(s => ['fastapi', 'nodejs', 'django', 'express'].includes(s))) {
      strengths.push("Backend & REST/ASGI Microservice Architecture");
    }
    if (strongSkills.some(s => ['sql', 'postgresql', 'mongodb', 'timescaledb'].includes(s))) {
      strengths.push("Relational Data Modeling & Schemas");
    }
    if (strongSkills.some(s => ['pytorch', 'tensorflow', 'scikit_learn', 'onnx_runtime'].includes(s))) {
      strengths.push("Machine Learning & Quantized Inference");
    }
    if (strongSkills.some(s => ['react', 'vue', 'typescript'].includes(s))) {
      strengths.push("Modern Client UI & State Architecture");
    }
    if (strengths.length === 0) {
      strengths.push("Foundational Software Engineering");
    }

    // Derive Weaknesses / Growth Areas
    const weaknesses: string[] = [];
    if (!strongSkills.some(s => ['docker', 'kubernetes', 'linux_admin'].includes(s))) {
      weaknesses.push("Production Containerization & DevOps");
    }
    if (!strongSkills.some(s => ['react', 'typescript', 'tailwind'].includes(s)) && projectPreference !== 'IoT & Embedded') {
      weaknesses.push("Frontend User Experience & Interactive State");
    }
    if (!strongSkills.some(s => ['onnx_runtime', 'tinyml', 'scikit_learn'].includes(s)) && projectPreference === 'AI / ML') {
      weaknesses.push("Model Quantization & Edge Latency Optimization");
    }
    if (developingSkills.length > 0) {
      weaknesses.push(`Prerequisite Practice on: ${developingSkills.slice(0, 2).join(', ')}`);
    }

    // Derive Recommended Technologies
    const recommendedTech: string[] = [];
    if (projectPreference === 'AI / ML') {
      recommendedTech.push("Python", "FastAPI", "PostgreSQL", "FastEmbed / ONNX INT8", "React");
    } else if (projectPreference === 'IoT & Embedded') {
      recommendedTech.push("C/C++", "ESP32", "MQTT", "TinyML", "InfluxDB");
    } else if (projectPreference === 'Cybersecurity') {
      recommendedTech.push("Go", "Python", "eBPF", "Docker", "TimescaleDB");
    } else {
      recommendedTech.push("TypeScript", "React", "FastAPI", "PostgreSQL", "Docker");
    }

    return {
      persona,
      strengths,
      weaknesses,
      recommendedTech
    };
  }, [skills, projectPreference]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    const newProfile: StudentProfile = {
      id: activeProfile?.id || `std-${Date.now().toString(36)}`,
      name,
      degree,
      year,
      branch,
      project_goal: projectGoal,
      preferred_complexity: preferredComplexity,
      project_preference: projectPreference,
      team_size: teamSize,
      timeframe_weeks: timeframe,
      hardware_constraint: hardware,
      interest_domains: selectedDomains,
      skills,
      selected_idea_id: activeProfile?.selected_idea_id
    };

    try {
      await ApiService.saveProfile(newProfile);
      onProfileUpdated(newProfile);
      navigate('/');
    } catch (err) {
      console.error('Save profile error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const currentCategoryData = categories.find((c) => c.id === activeCategory);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-[#e7e2d8] pb-4">
        <span className="text-xs font-mono uppercase text-[#78716c]">
          {isSimple ? "Your Profile & Preferences" : "Student Profile Form"}
        </span>
        <h1 className="font-serif-heading font-bold text-3xl text-[#1c1917] mt-1">
          {isSimple ? "Your Skills & Project Setup" : "Skill Taxonomy & Project Constraints"}
        </h1>
        <p className="text-xs text-[#57534e] mt-1">
          {isSimple
            ? "Tell us your degree, technical skills, and project goals. We convert your profile into an explainable blueprint with realistic engineering recommendations."
            : "Rate your self-assessed proficiency from 1 to 5 across versioned engineering categories. Our backend represents your competencies as a weighted vector over the taxonomy."}
        </p>
      </div>

      {/* 1. Academic Parameters & Project Goals */}
      <div className="academic-card p-6 space-y-6">
        <h3 className="font-serif-heading font-bold text-lg text-[#1c1917] flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-[#1d6e5c]" />
          1. Academic Background & Project Goals
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-sans">
          {/* Name */}
          <div className="space-y-1">
            <label className="text-[#78716c] font-mono uppercase text-[10px] block">Student / Team Lead Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#faf7f2] border border-[#d6cfc4] rounded px-3 py-2 text-xs font-semibold text-[#1c1917] focus:outline-none focus:ring-1 focus:ring-[#1d6e5c]"
            />
          </div>

          {/* Education / Degree */}
          <div className="space-y-1">
            <label className="text-[#78716c] font-mono uppercase text-[10px] block">Education / Degree</label>
            <select
              value={degree}
              onChange={(e) => setDegree(e.target.value as any)}
              className="w-full bg-[#faf7f2] border border-[#d6cfc4] rounded px-3 py-2 text-xs font-semibold text-[#1c1917] focus:outline-none focus:ring-1 focus:ring-[#1d6e5c]"
            >
              <option value="B.Tech">B.Tech / B.E.</option>
              <option value="BCA">BCA (Computer Applications)</option>
              <option value="MCA">MCA (Master of Computer Applications)</option>
              <option value="M.Tech">M.Tech / M.E.</option>
              <option value="B.Sc / M.Sc">B.Sc / M.Sc (Computer Science)</option>
            </select>
          </div>

          {/* Academic Year */}
          <div className="space-y-1">
            <label className="text-[#78716c] font-mono uppercase text-[10px] block">Academic Year</label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value as any)}
              className="w-full bg-[#faf7f2] border border-[#d6cfc4] rounded px-3 py-2 text-xs font-semibold text-[#1c1917] focus:outline-none focus:ring-1 focus:ring-[#1d6e5c]"
            >
              <option value="4th Year (Final)">4th Year (Final Year Capstone)</option>
              <option value="3rd Year">3rd Year (Pre-Final Project)</option>
              <option value="2nd Year">2nd Year</option>
              <option value="1st Year">1st Year</option>
            </select>
          </div>

          {/* Branch */}
          <div className="space-y-1">
            <label className="text-[#78716c] font-mono uppercase text-[10px] block">Department / Branch</label>
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full bg-[#faf7f2] border border-[#d6cfc4] rounded px-3 py-2 text-xs font-semibold text-[#1c1917] focus:outline-none focus:ring-1 focus:ring-[#1d6e5c]"
            />
          </div>
        </div>

        {/* Project Intent & Constraints */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-sans pt-2 border-t border-[#f5f1e8]">
          {/* Project Goal */}
          <div className="space-y-1">
            <label className="text-[#78716c] font-mono uppercase text-[10px] block flex items-center gap-1">
              <Target className="w-3 h-3 text-[#1d6e5c]" /> Primary Project Goal
            </label>
            <select
              value={projectGoal}
              onChange={(e) => setProjectGoal(e.target.value as any)}
              className="w-full bg-[#faf7f2] border border-[#d6cfc4] rounded px-3 py-2 text-xs font-semibold text-[#1c1917] focus:outline-none focus:ring-1 focus:ring-[#1d6e5c]"
            >
              <option value="College Capstone">College Final-Year Capstone</option>
              <option value="Resume / Placement Project">Resume & Placement Showcase</option>
              <option value="Hackathon Winning Project">Hackathon Winner / Fast Prototype</option>
              <option value="Startup MVP">Startup MVP / Commercial Launch</option>
              <option value="Research Publication">Research Paper Publication</option>
            </select>
          </div>

          {/* Project Preference */}
          <div className="space-y-1">
            <label className="text-[#78716c] font-mono uppercase text-[10px] block flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#1d6e5c]" /> Project Type Preference
            </label>
            <select
              value={projectPreference}
              onChange={(e) => setProjectPreference(e.target.value as any)}
              className="w-full bg-[#faf7f2] border border-[#d6cfc4] rounded px-3 py-2 text-xs font-semibold text-[#1c1917] focus:outline-none focus:ring-1 focus:ring-[#1d6e5c]"
            >
              <option value="AI / ML">AI / Machine Learning & RAG</option>
              <option value="Full-stack Web Application">Full-Stack Web Application</option>
              <option value="Mobile App">Mobile Application (Cross-Platform)</option>
              <option value="IoT & Embedded">IoT, TinyML & Embedded Systems</option>
              <option value="Cloud & Distributed Systems">Cloud & Distributed Systems</option>
              <option value="Cybersecurity">Cybersecurity & Threat Analysis</option>
            </select>
          </div>

          {/* Preferred Complexity */}
          <div className="space-y-1">
            <label className="text-[#78716c] font-mono uppercase text-[10px] block">Target Complexity</label>
            <div className="grid grid-cols-3 gap-1">
              {(['Beginner', 'Intermediate', 'Advanced'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setPreferredComplexity(lvl)}
                  className={`py-2 rounded font-mono font-bold text-[11px] border transition-all ${
                    preferredComplexity === lvl
                      ? 'bg-[#1d6e5c] text-white border-[#1d6e5c]'
                      : 'bg-[#faf7f2] text-[#57534e] border-[#d6cfc4] hover:bg-[#ede8df]'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Hardware Constraint */}
          <div className="space-y-1">
            <label className="text-[#78716c] font-mono uppercase text-[10px] block">Hardware Constraint</label>
            <select
              value={hardware}
              onChange={(e) => setHardware(e.target.value as any)}
              className="w-full bg-[#faf7f2] border border-[#d6cfc4] rounded px-3 py-2 text-xs font-semibold text-[#1c1917] focus:outline-none focus:ring-1 focus:ring-[#1d6e5c]"
            >
              <option value="CPU-only">CPU-only (Standard Laptop)</option>
              <option value="GPU available">GPU Available (CUDA / MPS)</option>
              <option value="IoT hardware">IoT Hardware (ESP32 / Sensors)</option>
              <option value="none">Cloud / No Local Hardware</option>
            </select>
          </div>
        </div>

        {/* Team Size & Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans pt-2 border-t border-[#f5f1e8]">
          <div className="space-y-1">
            <label className="text-[#78716c] font-mono uppercase text-[10px] block">Team Size</label>
            <div className="grid grid-cols-4 gap-1">
              {[1, 2, 3, 4].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setTeamSize(size)}
                  className={`py-2 rounded font-mono font-bold text-xs border transition-all ${
                    teamSize === size
                      ? 'bg-[#1d6e5c] text-white border-[#1d6e5c]'
                      : 'bg-[#faf7f2] text-[#57534e] border-[#d6cfc4] hover:bg-[#ede8df]'
                  }`}
                >
                  {size} {size === 1 ? 'Solo' : 'Devs'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[#78716c] font-mono uppercase text-[10px]">
              <span>Timeline Duration:</span>
              <span className="font-bold text-[#1d6e5c]">{timeframe} Weeks</span>
            </div>
            <input
              type="range"
              min={8}
              max={24}
              step={2}
              value={timeframe}
              onChange={(e) => setTimeframe(Number(e.target.value))}
              className="w-full accent-[#1d6e5c] cursor-pointer mt-2"
            />
            <div className="flex justify-between text-[10px] text-[#a8a29e] font-mono">
              <span>8 wks (Hackathon)</span>
              <span>16 wks (Std Semester)</span>
              <span>24 wks (Full Year)</span>
            </div>
          </div>
        </div>

        {/* Domain Selection Multi-select */}
        <div className="space-y-2 pt-2 border-t border-[#f5f1e8]">
          <label className="text-[#78716c] font-mono uppercase text-[10px] block">
            Select Domains of Interest (Multi-select)
          </label>
          <div className="flex flex-wrap gap-2">
            {DOMAINS_LIST.map((domain) => {
              const isSelected = selectedDomains.includes(domain);
              return (
                <button
                  key={domain}
                  type="button"
                  onClick={() => toggleDomain(domain)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#1d6e5c] text-white border-[#1d6e5c] shadow-sm'
                      : 'bg-[#faf7f2] text-[#57534e] border-[#d6cfc4] hover:bg-[#ede8df]'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3" />}
                  {domain}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. AI Student Skill Profile Card (Step 3) */}
      <div className="academic-card p-6 space-y-4 border-2 border-[#1d6e5c]/30 bg-gradient-to-br from-white via-[#faf7f2] to-[#f5f1e8]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e7e2d8] pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#1d6e5c] text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-[#1d6e5c] font-bold">
                Synthesized Profile Analysis
              </span>
              <h3 className="font-serif-heading font-bold text-lg text-[#1c1917]">
                {name}'s AI Engineering Persona
              </h3>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-[#1d6e5c]/10 text-[#1d6e5c] border border-[#1d6e5c]/20 self-start sm:self-auto">
            {skillProfileAnalysis.persona}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Strengths */}
          <div className="bg-white/80 p-3.5 rounded-xl border border-[#d6cfc4] space-y-2">
            <span className="text-[10px] font-mono uppercase text-emerald-700 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Confirmed Strengths
            </span>
            <ul className="space-y-1 text-xs text-[#1c1917]">
              {skillProfileAnalysis.strengths.map((s, idx) => (
                <li key={idx} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Growth Areas / Weaknesses */}
          <div className="bg-white/80 p-3.5 rounded-xl border border-[#d6cfc4] space-y-2">
            <span className="text-[10px] font-mono uppercase text-amber-700 font-bold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-amber-600" /> Focus Areas & Skill Gaps
            </span>
            <ul className="space-y-1 text-xs text-[#57534e]">
              {skillProfileAnalysis.weaknesses.map((w, idx) => (
                <li key={idx} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recommended Technologies */}
          <div className="bg-white/80 p-3.5 rounded-xl border border-[#d6cfc4] space-y-2">
            <span className="text-[10px] font-mono uppercase text-[#1d6e5c] font-bold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-[#1d6e5c]" /> Recommended Stack
            </span>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {skillProfileAnalysis.recommendedTech.map((t, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-[#faf7f2] border border-[#d6cfc4] text-[#1c1917] font-mono text-[11px] font-semibold rounded"
                >
                  {t}
                </span>
              ))}
            </div>
            <p className="text-[10px] text-[#78716c] pt-1">
              Tailored to your {degree} curriculum and {hardware} bounds.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Categorized Skill Inventory */}
      <div className="academic-card p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e7e2d8] pb-4">
          <div>
            <h3 className="font-serif-heading font-bold text-lg text-[#1c1917] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#1d6e5c]" />
              3. Categorized Skill Inventory
            </h3>
            <p className="text-xs text-[#57534e]">
              Click a proficiency rating (1 = novice, 5 = production expert). Unselected skills default to unrated.
            </p>
          </div>

          <span className="text-xs font-mono text-[#78716c] bg-[#faf7f2] border border-[#d6cfc4] px-2.5 py-1 rounded">
            Rated: <strong>{Object.keys(skills).length}</strong> skills
          </span>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'bg-[#1d6e5c] text-white shadow-xs font-bold'
                  : 'bg-[#faf7f2] text-[#57534e] hover:bg-[#ede8df]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Skills in Active Category */}
        {currentCategoryData && (
          <div className="space-y-3">
            <div className="text-xs text-[#78716c] italic">
              {currentCategoryData.description}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {currentCategoryData.skills.map((skill) => {
                const currentLevel = skills[skill.id] || 0;
                return (
                  <div
                    key={skill.id}
                    className="p-3 bg-[#faf7f2] border border-[#e7e2d8] rounded-lg flex items-center justify-between gap-3 hover:border-[#1d6e5c]/50 transition-colors"
                  >
                    <div>
                      <span className="font-semibold text-xs text-[#1c1917] block">
                        {skill.name}
                      </span>
                      {skill.description && (
                        <span className="text-[10px] text-[#78716c] line-clamp-1">
                          {skill.description}
                        </span>
                      )}
                    </div>

                    {/* 1..5 Rating Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => handleProficiencyChange(skill.id, lvl)}
                          className={`w-6 h-6 rounded text-xs font-mono font-bold transition-all ${
                            currentLevel >= lvl
                              ? 'bg-[#1d6e5c] text-white shadow-xs'
                              : 'bg-white text-[#78716c] border border-[#d6cfc4] hover:border-[#1d6e5c]'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Floating Bottom Bar: Save & Match */}
      <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md border border-[#d6cfc4] rounded-xl p-4 shadow-xl flex items-center justify-between">
        <div className="text-xs font-mono">
          <span className="text-[#78716c]">Profile Status: </span>
          <span className="font-bold text-[#1d6e5c]">{Object.keys(skills).length} skills</span>,{' '}
          <span className="font-bold text-[#1c1917]">{selectedDomains.length} domains</span>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={isSaving}
          className="px-6 py-2.5 bg-[#1d6e5c] text-white rounded-lg text-xs font-bold hover:bg-[#165648] transition-all shadow-md flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isSaving
            ? 'Updating Matches...'
            : isSimple
            ? 'Save Profile & See Matched Ideas'
            : 'Save Profile & Re-Compute Graph Matches'}
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </div>

      {/* Guided Next Step Prompt */}
      <NextStepPrompt
        stepText={
          Object.keys(skills).length < 5
            ? "Rate a few more skills across languages, backend, or ML to improve recommendation accuracy."
            : 'Click "Save Profile & See Matched Ideas" below to see projects tailored to your setup.'
        }
        actionLabel={Object.keys(skills).length >= 5 ? "Save Profile" : undefined}
        onAction={Object.keys(skills).length >= 5 ? handleSaveProfile : undefined}
      />

    </div>
  );
};
