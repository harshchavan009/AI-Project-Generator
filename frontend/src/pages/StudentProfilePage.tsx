import React, { useState, useEffect } from 'react';
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
  ChevronDown
} from 'lucide-react';
import { TaxonomyCategory, StudentProfile, SkillItem } from '../types';
import { ApiService } from '../services/api';

interface StudentProfilePageProps {
  activeProfile: StudentProfile | null;
  onProfileUpdated: (updated: StudentProfile) => void;
  navigate: (route: string) => void;
}

const DOMAINS_LIST = [
  "Healthcare & Biomedical AI",
  "Edge AI & TinyML / IoT",
  "Autonomous Systems & Robotics",
  "Cybersecurity & Threat Intelligence",
  "FinTech & Fraud Analytics",
  "Green Tech & Renewable Smart Grids",
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
  const [categories, setCategories] = useState<TaxonomyCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('languages');
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [name, setName] = useState(activeProfile?.name || 'Student Engineer');
  const [branch, setBranch] = useState(activeProfile?.branch || 'Computer Science & Engineering');
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
        // Toggle off if clicked same
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

  const handleSaveProfile = async () => {
    setIsSaving(true);
    const newProfile: StudentProfile = {
      id: activeProfile?.id || `std-${Date.now().toString(36)}`,
      name,
      branch,
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
        <span className="text-xs font-mono uppercase text-[#78716c]">Student Profile Form</span>
        <h1 className="font-serif-heading font-bold text-3xl text-[#1c1917] mt-1">
          Skill Taxonomy & Project Constraints
        </h1>
        <p className="text-xs text-[#57534e] mt-1">
          Rate your self-assessed proficiency from 1 to 5 across versioned engineering categories.
          Our backend represents your competencies as a weighted vector over the taxonomy.
        </p>
      </div>

      {/* Constraints Grid */}
      <div className="academic-card p-6 space-y-6">
        <h3 className="font-serif-heading font-bold text-lg text-[#1c1917] flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#1d6e5c]" />
          1. Capstone Parameters & Resource Limits
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-sans">
          {/* Student Name & Branch */}
          <div className="space-y-1">
            <label className="text-[#78716c] font-mono uppercase text-[10px] block">Student / Team Lead Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#faf7f2] border border-[#d6cfc4] rounded px-3 py-2 text-xs font-semibold text-[#1c1917] focus:outline-none focus:ring-1 focus:ring-[#1d6e5c]"
            />
          </div>

          {/* Team Size */}
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
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Timeframe Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[#78716c] font-mono uppercase text-[10px]">
              <span>Timeline:</span>
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
              <span>8 wks</span>
              <span>16 wks (Std)</span>
              <span>24 wks</span>
            </div>
          </div>

          {/* Hardware Constraints */}
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

      {/* 2. Structured Skill Taxonomy Picker */}
      <div className="academic-card p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e7e2d8] pb-4">
          <div>
            <h3 className="font-serif-heading font-bold text-lg text-[#1c1917] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#1d6e5c]" />
              2. Categorized Skill Inventory
            </h3>
            <p className="text-xs text-[#78716c]">
              Select your level for skills you know: 1 (Novice) to 5 (Expert). Unselected skills default to 0.
            </p>
          </div>
          <span className="font-mono text-xs bg-[#1d6e5c]/10 text-[#1d6e5c] font-bold px-2.5 py-1 rounded">
            {Object.keys(skills).length} Active Skills Rated
          </span>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1.5 border-b border-[#e7e2d8] pb-3">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeCategory === c.id
                  ? 'bg-[#1d6e5c] text-white'
                  : 'bg-[#faf7f2] text-[#57534e] hover:bg-[#ede8df]'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Category Description */}
        {currentCategoryData && (
          <div className="space-y-4">
            <p className="text-xs text-[#78716c] italic">
              {currentCategoryData.description}
            </p>

            {/* Skills Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentCategoryData.skills.map((skill) => {
                const currentLevel = skills[skill.id] || 0;
                return (
                  <div
                    key={skill.id}
                    className={`p-3 rounded-lg border transition-all ${
                      currentLevel > 0
                        ? 'bg-white border-[#1d6e5c] shadow-sm'
                        : 'bg-[#faf7f2] border-[#e7e2d8]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <span className="font-bold text-xs text-[#1c1917]">{skill.name}</span>
                        {skill.description && (
                          <p className="text-[11px] text-[#78716c] mt-0.5 line-clamp-1">{skill.description}</p>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-[#a8a29e]">
                        Diff: {skill.difficulty}/5
                      </span>
                    </div>

                    {/* 1-5 Rating Buttons */}
                    <div className="flex items-center gap-1 mt-2">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => handleProficiencyChange(skill.id, lvl)}
                          className={`flex-1 py-1 text-[10px] font-mono font-bold rounded transition-all ${
                            currentLevel >= lvl
                              ? 'bg-[#1d6e5c] text-white'
                              : 'bg-[#ede8df] text-[#78716c] hover:bg-[#d6cfc4]'
                          }`}
                        >
                          L{lvl}
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
          {isSaving ? 'Compiling Vector & Re-Ranking...' : 'Save Profile & Re-Compute Graph Matches'}
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </div>

    </div>
  );
};
