import { Text } from "@react-email/components";
import { EmailLayout, text } from "./components/layout";

type PasswordResetEmailProps = {
  name: string;
  resetUrl: string;
};

export default function PasswordResetEmail({ name, resetUrl }: PasswordResetEmailProps) {
  return (
    <EmailLayout
      preview="Reset your Unique Sky Way password"
      heading="Reset your password"
      cta={{ label: "Reset password", href: resetUrl }}
    >
      <Text style={text.primary}>Hi {name},</Text>
      <Text style={text.primary}>
        We received a request to reset your password. Click the button below to
        choose a new password.
      </Text>
      <Text style={text.muted}>
        If you didn&apos;t request this, ignore this email. Your password will
        remain unchanged.
      </Text>
    </EmailLayout>
  );
}
