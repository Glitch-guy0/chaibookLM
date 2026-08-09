import { SignIn } from '@clerk/nextjs';
import { AuthProvider } from '@components/auth-provider';

/**
 * Sign-in page with Clerk auth wrapped in AuthProvider.
 */
export default function SignInPage() {
  return (
    <AuthProvider>
      <div className="flex min-h-screen items-center justify-center bg-surface dark:bg-surface-dark px-4">
        <div data-debug="SignInPage" className="w-full max-w-md">
          <SignIn
            appearance={{
              elements: {
                card: 'bg-surface-elevated dark:bg-surface-elevated-dark border-2 border-border dark:border-border-dark shadow-dialog dark:shadow-dialog-dark rounded-default p-8',
                headerTitle: 'font-display text-2xl text-ink dark:text-ink-dark',
                headerSubtitle: 'text-ink-secondary dark:text-ink-secondary-dark text-sm',
                socialButtonsBlockButton: 'bg-surface-elevated dark:bg-surface-elevated-dark border-2 border-border dark:border-border-dark text-ink dark:text-ink-dark rounded-default hover:bg-surface dark:hover:bg-surface-dark',
                formButtonPrimary: 'bg-brand dark:bg-brand-dark text-ink dark:text-ink-dark border-2 border-border dark:border-border-dark rounded-default font-sans transform hover:scale-[1.02] active:scale-[0.98]',
                formFieldInput: 'bg-surface dark:bg-surface-dark border-2 border-border dark:border-border-dark text-ink dark:text-ink-dark rounded-default px-3 py-2 font-sans',
                formFieldLabel: 'text-ink dark:text-ink-dark text-sm font-sans',
                footerActionText: 'text-ink-secondary dark:text-ink-secondary-dark text-sm',
                footerActionLink: 'text-cite dark:text-cite-dark text-sm',
                dividerLine: 'bg-border dark:bg-border-dark',
                dividerText: 'text-ink-muted dark:text-ink-muted-dark text-xs',
              },
            }}
          />
        </div>
      </div>
    </AuthProvider>
  );
}