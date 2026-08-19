import React from 'react';
import { UserProfile } from '../types';

export type NavTab = 'home' | 'people' | 'capture' | 'moments' | 'more' | 'ideas' | 'followups' | 'recap' | 'export';

interface NavigationProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  profile: UserProfile;
  onOpenSearch: () => void;
  onOpenQuickConnect: () => void;
  overdueCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  profile,
  onOpenSearch,
  overdueCount,
}) => {
  return (
    <>
      {/* Mobile Top App Bar */}
      <header className="md:hidden bg-[#0A0A0A] border-b border-white/10 flex justify-between items-center w-full px-5 h-16 fixed top-0 left-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSearch}
            aria-label="Search"
            className="text-[#ffb59a] hover:text-[#FF5C00] transition-colors p-1 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-2xl">search</span>
          </button>
          <span
            onClick={() => onSelectTab('home')}
            className="font-serif-display text-2xl font-bold text-[#ffb59a] tracking-tight cursor-pointer"
          >
            Momentum
          </span>
        </div>

        <button
          onClick={() => onSelectTab('recap')}
          className="w-8 h-8 rounded-full bg-[#1A1A1A] border border-white/10 overflow-hidden flex-shrink-0 focus:outline-none focus:ring-1 focus:ring-[#FF5C00]"
          title="View Event Profile & Recap"
        >
          <img
            alt={profile.name}
            className="w-full h-full object-cover"
            src={profile.avatarUrl}
          />
        </button>
      </header>

      {/* Mobile Bottom Nav Bar */}
      <nav className="md:hidden bg-[#0A0A0A] border-t border-white/10 fixed bottom-0 left-0 w-full z-40 flex justify-around items-center h-20 pb-safe px-2">
        <button
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center justify-center transition-colors active:scale-95 duration-150 w-16 ${
            currentTab === 'home' ? 'text-[#ffb59a]' : 'text-[#e4beb1]/70 hover:text-[#ffb59a]'
          }`}
        >
          <span
            className={`material-symbols-outlined text-2xl ${
              currentTab === 'home' ? 'fill-1' : ''
            }`}
          >
            home
          </span>
          <span className="text-[11px] font-medium mt-1">Home</span>
        </button>

        <button
          onClick={() => onSelectTab('people')}
          className={`flex flex-col items-center justify-center transition-colors active:scale-95 duration-150 w-16 relative ${
            currentTab === 'people' || currentTab === 'followups'
              ? 'text-[#ffb59a]'
              : 'text-[#e4beb1]/70 hover:text-[#ffb59a]'
          }`}
        >
          <span
            className={`material-symbols-outlined text-2xl ${
              currentTab === 'people' ? 'fill-1' : ''
            }`}
          >
            group
          </span>
          <span className="text-[11px] font-medium mt-1">People</span>
          {overdueCount > 0 && (
            <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-[#FF5C00] animate-pulse"></span>
          )}
        </button>

        <button
          onClick={() => onSelectTab('capture')}
          className={`flex flex-col items-center justify-center transition-colors active:scale-95 duration-150 w-16 ${
            currentTab === 'capture' ? 'text-[#ffb59a]' : 'text-[#e4beb1]/70 hover:text-[#ffb59a]'
          }`}
        >
          <span
            className={`material-symbols-outlined text-2xl ${
              currentTab === 'capture' ? 'fill-1' : ''
            }`}
          >
            add_a_photo
          </span>
          <span className="text-[11px] font-medium mt-1">Capture</span>
        </button>

        <button
          onClick={() => onSelectTab('moments')}
          className={`flex flex-col items-center justify-center transition-colors active:scale-95 duration-150 w-16 ${
            currentTab === 'moments' ? 'text-[#ffb59a]' : 'text-[#e4beb1]/70 hover:text-[#ffb59a]'
          }`}
        >
          <span
            className={`material-symbols-outlined text-2xl ${
              currentTab === 'moments' ? 'fill-1' : ''
            }`}
          >
            auto_awesome
          </span>
          <span className="text-[11px] font-medium mt-1">Moments</span>
        </button>

        <button
          onClick={() => onSelectTab('more')}
          className={`flex flex-col items-center justify-center transition-colors active:scale-95 duration-150 w-16 ${
            currentTab === 'more' || currentTab === 'ideas' || currentTab === 'recap' || currentTab === 'export'
              ? 'text-[#ffb59a]'
              : 'text-[#e4beb1]/70 hover:text-[#ffb59a]'
          }`}
        >
          <span
            className={`material-symbols-outlined text-2xl ${
              currentTab === 'more' || currentTab === 'ideas' || currentTab === 'recap' || currentTab === 'export'
                ? 'fill-1'
                : ''
            }`}
          >
            more_horiz
          </span>
          <span className="text-[11px] font-medium mt-1">More</span>
        </button>
      </nav>

      {/* Desktop Navigation Drawer */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 bg-[#140b07] border-r border-white/10 p-6 z-40">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1
              onClick={() => onSelectTab('home')}
              className="font-serif-display text-3xl font-bold text-[#ffb59a] tracking-tight cursor-pointer"
            >
              Momentum
            </h1>
            <p className="text-xs text-[#e4beb1]/60 tracking-wider uppercase mt-1">TEDxAkure 2026</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2 flex-grow">
          <button
            onClick={() => onSelectTab('home')}
            className={`flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-semibold transition-all text-left ${
              currentTab === 'home'
                ? 'bg-[#FF5C00] text-black font-bold shadow-lg'
                : 'text-[#e4beb1] hover:text-white hover:bg-[#2c1c16]'
            }`}
          >
            <span className={`material-symbols-outlined ${currentTab === 'home' ? 'fill-1' : ''}`}>
              home
            </span>
            <span>Home</span>
          </button>

          <button
            onClick={() => onSelectTab('people')}
            className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-semibold transition-all text-left ${
              currentTab === 'people'
                ? 'bg-[#FF5C00] text-black font-bold shadow-lg'
                : 'text-[#e4beb1] hover:text-white hover:bg-[#2c1c16]'
            }`}
          >
            <div className="flex items-center gap-4">
              <span className={`material-symbols-outlined ${currentTab === 'people' ? 'fill-1' : ''}`}>
                group
              </span>
              <span>People & CRM</span>
            </div>
            {overdueCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#370e00] text-[#ffb59a] border border-[#FF5C00]/40 font-bold">
                {overdueCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('capture')}
            className={`flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-semibold transition-all text-left ${
              currentTab === 'capture'
                ? 'bg-[#FF5C00] text-black font-bold shadow-lg'
                : 'text-[#e4beb1] hover:text-white hover:bg-[#2c1c16]'
            }`}
          >
            <span className={`material-symbols-outlined ${currentTab === 'capture' ? 'fill-1' : ''}`}>
              add_a_photo
            </span>
            <span>Capture Hub</span>
          </button>

          <button
            onClick={() => onSelectTab('moments')}
            className={`flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-semibold transition-all text-left ${
              currentTab === 'moments'
                ? 'bg-[#FF5C00] text-black font-bold shadow-lg'
                : 'text-[#e4beb1] hover:text-white hover:bg-[#2c1c16]'
            }`}
          >
            <span className={`material-symbols-outlined ${currentTab === 'moments' ? 'fill-1' : ''}`}>
              auto_awesome
            </span>
            <span>Moments Timeline</span>
          </button>

          <button
            onClick={() => onSelectTab('ideas')}
            className={`flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-semibold transition-all text-left ${
              currentTab === 'ideas'
                ? 'bg-[#FF5C00] text-black font-bold shadow-lg'
                : 'text-[#e4beb1] hover:text-white hover:bg-[#2c1c16]'
            }`}
          >
            <span className={`material-symbols-outlined ${currentTab === 'ideas' ? 'fill-1' : ''}`}>
              lightbulb
            </span>
            <span>Talk Insights</span>
          </button>

          <button
            onClick={() => onSelectTab('followups')}
            className={`flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-semibold transition-all text-left ${
              currentTab === 'followups'
                ? 'bg-[#FF5C00] text-black font-bold shadow-lg'
                : 'text-[#e4beb1] hover:text-white hover:bg-[#2c1c16]'
            }`}
          >
            <span className={`material-symbols-outlined ${currentTab === 'followups' ? 'fill-1' : ''}`}>
              schedule
            </span>
            <span>Follow-ups Tracker</span>
          </button>

          <button
            onClick={() => onSelectTab('recap')}
            className={`flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-semibold transition-all text-left ${
              currentTab === 'recap'
                ? 'bg-[#FF5C00] text-black font-bold shadow-lg'
                : 'text-[#e4beb1] hover:text-white hover:bg-[#2c1c16]'
            }`}
          >
            <span className={`material-symbols-outlined ${currentTab === 'recap' ? 'fill-1' : ''}`}>
              local_fire_department
            </span>
            <span>Milestones & Recap</span>
          </button>

          <button
            onClick={() => onSelectTab('export')}
            className={`flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-semibold transition-all text-left ${
              currentTab === 'export'
                ? 'bg-[#FF5C00] text-black font-bold shadow-lg'
                : 'text-[#e4beb1] hover:text-white hover:bg-[#2c1c16]'
            }`}
          >
            <span className={`material-symbols-outlined ${currentTab === 'export' ? 'fill-1' : ''}`}>
              ios_share
            </span>
            <span>Export & PDF</span>
          </button>
        </nav>

        {/* User Badge Profile info */}
        <div className="pt-4 border-t border-white/10 mt-auto">
          <div
            onClick={() => onSelectTab('recap')}
            className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-[#1A1A1A]">
              <img
                alt={profile.name}
                className="w-full h-full object-cover"
                src={profile.avatarUrl}
              />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-[#fadcd2] truncate">{profile.name}</p>
              <p className="text-xs text-[#e4beb1]/60 truncate">{profile.title}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
