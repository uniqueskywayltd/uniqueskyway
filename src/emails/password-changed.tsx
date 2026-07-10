import { Text } from "@react-email/components";
import { EmailLayout, text } from "./components/layout";

type PasswordChangedEmailProps = {
  name: string;
  changedAt: string;
};

export default function PasswordChangedEmail({
  name,
  changedAt,
}: PasswordChangedEmailProps) {
  return (
    <EmailLayout
      preview="Your Unique Sky Way password was changed"
      heading="Password changed"
      badge={{ label: "Security alert", tone: "success" }}
      cta={{ label: "Review security settings", href: "https://uniqueskyway.com/dashboard/security" }}
    >
      <Text style={text.primary}>
        Hi <span style={text.strong}>{name}</span>,
      </Text>
      <Text style={text.primary}>
        Your password was successfully changed on{" "}
        <span style={text.strong}>{changedAt}</span>. All active sessions on
        other devices may require you to sign in again.
      </Text>
      <Text style={text.muted}>
        If you did not make this change, contact us immediately at
        info@uniqueskyway.com and review your active sessions from the security
        settings in your dashboard.
      </Text>
    </EmailLayout>
  );
}

PasswordChangedEmail.PreviewProps = {
  name: "Alex Morgan",
  changedAt: "July 6, 2026 at 3:42 PM UTC",
} satisfies PasswordChangedEmailProps;
