import React from 'react';
import {
  LayoutDashboard,
  BarChart3,
  Sparkles,
  Cloud,
  Github,
  LayoutGrid,
  Database,
  Terminal,
  Globe,
  Activity,
  Server,
  LineChart,
  ExternalLink,
  Laptop
} from 'lucide-react';

interface AppIconProps {
  name?: string;
  className?: string;
}

export const AppIcon: React.FC<AppIconProps> = ({ name, className = 'w-5 h-5' }) => {
  switch (name) {
    case 'BarChart3':
      return <BarChart3 className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'Cloud':
      return <Cloud className={className} />;
    case 'Github':
      return <Github className={className} />;
    case 'LayoutGrid':
      return <LayoutGrid className={className} />;
    case 'Database':
      return <Database className={className} />;
    case 'Terminal':
      return <Terminal className={className} />;
    case 'Globe':
      return <Globe className={className} />;
    case 'Activity':
      return <Activity className={className} />;
    case 'Server':
      return <Server className={className} />;
    case 'LineChart':
      return <LineChart className={className} />;
    case 'Laptop':
      return <Laptop className={className} />;
    case 'LayoutDashboard':
    default:
      return <LayoutDashboard className={className} />;
  }
};
