import { Text } from "@react-email/components";
import { EmailLayout, text } from "./components/layout";
import { EmailOtpBlock } from "./components/otp-block";

type PasswordResetEmailProps = {
  name: string;
  resetUrl: string;
  otp?: string | null;
};

export default function PasswordResetEmail({ name, resetUrl, otp }: PasswordResetEmailProps) {
  return (
    <EmailLayout
      preview="Reset your Unique Sky Way password"
      heading="Reset your password"
      cta={{ label: "Choose new password", href: resetUrl }}
      badge={{ label: "Security", tone: "neutral" }}
    >
      <Text style={text.primary}>
        Hi <span style={text.strong}>{name}</span>,
      </Text>
      <Text style={text.primary}>
        We received a request to reset your password. Click the button below to
        choose a new password for your investor account.
      </Text>
      {otp ? <EmailOtpBlock otp={otp} /> : null}
      <Text style={text.muted}>
        If you didn&apos;t request this, ignore this email. Your password will
        remain unchanged and your account stays secure.
      </Text>
    </EmailLayout>
  );
}

PasswordResetEmail.PreviewProps = {
  name: "Alex Morgan",
  resetUrl: "https://uniqueskyway.com/auth/verify?token=example&type=recovery&email=alex%40example.com",
  otp: "482913",
} satisfies PasswordResetEmailProps;
