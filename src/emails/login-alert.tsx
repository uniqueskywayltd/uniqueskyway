import { TransactionalEmail } from "./components/transactional-email";

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
    <TransactionalEmail
      preview="New sign-in to your Unique Sky Way account"
      heading="New sign-in detected"
      badge={{ label: "Security", tone: "neutral" }}
      name={name}
      intro={`Your account was signed in to on ${loginTime}. If this activity looks unfamiliar, secure your account immediately.`}
      details={[
        { label: "Device", value: `${browser} on ${os}` },
        { label: "IP address", value: ipAddress },
        { label: "Time", value: loginTime },
      ]}
      footerNote="If this wasn't you, change your password immediately and contact info@uniqueskyway.com."
      cta={{ label: "Review account security", href: "https://uniqueskyway.com/dashboard/security" }}
    />
  );
}

LoginAlertEmail.PreviewProps = {
  name: "Alex Morgan",
  ipAddress: "192.168.1.42",
  browser: "Chrome",
  os: "macOS",
  loginTime: "July 6, 2026 at 3:42 PM UTC",
} satisfies LoginAlertEmailProps;
