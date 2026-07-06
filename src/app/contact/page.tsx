"use client";

import Image from "next/image";
import { useState } from "react";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import { MarketingLayout } from "@/components/layout/marketing-layout";
import { PageHero } from "@/components/marketing/page-hero";
import { MathCaptchaField } from "@/components/ui/math-captcha-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { isMathCaptchaCorrect, randomMathDigit } from "@/lib/utils/math-captcha";

const contactInfo = [
  {
    icon: Mail,
    label: "Email",
    value: "info@uniqueskyway.com",
    href: "mailto:info@uniqueskyway.com",
  },
  {
    icon: MapPin,
    label: "Location",
    value: "Fayetteville, Arkansas, United States",
  },
  {
    icon: Phone,
    label: "Support Hours",
    value: "Monday – Friday, 9:00 AM – 6:00 PM (CST)",
  },
];

export default function ContactPage() {
  const [mathA] = useState(() => randomMathDigit());
  const [mathB] = useState(() => randomMathDigit());
  const [mathAnswer, setMathAnswer] = useState("");

  return (
    <MarketingLayout>
      <PageHero
        subtitle="Contact Us"
        title="We're here to help"
        description="Serving investors is what we do. Get in touch and your request will be directed to the right specialist on our team."
        image="/brand/contact.jpg"
        imageAlt="Contact Unique Sky Way"
        align="center"
      />

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <p className="text-sm font-medium uppercase tracking-widest text-primary">
                Get in Touch
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                Speak with our team
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Whether you have questions about investment plans, account setup, or
                referrals — our expert team is ready to assist you.
              </p>

              <div className="mt-8 space-y-4">
                {contactInfo.map((item) => (
                  <Card key={item.label} className="border-border/60">
                    <CardContent className="flex items-start gap-4 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <item.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        {item.href ? (
                          <a
                            href={item.href}
                            className="text-sm text-muted-foreground hover:text-primary"
                          >
                            {item.value}
                          </a>
                        ) : (
                          <p className="text-sm text-muted-foreground">{item.value}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="relative mt-8 aspect-video overflow-hidden rounded-2xl shadow-lg">
                <Image
                  src="/brand/office.jpg"
                  alt="Our office"
                  fill
                  className="object-cover"
                  sizes="400px"
                />
              </div>
            </div>

            <div className="lg:col-span-3">
              <Card className="border-border/60 shadow-sm">
                <CardContent className="p-8">
                  <h3 className="text-xl font-semibold">Send us a message</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Fill out the form below and our team will respond within one business day.
                  </p>

                  <form
                    className="mt-8 space-y-5"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!isMathCaptchaCorrect(mathA, mathB, mathAnswer)) {
                        return;
                      }
                      alert(
                        "Thank you for your message. Our team will connect with you soon via email.",
                      );
                    }}
                  >
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full name</Label>
                        <Input id="name" name="name" placeholder="Your name" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="you@example.com"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone (optional)</Label>
                      <Input id="phone" name="phone" type="tel" placeholder="+1 (555) 000-0000" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        name="subject"
                        placeholder="How can we help?"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Tell us about your inquiry..."
                        rows={5}
                        required
                      />
                    </div>
                    <MathCaptchaField
                      a={mathA}
                      b={mathB}
                      value={mathAnswer}
                      onChange={setMathAnswer}
                    />
                    <Button type="submit" size="lg" className="w-full sm:w-auto">
                      <Send className="mr-2 h-4 w-4" />
                      Send message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
