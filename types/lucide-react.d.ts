declare module 'lucide-react' {
  import * as React from 'react';

  // Commonly used icon components (add more if needed)
  export type LucideProps = any;
  export type Icon = React.ComponentType<any>;

  export const Copy: React.ComponentType<any>;
  export const Palette: React.ComponentType<any>;
  export const RefreshCw: React.ComponentType<any>;
  export const Plus: React.ComponentType<any>;
  export const X: React.ComponentType<any>;
  export const Send: React.ComponentType<any>;
  export const User: React.ComponentType<any>;
  export const HelpCircle: React.ComponentType<any>;
  export const Edit: React.ComponentType<any>;
  export const Laptop: React.ComponentType<any>;
  export const Twitter: React.ComponentType<any>;
  export const Key: React.ComponentType<any>;
  export const Check: React.ComponentType<any>;
  export const ChevronDown: React.ComponentType<any>;

  const icons: { [key: string]: React.ComponentType<any> };
  export default icons;
}
