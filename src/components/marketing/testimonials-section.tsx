"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Quote } from "lucide-react";
import { section } from "@/components/marketing/marketing-ui";
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
    <section className="relative overflow-hidden" aria-label="Client testimonials">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/brand/testimonials-bg.jpg"
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-slate-950/90" />
      </div>

      <div className={cn(section.container, section.padding)}>
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
            Testimonials
          </p>
          <h2 className={section.headingLight}>What our clients are saying</h2>
          <p className={section.bodyLight}>
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
              className="mx-auto max-w-3xl rounded-xl border border-white/10 bg-white/[0.04] p-7 sm:p-9"
              aria-live="polite"
            >
              <Quote className="h-6 w-6 text-slate-500" aria-hidden />
              <blockquote className="mt-4 text-base leading-relaxed text-slate-200 sm:text-lg">
                &ldquo;{item.quote}&rdquo;
              </blockquote>
              <footer className="mt-8 border-t border-white/10 pt-5">
                <cite className="not-italic">
                  <p className="font-semibold text-white">{item.name}</p>
                  <p className="mt-1 text-sm text-slate-400">
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
                  i === index ? "w-8 bg-white/70" : "w-1.5 bg-white/25 hover:bg-white/40",
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
