import { Column, Row, Section, Text } from "@react-email/components";
import { EmailLayout, text, brand, linkStyle } from "./layout";
import { emailColors, emailMono } from "./tokens";

export type DetailLine = {
  label: string;
  value: string;
  highlight?: boolean;
};

type TransactionalEmailProps = {
  preview: string;
  heading: string;
  name: string;
  intro: string;
  details?: DetailLine[];
  footerNote?: string;
  cta?: { label: string; href: string };
  badge?: { label: string; tone?: "success" | "warning" | "danger" | "neutral" };
};

export function EmailDetailTable({ details }: { details: DetailLine[] }) {
  if (details.length === 0) return null;

  return (
    <Section style={detailWrap}>
      <Section style={detailHeader}>
        <Text style={detailHeaderText}>Transaction details</Text>
      </Section>
      <Section style={detailTable}>
        {details.map((line, index) => (
          <Row
            key={line.label}
            style={{
              ...detailRow,
              borderBottom:
                index < details.length - 1 ? `1px solid ${emailColors.detailBorder}` : "none",
            }}
          >
            <Column style={detailLabelCol}>
              <Text style={detailLabel}>{line.label}</Text>
            </Column>
            <Column style={detailValueCol}>
              <Text
                style={{
                  ...detailValue,
                  color: line.highlight ? emailColors.accentDark : emailColors.detailValue,
                  fontWeight: line.highlight ? "700" : "500",
                }}
              >
                {line.value}
              </Text>
            </Column>
          </Row>
        ))}
      </Section>
    </Section>
  );
}

export function TransactionalEmail({
  preview,
  heading,
  name,
  intro,
  details = [],
  footerNote,
  cta,
  badge,
}: TransactionalEmailProps) {
  return (
    <EmailLayout preview={preview} heading={heading} cta={cta} badge={badge}>
      <Text style={text.primary}>
        Hello <span style={text.strong}>{name}</span>,
      </Text>
      <Text style={text.primary}>{intro}</Text>
      <EmailDetailTable details={details} />
      {footerNote ? (
        <Section style={noticeBox}>
          <Text style={noticeLabel}>Important</Text>
          <Text style={noticeText}>{footerNote}</Text>
        </Section>
      ) : null}
      <Text style={text.muted}>
        Questions? Contact our investor support team at{" "}
        <a href={`mailto:${brand.email}`} style={linkStyle}>
          {brand.email}
        </a>
        .
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
    lines.push("— Transaction details —");
    for (const d of params.details) {
      lines.push(`${d.label}: ${d.value}`);
    }
    lines.push("");
  }

  if (params.footerNote) {
    lines.push(`Important: ${params.footerNote}`, "");
  }

  if (params.cta) {
    lines.push(`${params.cta.label}: ${params.cta.href}`, "");
  }

  lines.push(`Support: ${brand.email}`);
  lines.push(`© ${new Date().getFullYear()} ${brand.name}`);

  return lines.join("\n");
}

const detailWrap = {
  margin: "8px 0 20px",
  borderRadius: "12px",
  overflow: "hidden" as const,
  border: `1px solid ${emailColors.detailBorder}`,
};

const detailHeader = {
  backgroundColor: emailColors.detailHeaderBg,
  padding: "10px 16px",
};

const detailHeaderText = {
  color: "#94a3b8",
  fontSize: "10px",
  fontWeight: "700",
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
  margin: "0",
  lineHeight: "14px",
};

const detailTable = {
  backgroundColor: emailColors.detailBg,
};

const detailRow = {
  width: "100%",
};

const detailLabelCol = {
  width: "38%",
  padding: "12px 16px",
  verticalAlign: "top" as const,
};

const detailValueCol = {
  width: "62%",
  padding: "12px 16px",
  verticalAlign: "top" as const,
};

const detailLabel = {
  color: emailColors.detailLabel,
  fontSize: "11px",
  fontWeight: "600",
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  margin: "0",
  lineHeight: "18px",
};

const detailValue = {
  color: emailColors.detailValue,
  fontSize: "14px",
  margin: "0",
  lineHeight: "20px",
  fontFamily: emailMono,
};

const noticeBox = {
  backgroundColor: emailColors.warningBg,
  borderRadius: "10px",
  border: `1px solid ${emailColors.warningBorder}`,
  borderLeft: `4px solid ${emailColors.accent}`,
  padding: "14px 16px",
  margin: "4px 0 16px",
};

const noticeLabel = {
  color: emailColors.warningText,
  fontSize: "10px",
  fontWeight: "700",
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  margin: "0 0 6px",
  lineHeight: "14px",
};

const noticeText = {
  color: "#92400e",
  fontSize: "13px",
  lineHeight: "22px",
  margin: "0",
};
