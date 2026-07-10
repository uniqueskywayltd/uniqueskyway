"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Quote } from "lucide-react";
import { card, section } from "@/components/marketing/marketing-ui";
import { testimonials } from "@/lib/constants/testimonials";
import { cn } from "@/lib/utils";

const INTERVAL_MS = 6000;

export function TestimonialsSection() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % testimonials.length);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const item = testimonials[index];

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
      aria-label="Client testimonials"
    >
      <div className="absolute inset-0 -z-10">
        <Image
          src="/brand/testimonials-bg.jpg"
          alt=""
          fill
          className="object-cover opacity-[0.14]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-slate-50/92 to-white/95 dark:from-slate-950/95 dark:via-slate-900/92 dark:to-slate-950/95" />
      </div>

      <div className={cn(section.container, section.padding)}>
        <div className="max-w-2xl">
          <p className={section.eyebrowSun}>Testimonials</p>
          <h2 className={section.headingSun}>What our clients are saying</h2>
          <p className={section.bodySun}>
            Real experiences from investors who value transparency, security, and
            long-term portfolio growth.
          </p>
        </div>

        <div className="relative mt-12 lg:mt-14">
          <AnimatePresence mode="wait">
            <motion.article
              key={item.name + index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className={cn("mx-auto max-w-3xl p-7 sm:p-9", card.sun)}
              aria-live="polite"
            >
              <Quote className="h-6 w-6 text-primary/70" aria-hidden />
              <blockquote className="mt-4 text-base font-medium leading-relaxed text-slate-800 dark:text-slate-200 sm:text-lg">
                &ldquo;{item.quote}&rdquo;
              </blockquote>
              <footer className="mt-8 border-t border-slate-200 pt-5 dark:border-border">
                <cite className="not-italic">
                  <p className="font-semibold text-slate-900 dark:text-slate-50">{item.name}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {item.occupation} · {item.location}
                  </p>
                </cite>
              </footer>
            </motion.article>
          </AnimatePresence>

          <div
            className="mt-8 flex justify-center gap-2"
            role="tablist"
            aria-label="Testimonial navigation"
          >
            {testimonials.map((t, i) => (
              <button
                key={t.name}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`View testimonial from ${t.name}`}
                onClick={() => setIndex(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  i === index ? "w-8 bg-primary" : "w-1.5 bg-slate-300 hover:bg-slate-400",
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
