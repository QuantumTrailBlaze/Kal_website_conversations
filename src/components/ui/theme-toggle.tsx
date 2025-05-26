import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/hooks/use-theme"
import { Button } from "@/components/ui/button"
import { Toggle } from "@/components/ui/toggle"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  
  return (
    <Toggle
      variant="outline"
      size="sm"
      pressed={theme === "dark"}
      onPressedChange={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle dark mode"
    >
      {theme === "dark" ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </Toggle>
  )
}
