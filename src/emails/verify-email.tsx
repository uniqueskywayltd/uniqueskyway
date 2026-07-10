import { Text } from "@react-email/components";
import { EmailLayout, text } from "./components/layout";
import { EmailOtpBlock } from "./components/otp-block";

type VerifyEmailProps = {
  name: string;
  verifyUrl: string;
  otp?: string | null;
};

export default function VerifyEmail({ name, verifyUrl, otp }: VerifyEmailProps) {
  return (
    <EmailLayout
      preview="Verify your email — Unique Sky Way"
      heading="Verify your email"
      cta={{ label: "Verify email", href: verifyUrl }}
    >
      <Text style={text.primary}>
        Hi <span style={text.strong}>{name}</span>, use the button or code below to verify your email.
      </Text>
      {otp ? <EmailOtpBlock otp={otp} /> : null}
      <Text style={text.muted}>This link and code expire in 24 hours.</Text>
    </EmailLayout>
  );
}

VerifyEmail.PreviewProps = {
  name: "Alex Morgan",
  verifyUrl: "https://uniqueskyway.com/auth/verify?token=example&type=verify&email=alex%40example.com",
  otp: "482913",
} satisfies VerifyEmailProps;
