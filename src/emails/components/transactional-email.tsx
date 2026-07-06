import { Text } from "@react-email/components";
import { EmailLayout, text, brand } from "./layout";

export type DetailLine = {
  label: string;
  value: string;
};

type TransactionalEmailProps = {
  preview: string;
  heading: string;
  name: string;
  intro: string;
  details?: DetailLine[];
  footerNote?: string;
  cta?: { label: string; href: string };
};

export function TransactionalEmail({
  preview,
  heading,
  name,
  intro,
  details = [],
  footerNote,
  cta,
}: TransactionalEmailProps) {
  return (
    <EmailLayout preview={preview} heading={heading} cta={cta}>
      <Text style={text.primary}>Hello {name},</Text>
      <Text style={text.primary}>{intro}</Text>
      {details.length > 0 ? (
        <Text style={detailBlock}>
          {details.map((line) => (
            <span key={line.label}>
              <strong>{line.label}:</strong> {line.value}
              <br />
            </span>
          ))}
        </Text>
      ) : null}
      {footerNote ? <Text style={text.muted}>{footerNote}</Text> : null}
      <Text style={text.muted}>
        Questions? Contact us at{" "}
        <a href={`mailto:${brand.email}`} style={{ color: "#1e3a5f" }}>
          {brand.email}
        </a>
      </Text>
    </EmailLayout>
  );
}

export function plainTransactionalEmail(params: {
  heading: string;
  name: string;
  intro: string;
  details?: DetailLine[];
  footerNote?: string;
  cta?: { label: string; href: string };
}): string {
  const lines = [
    params.heading,
    "",
    `Hello ${params.name},`,
    "",
    params.intro,
    "",
  ];

  if (params.details?.length) {
    for (const d of params.details) {
      lines.push(`${d.label}: ${d.value}`);
    }
    lines.push("");
  }

  if (params.footerNote) {
    lines.push(params.footerNote, "");
  }

  if (params.cta) {
    lines.push(`${params.cta.label}: ${params.cta.href}`, "");
  }

  lines.push(`Support: ${brand.email}`);
  lines.push(`© ${new Date().getFullYear()} ${brand.name}`);

  return lines.join("\n");
}

const detailBlock = {
  ...text.primary,
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  padding: "16px",
  border: "1px solid #e2e8f0",
};
