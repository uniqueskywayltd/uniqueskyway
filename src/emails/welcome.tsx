import { Text } from "@react-email/components";
import { EmailLayout, text } from "./components/layout";

type WelcomeEmailProps = {
  name: string;
  verifyUrl: string;
};

export default function WelcomeEmail({ name, verifyUrl }: WelcomeEmailProps) {
  return (
    <EmailLayout
      preview="Welcome to Unique Sky Way — verify your email to get started"
      heading={`Welcome, ${name}`}
      cta={{ label: "Verify email address", href: verifyUrl }}
    >
      <Text style={text.primary}>
        Thank you for opening an investor account with Unique Sky Way. We&apos;re
        glad to have you on board.
      </Text>
      <Text style={text.primary}>
        Please verify your email address to activate your account and access your
        secure investor dashboard.
      </Text>
      <Text style={text.muted}>
        If you didn&apos;t create this account, you can safely ignore this email.
      </Text>
    </EmailLayout>
  );
}

WelcomeEmail.PreviewProps = {
  name: "John Smith",
  verifyUrl: "https://uniqueskyway.com/auth/callback?token=example",
} satisfies WelcomeEmailProps;
