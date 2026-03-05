import Link from 'next/link'

const LINKS = [
  { href: '/studio', label: 'Studio' },
  { href: '/store', label: 'Store' },
  { href: '/community', label: 'Community' },
]

export const Footer = () => {
  return (
    <footer className="mt-8 py-12 px-4">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-1">
          <img src="/kanojo.svg" alt="Kanojo Studio Logo" className="w-40 h-20" />
          <p className="text-sm text-muted-foreground">Your personal portrait studio</p>
        </div>

        <nav className="flex items-center gap-6">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Kanojo Studio
        </p>
      </div>
    </footer>
  )
}
