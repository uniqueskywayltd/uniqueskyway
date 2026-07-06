import { Text } from "@react-email/components";
import { EmailLayout, text } from "./components/layout";

type LoginAlertEmailProps = {
  name: string;
  ipAddress: string;
  browser: string;
  os: string;
  loginTime: string;
};

export default function LoginAlertEmail({
  name,
  ipAddress,
  browser,
  os,
  loginTime,
}: LoginAlertEmailProps) {
  return (
    <EmailLayout
      preview="New sign-in to your Unique Sky Way account"
      heading="New sign-in detected"
    >
      <Text style={text.primary}>Hi {name},</Text>
      <Text style={text.primary}>
        Your account was signed in to on {loginTime}.
      </Text>
      <Text style={text.primary}>
        <strong>Device:</strong> {browser} on {os}
        <br />
        <strong>IP address:</strong> {ipAddress}
      </Text>
      <Text style={text.muted}>
        If this wasn&apos;t you, change your password immediately and contact
        info@uniqueskyway.com.
      </Text>
    </EmailLayout>
  );
}
