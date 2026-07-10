import { Text } from "@react-email/components";
import { EmailLayout, text } from "./components/layout";
import { EmailOtpBlock } from "./components/otp-block";

type WelcomeEmailProps = {
  name: string;
  verifyUrl: string;
  otp?: string | null;
};

export default function WelcomeEmail({ name, verifyUrl, otp }: WelcomeEmailProps) {
  return (
    <EmailLayout
      preview="Verify your email — Unique Sky Way"
      heading={`Hi ${name}`}
      cta={{ label: "Verify email", href: verifyUrl }}
    >
      <Text style={text.primary}>
        Verify your email to finish setting up your account.
      </Text>
      {otp ? <EmailOtpBlock otp={otp} /> : null}
      <Text style={text.muted}>
        If you didn&apos;t sign up, you can ignore this email.
      </Text>
    </EmailLayout>
  );
}

WelcomeEmail.PreviewProps = {
  name: "Alex Morgan",
  verifyUrl: "https://uniqueskyway.com/auth/verify?token=example&type=signup&email=alex%40example.com",
  otp: "482913",
} satisfies WelcomeEmailProps;
