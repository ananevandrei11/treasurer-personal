export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="flex min-h-dvh items-center justify-center px-4 py-16"
      style={{
        background:
          'radial-gradient(ellipse 80% 50% at 10% 0%, oklch(0.72 0.15 280 / 0.25) 0%, transparent 65%), radial-gradient(ellipse 60% 50% at 90% 100%, oklch(0.72 0.15 280 / 0.2) 0%, transparent 65%), var(--background)',
      }}
    >
      {children}
    </main>
  )
}
