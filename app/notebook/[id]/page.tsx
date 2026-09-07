import { redirect } from 'next/navigation';

export default async function NotebookRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/notebook/${id}`);
}
