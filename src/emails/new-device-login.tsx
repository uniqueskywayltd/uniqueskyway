import { Text } from "@react-email/components";
import { EmailLayout, text } from "./components/layout";

type NewDeviceLoginEmailProps = {
  name: string;
  ipAddress: string;
  browser: string;
  os: string;
  loginTime: string;
  sessionsUrl: string;
};

export default function NewDeviceLoginEmail({
  name,
  ipAddress,
  browser,
  os,
  loginTime,
  sessionsUrl,
}: NewDeviceLoginEmailProps) {
  return (
    <EmailLayout
      preview="New device signed in to your Unique Sky Way account"
      heading="New device sign-in"
      cta={{ label: "Review active sessions", href: sessionsUrl }}
    >
      <Text style={text.primary}>Hi {name},</Text>
      <Text style={text.primary}>
        We noticed a sign-in from a new device on {loginTime}.
      </Text>
      <Text style={text.primary}>
        <strong>Device:</strong> {browser} on {os}
        <br />
        <strong>IP address:</strong> {ipAddress}
      </Text>
      <Text style={text.muted}>
        If this was you, no action is needed. Otherwise, secure your account
        immediately.
      </Text>
    </EmailLayout>
  );
}
