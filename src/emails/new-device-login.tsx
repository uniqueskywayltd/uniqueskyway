import { TransactionalEmail } from "./components/transactional-email";

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
    <TransactionalEmail
      preview="New device signed in to your Unique Sky Way account"
      heading="New device sign-in"
      badge={{ label: "Security alert", tone: "warning" }}
      name={name}
      intro={`We noticed a sign-in from a new device on ${loginTime}. Review the session details below.`}
      details={[
        { label: "Device", value: `${browser} on ${os}` },
        { label: "IP address", value: ipAddress },
        { label: "Time", value: loginTime },
      ]}
      footerNote="If this was you, no action is needed. Otherwise, secure your account immediately."
      cta={{ label: "Review active sessions", href: sessionsUrl }}
    />
  );
}

NewDeviceLoginEmail.PreviewProps = {
  name: "Alex Morgan",
  ipAddress: "192.168.1.42",
  browser: "Safari",
  os: "iOS",
  loginTime: "July 6, 2026 at 3:42 PM UTC",
  sessionsUrl: "https://uniqueskyway.com/dashboard/security",
} satisfies NewDeviceLoginEmailProps;
