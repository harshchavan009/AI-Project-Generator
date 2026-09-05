import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { IdeaDiscoveryPage } from './pages/IdeaDiscoveryPage';
import { StudentProfilePage } from './pages/StudentProfilePage';
import { ProjectStudioPage } from './pages/ProjectStudioPage';
import { FacultyConsolePage } from './pages/FacultyConsolePage';
import { MentorPanel } from './components/MentorPanel';
import { AuthModal } from './components/AuthModal';
import { OnboardingTourModal } from './components/OnboardingTourModal';
import { StudentProfile, ProjectIdea } from './types';
import { ApiService, UserAccount } from './services/api';
import { Sparkles, Compass, AlertCircle, WifiOff } from 'lucide-react';

const DEMO_PRESETS: Record<string, StudentProfile> = {
  priya: {
    id: "std-priya-01",
    name: "Priya Sharma",
    email: "priya.sharma@eng.univ.edu",
    branch: "Computer Science & AI",
    team_size: 2,
    timeframe_weeks: 16,
    hardware_constraint: "CPU-only",
    interest_domains: ["Healthcare & Biomedical AI", "Edge AI & TinyML / IoT"],
    skills: {
      python: 4,
      pytorch: 3,
      onnx_runtime: 3,
      fastapi: 2,
      opencv: 2,
      sql: 2
    }
  },
  rohan: {
    id: "std-rohan-02",
    name: "Rohan Deshmukh",
    email: "rohan.d@eng.univ.edu",
    branch: "Electronics & IoT Engineering",
    team_size: 2,
    timeframe_weeks: 14,
    hardware_constraint: "IoT hardware",
    interest_domains: ["Edge AI & TinyML / IoT", "Green Tech & Renewable Smart Grids"],
    skills: {
      embedded_c: 4,
      esp32: 4,
      tinyml: 3,
      sensors_protocols: 3,
      mqtt: 3,
      python: 2
    }
  },
  ananya: {
    id: "std-ananya-03",
    name: "Ananya Iyer",
    email: "ananya.iyer@eng.univ.edu",
    branch: "Cybersecurity & Systems",
    team_size: 1,
    timeframe_weeks: 16,
    hardware_constraint: "CPU-only",
    interest_domains: ["Cybersecurity & Threat Intelligence", "Distributed Systems & Cloud Infrastructure"],
    skills: {
      golang: 3,
      linux_admin: 4,
      docker: 3,
      python: 3,
      bash: 3
    }
  },
  vikram: {
    id: "std-vikram-04",
    name: "Vikram Malhotra",
    email: "vikram.m@eng.univ.edu",
    branch: "Computer Science & FinTech",
    team_size: 3,
    timeframe_weeks: 16,
    hardware_constraint: "CPU-only",
    interest_domains: ["FinTech & Fraud Analytics", "NLP & Knowledge Graphs"],
    skills: {
      python: 4,
      pytorch: 3,
      postgresql: 3,
      timescaledb: 2,
      sql: 3,
      scikit_learn: 3
    }
  }
};

