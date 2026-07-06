import { Text } from "@react-email/components";
import { EmailLayout, text } from "./components/layout";

type VerifyEmailProps = {
  name: string;
  verifyUrl: string;
};

export default function VerifyEmail({ name, verifyUrl }: VerifyEmailProps) {
  return (
    <EmailLayout
      preview="Verify your Unique Sky Way email address"
      heading="Verify your email"
      cta={{ label: "Verify email", href: verifyUrl }}
    >
      <Text style={text.primary}>Hi {name},</Text>
      <Text style={text.primary}>
        Click the button below to verify your email address and complete your
        account setup.
      </Text>
      <Text style={text.muted}>This link expires in 24 hours.</Text>
    </EmailLayout>
  );
}
