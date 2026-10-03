import React from "react";
import {
  Home,
  ShoppingBag,
  Layers,
  CircleDollarSign,
  Users,
  Truck,
  HelpCircle,
  BarChart3,
  FileSpreadsheet,
  Settings,
  Shield,
  Package,
  Sparkles,
  Sliders,
  ChevronRight,
  Menu,
  Search,
  Check,
  AlertCircle,
  Lock,
  ArrowUpRight,
  Plus,
  Filter,
  Compass,
  LucideProps,
} from "lucide-react";

interface NavIconProps extends LucideProps {
  name: string;
}

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  Home,
  ShoppingBag,
  Layers,
  CircleDollarSign,
  Users,
  Truck,
  HelpCircle,
  BarChart3,
  FileSpreadsheet,
  Settings,
  Shield,
  Package,
  Sparkles,
  Sliders,
  ChevronRight,
  Menu,
  Search,
  Check,
  AlertCircle,
  Lock,
  ArrowUpRight,
  Plus,
  Filter,
  Compass,
};

export function NavIcon({ name, ...props }: NavIconProps) {
  const IconComponent = ICON_MAP[name] || Compass;
  return <IconComponent {...props} />;
}
