import { Heart } from "lucide-react"

export function Footer() {
  return (
    <footer className="py-6 border-t border-border/40">
      <div className="container flex flex-col items-center justify-center gap-2 md:flex-row">
        <p className="text-center text-sm text-muted-foreground">
          Made with <Heart className="inline-block h-4 w-4 text-primary" /> by{" "}
          <span className="font-semibold text-primary">CodeCrafters.AI</span>
        </p>
        <p className="text-center text-xs text-muted-foreground">© {new Date().getFullYear()} All rights reserved.</p>
      </div>
    </footer>
  )
}

