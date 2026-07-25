import { Navbar } from "@/components/shared/navbar";
import { ClerkAuthCard } from "@/components/shared/clerk-auth-card";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col bg-bg text-text">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.10),transparent)]" />
        <div className="relative z-10 w-full max-w-md flex justify-center">
          <ClerkAuthCard mode="sign-in" />
        </div>
      </main>
    </div>
  );
}
