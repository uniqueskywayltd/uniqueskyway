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
    >
      <Text style={text.primary}>Hi {name},</Text>
      <Text style={text.primary}>
        Your password was successfully changed on {changedAt}.
      </Text>
      <Text style={text.muted}>
        If you did not make this change, contact us immediately at
        info@uniqueskyway.com.
      </Text>
    </EmailLayout>
  );
}
