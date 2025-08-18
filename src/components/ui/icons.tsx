'use client';

import {
  Menu,
  Database,
  FileText,
  BookOpen,
  Terminal,
  Play,
  Sun,
  Moon,
  HelpCircle,
  X,
  Zap,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Clock,
  History,
  Maximize2,
  Minimize2,
  Settings,
  GitBranch,
  Share,
  Download,
  Upload,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
} from 'lucide-react';

// Icon component with consistent sizing and styling
interface IconProps {
  size?: number | string;
  className?: string;
}

export const Icons = {
  // Navigation
  menu: (props: IconProps) => <Menu size={props.size || 16} className={props.className} />,
  database: (props: IconProps) => <Database size={props.size || 16} className={props.className} />,
  schema: (props: IconProps) => <FileText size={props.size || 16} className={props.className} />,
  guides: (props: IconProps) => <BookOpen size={props.size || 16} className={props.className} />,
  query: (props: IconProps) => <Terminal size={props.size || 16} className={props.className} />,
  
  // Actions
  play: (props: IconProps) => <Play size={props.size || 16} className={props.className} />,
  close: (props: IconProps) => <X size={props.size || 16} className={props.className} />,
  settings: (props: IconProps) => <Settings size={props.size || 16} className={props.className} />,
  
  // Theme
  sun: (props: IconProps) => <Sun size={props.size || 16} className={props.className} />,
  moon: (props: IconProps) => <Moon size={props.size || 16} className={props.className} />,
  
  // Status
  success: (props: IconProps) => <CheckCircle size={props.size || 16} className={props.className} />,
  warning: (props: IconProps) => <AlertCircle size={props.size || 16} className={props.className} />,
  error: (props: IconProps) => <AlertCircle size={props.size || 16} className={props.className} />,
  loading: (props: IconProps) => <Clock size={props.size || 16} className={props.className} />,
  
  // Interface
  help: (props: IconProps) => <HelpCircle size={props.size || 16} className={props.className} />,
  history: (props: IconProps) => <History size={props.size || 16} className={props.className} />,
  expand: (props: IconProps) => <Maximize2 size={props.size || 16} className={props.className} />,
  collapse: (props: IconProps) => <Minimize2 size={props.size || 16} className={props.className} />,
  chevronDown: (props: IconProps) => <ChevronDown size={props.size || 16} className={props.className} />,
  chevronRight: (props: IconProps) => <ChevronRight size={props.size || 16} className={props.className} />,
  
  // Features
  ai: (props: IconProps) => <Zap size={props.size || 16} className={props.className} />,
  zap: (props: IconProps) => <Zap size={props.size || 16} className={props.className} />,
  branch: (props: IconProps) => <GitBranch size={props.size || 16} className={props.className} />,
  share: (props: IconProps) => <Share size={props.size || 16} className={props.className} />,
  download: (props: IconProps) => <Download size={props.size || 16} className={props.className} />,
  upload: (props: IconProps) => <Upload size={props.size || 16} className={props.className} />,
  search: (props: IconProps) => <Search size={props.size || 16} className={props.className} />,
  filter: (props: IconProps) => <Filter size={props.size || 16} className={props.className} />,
  more: (props: IconProps) => <MoreHorizontal size={props.size || 16} className={props.className} />,
  show: (props: IconProps) => <Eye size={props.size || 16} className={props.className} />,
  hide: (props: IconProps) => <EyeOff size={props.size || 16} className={props.className} />,
  copy: (props: IconProps) => <Copy size={props.size || 16} className={props.className} />,
  external: (props: IconProps) => <ExternalLink size={props.size || 16} className={props.className} />,
};

export type IconName = keyof typeof Icons;