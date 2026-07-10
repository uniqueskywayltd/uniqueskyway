import { render } from "@react-email/components";
import { notFound } from "next/navigation";
import { emailPreviewRegistry } from "@/emails/preview-registry";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EmailPreviewSinglePage({ params }: Props) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const { id } = await params;
  const entry = emailPreviewRegistry.find((e) => e.id === id);
  if (!entry) notFound();

  const html = await render(entry.element);

  return (
    <div
      className="min-h-screen bg-slate-950"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