export const App: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<string>('/');
  const [userRole, setUserRole] = useState<'student' | 'faculty'>('student');
  const [activeProfile, setActiveProfile] = useState<StudentProfile>(DEMO_PRESETS.priya);
  const [ideas, setIdeas] = useState<ProjectIdea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<ProjectIdea | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Auth & Onboarding Tour states
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(ApiService.getStoredUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isOnboardingTourOpen, setIsOnboardingTourOpen] = useState<boolean>(false);

  // Initialize auth & tour check
  useEffect(() => {
    ApiService.getCurrentUser().then((user) => {
      if (user) {
        setCurrentUser(user);
        if (user.role === 'faculty' || user.role === 'admin') {
          setUserRole('faculty');
        }
      }
    });

    const hasSeenTour = localStorage.getItem('capstoneforge_has_seen_tour');
    if (!hasSeenTour) {
      setIsOnboardingTourOpen(true);
    }
  }, []);

  // Sync with window.location.hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        setCurrentRoute(hash);
        if (hash.startsWith('/faculty')) {
          setUserRole('faculty');
        } else {
          setUserRole('student');
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (path: string) => {
    setCurrentRoute(path);
    window.location.hash = path;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fetch matched ideas whenever active profile changes
  const fetchIdeasForProfile = async (prof: StudentProfile) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const matched = await ApiService.matchIdeas(prof.id, prof);
      setIdeas(matched);
      if (matched.length > 0 && !selectedIdea) {
        setSelectedIdea(matched[0]);
      }
    } catch (err: any) {
      console.error('Failed to match ideas:', err);
      setApiError('Unable to connect to matching backend engine. Verify server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeasForProfile(activeProfile);
  }, [activeProfile]);

  const handleLoadPreset = async (presetId: string) => {
    const preset = DEMO_PRESETS[presetId];
    if (preset) {
      setActiveProfile(preset);
      setSelectedIdea(null);
      navigate('/');
    }
  };

  const handleAdoptProject = (idea: ProjectIdea) => {
    setSelectedIdea(idea);
    navigate('/project');
  };

  const handleAuthSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    if (user.role === 'faculty' || user.role === 'admin') {
      setUserRole('faculty');
      navigate('/faculty');
    } else {
      setUserRole('student');
      // Update profile with user info
      setActiveProfile((prev) => ({
        ...prev,
        name: user.name,
        email: user.email,
        branch: user.department
      }));
      navigate('/');
    }
  };

  const handleLogout = () => {
    ApiService.logout();
    setCurrentUser(null);
    setUserRole('student');
    setActiveProfile(DEMO_PRESETS.priya);
    navigate('/');
  };

  const renderCurrentView = () => {
    if (userRole === 'faculty' || currentRoute.startsWith('/faculty')) {
      return <FacultyConsolePage />;
    }

    if (currentRoute === '/profile') {
      return (
        <StudentProfilePage
          activeProfile={activeProfile}
          onProfileUpdated={(updated) => {
            setActiveProfile(updated);
            fetchIdeasForProfile(updated);
          }}
          navigate={navigate}
        />
      );
    }

    if (currentRoute === '/project') {
      return (
        <ProjectStudioPage
          idea={selectedIdea}
          profile={activeProfile}
          navigate={navigate}
        />
      );
    }

    if (currentRoute === '/mentor') {
      return (
        <div className="max-w-6xl mx-auto px-4 py-8">
          <MentorPanel
            activeIdea={selectedIdea}
            activeProfile={activeProfile}
          />
        </div>
      );
    }

    // Default view: Idea Discovery (Graph)
    return (
      <IdeaDiscoveryPage
        ideas={ideas}
        selectedIdea={selectedIdea}
        onSelectIdea={(idea) => setSelectedIdea(idea)}
        onAdoptProject={handleAdoptProject}
        navigate={navigate}
        activeProfile={activeProfile}
      />
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f1e8] text-[#1c1917] selection:bg-[#1d6e5c]/20 selection:text-[#1d6e5c]">
      
      {/* Institutional Navigation Header */}
      <Navbar
        currentRoute={currentRoute}
        navigate={navigate}
        userRole={userRole}
        setUserRole={setUserRole}
        activeProfile={activeProfile}
        onLoadPreset={handleLoadPreset}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenTourModal={() => setIsOnboardingTourOpen(true)}
        onLogout={handleLogout}
      />

      {/* Global API Connectivity Alert Banner */}
      {apiError && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-800 flex items-center justify-between no-print" role="alert">
          <div className="max-w-7xl mx-auto w-full flex items-center gap-2">
            <WifiOff className="w-4 h-4 shrink-0 text-amber-600" />
            <span className="font-medium">{apiError}</span>
            <button
              onClick={() => fetchIdeasForProfile(activeProfile)}
              className="ml-auto underline font-semibold text-amber-900 hover:text-amber-950 text-xs"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* Loading Skeleton Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#f5f1e8]/80 backdrop-blur-xs animate-in fade-in" aria-live="polite" aria-busy="true">
          <div className="academic-card p-6 max-w-sm w-full text-center space-y-3 shadow-xl">
            <div className="w-10 h-10 border-4 border-[#d6cfc4] border-t-[#1d6e5c] rounded-full animate-spin mx-auto" />
            <div>
              <h3 className="font-serif-heading font-bold text-base text-[#1c1917]">
                Evaluating Vector Matches
              </h3>
              <p className="text-xs font-mono text-[#78716c] mt-1">
                FastEmbed CPU ONNX & NetworkX Graph Traversal...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1" id="main-content" tabIndex={-1}>
        {renderCurrentView()}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* First-Run Onboarding Tour Modal */}
      <OnboardingTourModal
        isOpen={isOnboardingTourOpen}
        onClose={() => setIsOnboardingTourOpen(false)}
        onNavigate={navigate}
      />

      {/* Institutional Academic Footer */}
      <footer className="border-t border-[#e7e2d8] bg-[#faf7f2] py-6 px-4 sm:px-6 lg:px-8 mt-auto no-print" role="contentinfo">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#78716c]">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#1d6e5c]"></span>
            <span className="text-[#1c1917] font-bold font-serif-heading">CapstoneForge</span>
            <span>— AI Engineering Capstone Generator & Faculty Oversight Console</span>
          </div>

          <div className="flex items-center space-x-4">
            <span>FastAPI Backend 🟢 Active</span>
            <span>•</span>
            <span>FastEmbed ONNX INT8</span>
            <span>•</span>
            <span>PostgreSQL & Alembic</span>
            <span>•</span>
            <span>JWT RBAC Protected</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default App;
