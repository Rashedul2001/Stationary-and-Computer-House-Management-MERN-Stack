import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { FaMoon, FaSun } from 'react-icons/fa';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="h-9 w-9 shrink-0"
    >
      {theme === 'dark' ? <FaSun className="h-4 w-4 text-[var(--status-warning)]" /> : <FaMoon className="h-4 w-4" />}
    </Button>
  );
}
