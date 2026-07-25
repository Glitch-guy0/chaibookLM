import { SignUp } from "@clerk/nextjs";
import { Navbar } from "@/components/shared/navbar";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(212,175,55,0.15),rgba(255,255,255,0))]" />
        <div className="relative z-10 w-full max-w-md flex justify-center">
          <SignUp
            appearance={{
              elements: {
                card: "glass shadow-2xl rounded-2xl border border-border/40 p-8",
                headerTitle: "font-display text-display-md text-text",
                headerSubtitle: "text-body-sm text-text-muted",
                formButtonPrimary:
                  "bg-primary text-text hover:brightness-110 font-medium rounded-lg transition-all duration-fast shadow-glow",
                formFieldInput:
                  "bg-surface border border-border text-text rounded-lg focus:border-primary",
                footerActionLink: "text-primary hover:underline",
              },
            }}
          />
        </div>
      </main>
    </div>
  );
}
