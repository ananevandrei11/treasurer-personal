export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="flex min-h-dvh items-center justify-center px-4 py-16"
      style={{
        background:
          'radial-gradient(ellipse 70% 50% at 15% 0%, oklch(0.85 0.08 80 / 0.5) 0%, transparent 60%), radial-gradient(ellipse 60% 45% at 85% 100%, oklch(0.82 0.08 155 / 0.3) 0%, transparent 60%), var(--background)',
      }}
    >
      {children}
    </main>
  )
}
