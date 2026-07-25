export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout does NOT render the marketing Navbar.
  // The workspace header is rendered per-page (notebook/[notebookId]/page.tsx)
  // so it can receive the notebookTitle prop.
  return <>{children}</>;
}
