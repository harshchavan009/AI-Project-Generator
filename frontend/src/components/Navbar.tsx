import React from 'react';
import { 
  Users, 
  GraduationCap,
  ShieldCheck,
  HelpCircle,
  LogIn,
  LogOut,
  User
} from 'lucide-react';
import { StudentProfile } from '../types';
import { UserAccount } from '../services/api';

interface NavbarProps {
  currentRoute: string;
  navigate: (route: string) => void;
  userRole: 'student' | 'faculty';
  setUserRole: (role: 'student' | 'faculty') => void;
  activeProfile: StudentProfile | null;
  onLoadPreset: (presetId: string) => void;
  currentUser: UserAccount | null;
  onOpenAuthModal: () => void;
  onOpenTourModal: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute,
  navigate,
  userRole,
  setUserRole,
  activeProfile,
  onLoadPreset,
  currentUser,
  onOpenAuthModal,
  onOpenTourModal,
  onLogout
}) => {
  return (
    <header role="banner" className="sticky top-0 z-40 bg-[#fbf9f5]/95 backdrop-blur-md border-b border-[#e7e2d8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Platform Name */}
          <div 
            className="flex items-center space-x-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1d6e5c] rounded-lg p-1"
            tabIndex={0}
            role="link"
            aria-label="CapstoneForge Home"
            onClick={() => navigate('/')}
            onKeyDown={(e) => { if (e.key === 'Enter') navigate('/'); }}
          >
            <div className="w-10 h-10 rounded-lg bg-[#1d6e5c] flex items-center justify-center shadow-xs text-white font-serif-heading font-bold text-lg">
              CF
            </div>
            <div>
              <span className="font-serif-heading font-bold text-xl tracking-tight text-[#1c1917] flex items-center gap-1.5">
                CapstoneForge
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#1d6e5c]/10 text-[#1d6e5c] font-semibold">
                  v2.0
                </span>
              </span>
              <p className="text-[11px] font-sans text-[#78716c] -mt-0.5">
                Production-Hardened Capstone Architect & Oversight
              </p>
            </div>
          </div>

          {/* Navigation Items with ARIA labels */}
          <nav aria-label="Main Navigation" className="hidden lg:flex items-center space-x-1">
            {userRole === 'student' ? (
              <>
                <button
                  onClick={() => navigate('/')}
                  aria-current={currentRoute === '/' ? 'page' : undefined}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    currentRoute === '/'
                      ? 'bg-[#1d6e5c] text-white shadow-xs'
                      : 'text-[#44403c] hover:text-[#1c1917] hover:bg-[#ede8df]'
                  }`}
                >
                  Idea Discovery (Graph)
                </button>
                <button
                  onClick={() => navigate('/profile')}
                  aria-current={currentRoute === '/profile' ? 'page' : undefined}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    currentRoute === '/profile'
                      ? 'bg-[#1d6e5c] text-white shadow-xs'
                      : 'text-[#44403c] hover:text-[#1c1917] hover:bg-[#ede8df]'
                  }`}
                >
                  Skill Taxonomy
                </button>
                <button
                  onClick={() => navigate('/project')}
                  aria-current={currentRoute.startsWith('/project') ? 'page' : undefined}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    currentRoute.startsWith('/project')
                      ? 'bg-[#1d6e5c] text-white shadow-xs'
                      : 'text-[#44403c] hover:text-[#1c1917] hover:bg-[#ede8df]'
                  }`}
                >
                  Project Studio & Roadmap
                </button>
                <button
                  onClick={() => navigate('/mentor')}
                  aria-current={currentRoute === '/mentor' ? 'page' : undefined}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    currentRoute === '/mentor'
                      ? 'bg-[#1d6e5c] text-white shadow-xs'
                      : 'text-[#44403c] hover:text-[#1c1917] hover:bg-[#ede8df]'
                  }`}
                >
                  Mentor & AST Viva
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/faculty')}
                  aria-current={currentRoute === '/faculty' ? 'page' : undefined}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    currentRoute === '/faculty'
                      ? 'bg-[#1d6e5c] text-white shadow-xs'
                      : 'text-[#44403c] hover:text-[#1c1917] hover:bg-[#ede8df]'
                  }`}
                >
                  Cohort Overview
                </button>
                <button
                  onClick={() => navigate('/faculty/duplicates')}
                  aria-current={currentRoute === '/faculty/duplicates' ? 'page' : undefined}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    currentRoute === '/faculty/duplicates'
                      ? 'bg-[#1d6e5c] text-white shadow-xs'
                      : 'text-[#44403c] hover:text-[#1c1917] hover:bg-[#ede8df]'
                  }`}
                >
                  Duplicate Detection Radar
                </button>
                <button
                  onClick={() => navigate('/faculty/distribution')}
                  aria-current={currentRoute === '/faculty/distribution' ? 'page' : undefined}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    currentRoute === '/faculty/distribution'
                      ? 'bg-[#1d6e5c] text-white shadow-xs'
                      : 'text-[#44403c] hover:text-[#1c1917] hover:bg-[#ede8df]'
                  }`}
                >
                  Difficulty Distribution
                </button>
              </>
            )}
          </nav>

          {/* Right Action: Presets, Tour, Auth & Role Switcher */}
          <div className="flex items-center space-x-2.5">
            
            {/* Guided Tour Trigger */}
            <button
              onClick={onOpenTourModal}
              aria-label="Open guided onboarding tour"
              title="Guided Onboarding Tour"
              className="p-1.5 rounded-lg border border-[#d6cfc4] bg-[#faf7f2] text-[#57534e] hover:text-[#1d6e5c] hover:border-[#1d6e5c] transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Quick Demo Presets Dropdown */}
            <div className="hidden sm:block">
              <select
                onChange={(e) => onLoadPreset(e.target.value)}
                defaultValue=""
                aria-label="Quick Demo Student Profile Presets"
                className="bg-[#faf7f2] border border-[#d6cfc4] text-[#1c1917] text-xs font-mono rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1d6e5c]"
              >
                <option value="" disabled>Student Presets</option>
                <option value="priya">Priya (AI Healthcare)</option>
                <option value="rohan">Rohan (TinyML IoT)</option>
                <option value="ananya">Ananya (SecOps eBPF)</option>
                <option value="vikram">Vikram (FinTech GNN)</option>
              </select>
            </div>

            {/* Role Switcher Pill */}
            <div className="flex items-center bg-[#ede8df] p-0.5 rounded-lg border border-[#d6cfc4]" role="group" aria-label="Role Switcher">
              <button
                onClick={() => {
                  setUserRole('student');
                  navigate('/');
                }}
                aria-pressed={userRole === 'student'}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  userRole === 'student'
                    ? 'bg-white text-[#1d6e5c] shadow-xs'
                    : 'text-[#57534e] hover:text-[#1c1917]'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                Student
              </button>
              <button
                onClick={() => {
                  setUserRole('faculty');
                  navigate('/faculty');
                }}
                aria-pressed={userRole === 'faculty'}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  userRole === 'faculty'
                    ? 'bg-[#1d6e5c] text-white shadow-xs'
                    : 'text-[#57534e] hover:text-[#1c1917]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Faculty
              </button>
            </div>

            {/* User Account / Auth Button */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-semibold text-[#1c1917] flex items-center justify-end gap-1">
                    {currentUser.name}
                    <span className="text-[9px] font-mono uppercase bg-[#1d6e5c]/10 text-[#1d6e5c] font-bold px-1.5 py-0.2 rounded">
                      {currentUser.role}
                    </span>
                  </span>
                  <span className="text-[10px] text-[#78716c] truncate max-w-[120px]">{currentUser.email}</span>
                </div>
                <button
                  onClick={onLogout}
                  title="Sign Out"
                  aria-label="Sign Out"
                  className="p-1.5 rounded-lg border border-[#d6cfc4] bg-[#faf7f2] text-[#78716c] hover:text-rose-600 hover:border-rose-300 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1d6e5c] text-white text-xs font-semibold hover:bg-[#165849] transition-all shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
