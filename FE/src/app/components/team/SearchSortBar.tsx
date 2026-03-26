import { motion } from 'motion/react';
import { Search, ArrowUpDown } from 'lucide-react';

export type SortOption = 'level-desc' | 'level-asc' | 'rank-desc' | 'rank-asc' | 'team';

interface SearchSortBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'level-desc', label: 'Level ↓' },
  { value: 'level-asc',  label: 'Level ↑' },
  { value: 'rank-desc',  label: 'Rank ↓' },
  { value: 'rank-asc',   label: 'Rank ↑' },
  { value: 'team',       label: 'Team' },
];

export function SearchSortBar({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
}: SearchSortBarProps) {
  return (
    <div className="flex items-center gap-3 max-w-3xl mx-auto">
      {/* Search input */}
      <div className="flex-1 relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Search size={14} style={{ color: '#475569' }} />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search operatives by name, role, or team..."
          className="w-full pl-10 pr-4 py-2.5 rounded-sm outline-none transition-all duration-300"
          style={{
            background: '#0F172A',
            border: '1px solid #1F2937',
            color: '#E2E8F0',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            letterSpacing: '0.04em',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#3B82F6';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#1F2937';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
        {searchQuery && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full transition-colors"
            style={{
              background: '#1F2937',
              color: '#64748B',
            }}
            onClick={() => onSearchChange('')}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#3B82F6';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#1F2937';
              e.currentTarget.style.color = '#64748B';
            }}
          >
            <span style={{ fontSize: 10, lineHeight: 1 }}>✕</span>
          </motion.button>
        )}
      </div>

      {/* Sort dropdown */}
      <div className="relative flex items-center gap-2">
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded-sm"
          style={{
            background: '#0F172A',
            border: '1px solid #1F2937',
          }}
        >
          <ArrowUpDown size={12} style={{ color: '#475569' }} />
          <span
            style={{
              color: '#64748B',
              fontSize: 10,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.08em',
            }}
          >
            SORT:
          </span>
        </div>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="px-3 py-2.5 rounded-sm outline-none cursor-pointer transition-all duration-300"
          style={{
            background: '#0F172A',
            border: '1px solid #1F2937',
            color: '#3B82F6',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            letterSpacing: '0.08em',
            fontWeight: 600,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#3B82F6';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#1F2937';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
