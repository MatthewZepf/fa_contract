import ChatDemo from "../components/chat-demo";

export default function Home() {
  return (
    <main>
      <div className="flex min-h-screen w-full">
        <div className="hidden flex-1 bg-foreground md:flex" />

        <div className="w-full max-w-5xl flex-grow bg-background">
          <div className="flex min-h-screen flex-col px-6 pt-10 pb-24 md:px-10">
            <div className="text-center text-primary">
              <div className="font-display text-5xl md:text-6xl lg:text-7xl">
                Know Your FA Contract
              </div>
              <a
                href="/AFA%20United%20Tentative%20Agreement%202026-2031.pdf"
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-lg text-grain underline underline-offset-4 transition-colors hover:text-primary md:text-2xl"
              >
                AFA United Tentative Agreement 2026-2031
              </a>
            </div>

            <section className="mt-auto pt-10">
              <ChatDemo />
            </section>
          </div>
        </div>

        <div className="hidden flex-1 bg-foreground md:flex" />
      </div>
    </main>
  )
}
