import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { resolveAppUrl } from "@/lib/env";

const appUrl = resolveAppUrl();

const brand = {
  name: "Unique Sky Way",
  email: "info@uniqueskyway.com",
  url: appUrl,
  logoUrl: `${appUrl}/brand/logo.png`,
};

type EmailLayoutProps = {
  preview: string;
  heading: string;
  children: React.ReactNode;
  cta?: { label: string; href: string };
};

export function EmailLayout({ preview, heading, children, cta }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img src={brand.logoUrl} width="48" height="48" alt={brand.name} style={logo} />
            <Text style={brandName}>{brand.name}</Text>
          </Section>

          <Section style={card}>
            <Heading style={headingStyle}>{heading}</Heading>
            {children}
            {cta ? (
              <Section style={buttonSection}>
                <Button style={button} href={cta.href}>
                  {cta.label}
                </Button>
              </Section>
            ) : null}
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            © {new Date().getFullYear()} {brand.name}. All rights reserved.
            <br />
            <Link href={`mailto:${brand.email}`} style={link}>
              {brand.email}
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export { brand };

const main = {
  backgroundColor: "#f4f6f9",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const container = { margin: "0 auto", padding: "40px 20px", maxWidth: "560px" };
const header = { textAlign: "center" as const, marginBottom: "24px" };
const logo = { borderRadius: "12px", margin: "0 auto" };
const brandName = {
  color: "#1e293b",
  fontSize: "14px",
  fontWeight: "600",
  margin: "12px 0 0",
};
const card = {
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  padding: "32px",
  border: "1px solid #e2e8f0",
};
const headingStyle = {
  color: "#0f172a",
  fontSize: "24px",
  fontWeight: "600",
  margin: "0 0 16px",
};
const buttonSection = { textAlign: "center" as const, marginTop: "28px" };
const button = {
  backgroundColor: "#1e3a5f",
  borderRadius: "10px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
  padding: "12px 28px",
};
const hr = { borderColor: "#e2e8f0", margin: "32px 0 16px" };
const footer = {
  color: "#64748b",
  fontSize: "12px",
  lineHeight: "20px",
  textAlign: "center" as const,
};
const link = { color: "#1e3a5f" };

export const text = {
  primary: {
    color: "#334155",
    fontSize: "15px",
    lineHeight: "24px",
    margin: "0 0 16px",
  },
  muted: {
    color: "#64748b",
    fontSize: "13px",
    lineHeight: "20px",
    margin: "16px 0 0",
  },
};
