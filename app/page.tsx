import Link from "next/link"
import {
  Shield,
  Lock,
  Eye,
  Workflow,
  Sparkles,
  Globe,
  ArrowRight,
  Server,
  Database,
  Cloud,
  Zap,
  CheckCircle2,
  Menu,
  Users,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Workflow className="h-5 w-5 text-primary" />
            <span className="font-semibold">ArchFlow</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#privacy" className="transition-colors hover:text-foreground">
              Privacy
            </a>
            <a href="#how-it-works" className="transition-colors hover:text-foreground">
              How it Works
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/designer" className="hidden sm:block">
              <Button size="sm" className="gap-2">
                Open Designer
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[260px]">
                <nav className="flex flex-col gap-4 mt-8">
                  <a href="#features" className="text-lg font-medium">
                    Features
                  </a>
                  <a href="#privacy" className="text-lg font-medium">
                    Privacy
                  </a>
                  <a href="#how-it-works" className="text-lg font-medium">
                    How it Works
                  </a>
                  <Link href="/designer" className="mt-4">
                    <Button className="w-full gap-2">
                      Open Designer
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-16 md:pt-32 md:pb-20">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 h-64 w-64 md:h-96 md:w-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-64 w-64 md:h-96 md:w-96 rounded-full bg-primary/5 blur-3xl" />
        </div>
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 md:mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 md:px-4 md:py-1.5 text-xs md:text-sm text-muted-foreground">
              <Users className="h-3 w-3 md:h-3.5 md:w-3.5 text-primary" />
              <span className="hidden sm:inline">Real-time Collaboration —</span> Design together, anywhere
            </div>
            <h1 className="mb-4 md:mb-6 text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-6xl">
              Design System Architecture
              <span className="text-primary"> Together</span>
            </h1>
            <p className="mb-6 md:mb-8 text-base md:text-lg leading-relaxed text-muted-foreground text-pretty px-2">
              Build, visualize, and test your system architecture with an intuitive drag-and-drop interface. Collaborate
              in real-time, connect to APIs, and iterate fast.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link href="/designer" className="w-full sm:w-auto">
                <Button size="lg" className="gap-2 w-full sm:w-auto">
                  Start Designing
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#how-it-works" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                  See How It Works
                </Button>
              </a>
            </div>
          </div>

          {/* Preview Image */}
          <div className="mt-10 md:mt-16 overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border bg-muted/50 px-3 md:px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 md:h-3 md:w-3 rounded-full bg-red-500/70" />
                <div className="h-2.5 w-2.5 md:h-3 md:w-3 rounded-full bg-yellow-500/70" />
                <div className="h-2.5 w-2.5 md:h-3 md:w-3 rounded-full bg-green-500/70" />
                <span className="ml-2 text-[10px] md:text-xs text-muted-foreground">ArchFlow Designer</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="flex -space-x-1.5">
                  <div className="h-5 w-5 rounded-full border-2 border-background bg-emerald-500" />
                  <div className="h-5 w-5 rounded-full border-2 border-background bg-violet-500" />
                  <div className="h-5 w-5 rounded-full border-2 border-background bg-orange-500" />
                </div>
                <span className="ml-1.5 text-[10px] text-muted-foreground hidden sm:block">3 online</span>
              </div>
            </div>
            <div className="relative aspect-[16/10] md:aspect-video bg-background p-4 md:p-8">
              {/* Simulated architecture diagram */}
              <div className="flex h-full items-center justify-center">
                {/* Mobile: vertical layout */}
                <div className="flex md:hidden flex-col items-center gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-card">
                        <Globe className="h-6 w-6 text-blue-500" />
                      </div>
                      <span className="text-[10px] text-muted-foreground">Client</span>
                    </div>
                    <div className="h-0.5 w-8 bg-primary" />
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-card">
                        <Server className="h-6 w-6 text-emerald-500" />
                      </div>
                      <span className="text-[10px] text-muted-foreground">API</span>
                    </div>
                  </div>
                  <div className="w-0.5 h-4 bg-primary" />
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-card">
                        <Database className="h-6 w-6 text-orange-500" />
                      </div>
                      <span className="text-[10px] text-muted-foreground">DB</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-card">
                        <Cloud className="h-6 w-6 text-violet-500" />
                      </div>
                      <span className="text-[10px] text-muted-foreground">Cache</span>
                    </div>
                  </div>
                </div>

                {/* Desktop: horizontal layout */}
                <div className="hidden md:flex items-center gap-8">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-border bg-card">
                      <Globe className="h-8 w-8 text-blue-500" />
                    </div>
                    <span className="text-xs text-muted-foreground">Client</span>
                  </div>
                  <div className="h-0.5 w-16 bg-primary" />
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-border bg-card">
                      <Server className="h-8 w-8 text-emerald-500" />
                    </div>
                    <span className="text-xs text-muted-foreground">API Gateway</span>
                  </div>
                  <div className="h-0.5 w-16 bg-primary" />
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-border bg-card">
                        <Database className="h-8 w-8 text-orange-500" />
                      </div>
                      <span className="text-xs text-muted-foreground">Database</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-border bg-card">
                        <Cloud className="h-8 w-8 text-violet-500" />
                      </div>
                      <span className="text-xs text-muted-foreground">Cache</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <section id="privacy" className="border-t border-border bg-card/50 py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="mx-auto mb-10 md:mb-12 max-w-2xl text-center">
            <h2 className="mb-3 md:mb-4 text-2xl md:text-3xl font-bold">Privacy by Design</h2>
            <p className="text-sm md:text-base text-muted-foreground px-2">
              Your architecture diagrams and API configurations stay on your device. No accounts, no cloud storage, no
              tracking.
            </p>
          </div>
          <div className="grid gap-4 md:gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-5 md:p-6">
              <div className="mb-3 md:mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <Lock className="h-5 w-5 text-emerald-500" />
              </div>
              <h3 className="mb-2 font-semibold">Local-First Storage</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                All your diagrams are stored in your browser's local storage. Export to JSON anytime to back up or
                share.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 md:p-6">
              <div className="mb-3 md:mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <Eye className="h-5 w-5 text-emerald-500" />
              </div>
              <h3 className="mb-2 font-semibold">No Tracking</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Zero analytics, no cookies, no fingerprinting. We don't know who you are or what you build.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 md:p-6">
              <div className="mb-3 md:mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <Shield className="h-5 w-5 text-emerald-500" />
              </div>
              <h3 className="mb-2 font-semibold">Your API Keys Stay Safe</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                API configurations for testing flows are stored locally and requests are made directly from your
                browser.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Updated features to include collaboration and AI modes */}
      <section id="features" className="border-t border-border py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="mx-auto mb-10 md:mb-12 max-w-2xl text-center">
            <h2 className="mb-3 md:mb-4 text-2xl md:text-3xl font-bold">Everything You Need</h2>
            <p className="text-sm md:text-base text-muted-foreground">
              A complete toolkit for designing, testing, and iterating on your system architecture.
            </p>
          </div>
          <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Workflow,
                title: "Drag & Drop Builder",
                description:
                  "Intuitive interface with 25+ pre-built components for servers, databases, queues, and more.",
              },
              {
                icon: Users,
                title: "Real-time Collaboration",
                description:
                  "Work together with your team. See cursors, share rooms, and build architecture diagrams in real-time.",
              },
              {
                icon: Zap,
                title: "Flow Simulation",
                description:
                  "Test your architecture by running data through the flow. See how components interact in real-time.",
              },
              {
                icon: Globe,
                title: "Real API Integration",
                description:
                  "Connect nodes to real APIs. Make GET/POST requests and pass data between nodes using expressions.",
              },
              {
                icon: Sparkles,
                title: "AI Assistant (Create & Understand)",
                description:
                  "Two AI modes: Create architectures from descriptions or analyze existing diagrams for insights.",
              },
              {
                icon: MessageSquare,
                title: "Diagram Analysis",
                description:
                  "Ask AI to explain your architecture, find bottlenecks, suggest improvements, or perform security reviews.",
              },
              {
                icon: Database,
                title: "Data Expressions",
                description:
                  "Use {{$input}} expressions to pass data between nodes. Transform, filter, and route data dynamically.",
              },
              {
                icon: CheckCircle2,
                title: "Export & Share",
                description:
                  "Export your diagrams as PNG, SVG, or JSON. Import previously saved architectures to continue working.",
              },
              {
                icon: Lock,
                title: "Privacy First",
                description:
                  "All data stays in your browser. No accounts, no tracking. Collaboration is peer-to-peer via Liveblocks.",
              },
            ].map((feature, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5 md:p-6">
                <div className="mb-3 md:mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section - Updated to include collaboration step */}
      <section id="how-it-works" className="border-t border-border bg-card/50 py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="mx-auto mb-10 md:mb-12 max-w-2xl text-center">
            <h2 className="mb-3 md:mb-4 text-2xl md:text-3xl font-bold">How It Works</h2>
            <p className="text-sm md:text-base text-muted-foreground">
              Design and test your architecture in four simple steps.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: "01",
                title: "Drag & Drop Components",
                description:
                  "Choose from servers, databases, APIs, queues, and more. Arrange them on the canvas and connect with arrows.",
              },
              {
                step: "02",
                title: "Collaborate in Real-time",
                description:
                  "Create a room and share the link. Team members can join and edit together with live cursors.",
              },
              {
                step: "03",
                title: "Configure API Calls",
                description:
                  "Enable API integration on any node. Set endpoints, headers, and use expressions like {{$input}}.",
              },
              {
                step: "04",
                title: "Simulate & Test",
                description:
                  "Add dummy data and run the simulation. Watch data flow through your architecture in real-time.",
              },
            ].map((item, i) => (
              <div key={i} className="relative">
                <span className="mb-3 md:mb-4 block text-4xl md:text-5xl font-bold text-primary/20">{item.step}</span>
                <h3 className="mb-2 font-semibold">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="rounded-2xl border border-border bg-card p-8 md:p-12 text-center">
            <h2 className="mb-3 md:mb-4 text-2xl md:text-3xl font-bold">Ready to Design?</h2>
            <p className="mb-6 md:mb-8 text-sm md:text-base text-muted-foreground">
              Start building your architecture diagrams now. No sign-up required.
            </p>
            <Link href="/designer">
              <Button size="lg" className="gap-2">
                Open Designer
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 md:py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 md:gap-4 px-4 md:px-6 text-xs md:text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            <span>ArchFlow</span>
          </div>
          <p className="text-center">Privacy-first architecture design tool. No data collection.</p>
        </div>
      </footer>
    </div>
  )
}
