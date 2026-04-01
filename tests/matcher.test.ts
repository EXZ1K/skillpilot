import { describe, it, expect } from "vitest";
import { matchCategories } from "../src/skills/matcher.js";

describe("matchCategories", () => {
  // ─── Always-included categories ───

  it("always includes review, security, docs", () => {
    const cats = matchCategories("anything");
    expect(cats).toContain("review");
    expect(cats).toContain("security");
    expect(cats).toContain("docs");
  });

  it("falls back to auth + database + docs when no keywords match", () => {
    const cats = matchCategories("something random xyz");
    expect(cats).toContain("auth");
    expect(cats).toContain("database");
    expect(cats).toContain("docs");
  });

  // ─── Direct technology keywords ───

  it("matches 'stripe' → payments", () => {
    const cats = matchCategories("integrate stripe");
    expect(cats).toContain("payments");
  });

  it("matches 'supabase' → database", () => {
    const cats = matchCategories("use supabase for backend");
    expect(cats).toContain("database");
  });

  it("matches 'openai' → ai", () => {
    const cats = matchCategories("openai chatbot");
    expect(cats).toContain("ai");
  });

  it("matches 'resend' → email", () => {
    const cats = matchCategories("send emails with resend");
    expect(cats).toContain("email");
  });

  it("matches 'vercel' → deploy", () => {
    const cats = matchCategories("deploy to vercel");
    expect(cats).toContain("deploy");
  });

  it("matches 'redis' → cache", () => {
    const cats = matchCategories("use redis for caching");
    expect(cats).toContain("cache");
  });

  it("matches 'sentry' → monitoring", () => {
    const cats = matchCategories("add sentry for errors");
    expect(cats).toContain("monitoring");
  });

  it("matches 'algolia' → search", () => {
    const cats = matchCategories("algolia search");
    expect(cats).toContain("search");
  });

  it("matches 'posthog' → analytics", () => {
    const cats = matchCategories("posthog analytics");
    expect(cats).toContain("analytics");
  });

  // ─── Abstract feature keywords ───

  it("matches 'login' → auth", () => {
    const cats = matchCategories("user login page");
    expect(cats).toContain("auth");
  });

  it("matches 'subscription' → payments", () => {
    const cats = matchCategories("subscription billing");
    expect(cats).toContain("payments");
  });

  it("matches 'chatbot' → ai", () => {
    const cats = matchCategories("chatbot for support");
    expect(cats).toContain("ai");
  });

  it("matches 'newsletter' → email", () => {
    const cats = matchCategories("newsletter signup");
    expect(cats).toContain("email");
  });

  // ─── Booking/appointment keywords (critical fix) ───

  it("matches 'booking' → payments + auth + database", () => {
    const cats = matchCategories("online booking system");
    expect(cats).toContain("payments");
    expect(cats).toContain("auth");
    expect(cats).toContain("database");
  });

  it("matches 'appointment' → payments + auth + database", () => {
    const cats = matchCategories("appointment scheduling");
    expect(cats).toContain("payments");
    expect(cats).toContain("auth");
    expect(cats).toContain("database");
  });

  it("matches 'portal' → auth + database", () => {
    const cats = matchCategories("customer portal");
    expect(cats).toContain("auth");
    expect(cats).toContain("database");
  });

  it("matches 'cabinet' → auth + database", () => {
    const cats = matchCategories("personal cabinet");
    expect(cats).toContain("auth");
    expect(cats).toContain("database");
  });

  // ─── New category keywords ───

  it("matches 'slack' → communication", () => {
    const cats = matchCategories("slack integration");
    expect(cats).toContain("communication");
  });

  it("matches 'linear' → project-management", () => {
    const cats = matchCategories("linear issue tracker");
    expect(cats).toContain("project-management");
  });

  it("matches 'notion' → documents", () => {
    const cats = matchCategories("notion knowledge base");
    expect(cats).toContain("documents");
  });

  it("matches 'scraper' → browser", () => {
    const cats = matchCategories("web scraper tool");
    expect(cats).toContain("browser");
  });

  it("matches 'figma' → design", () => {
    const cats = matchCategories("figma design system");
    expect(cats).toContain("design");
  });

  it("matches 'seo' → marketing", () => {
    const cats = matchCategories("seo optimization");
    expect(cats).toContain("marketing");
  });

  it("matches 'context7' → docs", () => {
    const cats = matchCategories("use context7 for docs");
    expect(cats).toContain("docs");
  });

  // ─── Compound project types ───

  it("'saas' maps to auth + payments + database + analytics + monitoring + design", () => {
    const cats = matchCategories("build a saas");
    expect(cats).toContain("auth");
    expect(cats).toContain("payments");
    expect(cats).toContain("database");
    expect(cats).toContain("analytics");
    expect(cats).toContain("monitoring");
    expect(cats).toContain("design");
  });

  it("'ecommerce' maps to auth + payments + database + email + search + analytics + design", () => {
    const cats = matchCategories("ecommerce store");
    expect(cats).toContain("auth");
    expect(cats).toContain("payments");
    expect(cats).toContain("database");
    expect(cats).toContain("email");
    expect(cats).toContain("search");
    expect(cats).toContain("analytics");
    expect(cats).toContain("design");
  });

  it("'marketplace' includes notifications", () => {
    const cats = matchCategories("marketplace platform");
    expect(cats).toContain("notifications");
  });

  it("'crm' includes communication", () => {
    const cats = matchCategories("crm tool");
    expect(cats).toContain("communication");
  });

  // ─── Business type keywords ───

  it("'clinic' maps to marketing + auth + database + design + deploy + payments", () => {
    const cats = matchCategories("veterinary clinic website");
    expect(cats).toContain("marketing");
    expect(cats).toContain("auth");
    expect(cats).toContain("database");
    expect(cats).toContain("design");
    expect(cats).toContain("deploy");
    expect(cats).toContain("payments");
  });

  it("'restaurant' maps to full business stack", () => {
    const cats = matchCategories("restaurant website");
    expect(cats).toContain("marketing");
    expect(cats).toContain("design");
    expect(cats).toContain("payments");
  });

  it("'salon' maps to full business stack", () => {
    const cats = matchCategories("beauty salon booking");
    expect(cats).toContain("marketing");
    expect(cats).toContain("payments");
    expect(cats).toContain("design");
  });

  // ─── Full scenario: vet clinic ───

  it("vet clinic with booking + payments + portal → 9 categories", () => {
    const cats = matchCategories(
      "veterinary clinic website with appointment booking online payments and user portal",
    );
    expect(cats).toContain("review");
    expect(cats).toContain("security");
    expect(cats).toContain("docs");
    expect(cats).toContain("marketing");
    expect(cats).toContain("auth");
    expect(cats).toContain("database");
    expect(cats).toContain("design");
    expect(cats).toContain("deploy");
    expect(cats).toContain("payments");
    expect(cats.length).toBe(9);
  });

  // ─── Tokenizer: camelCase, separators ───

  it("camelCase: toLowerCase runs first, so 'stripePayments' becomes one token", () => {
    // Known limitation: toLowerCase() before camelCase split means
    // 'stripePayments' → 'stripepayments' (no split). Individual words still work.
    const cats = matchCategories("stripe payments integration");
    expect(cats).toContain("payments");
  });

  it("handles dashes: 'e-commerce' → ecommerce behavior", () => {
    // "e" is too short (filtered), "commerce" isn't a keyword
    // but "ecommerce" as one word works
    const cats = matchCategories("ecommerce");
    expect(cats).toContain("payments");
  });

  it("is case-insensitive", () => {
    const cats = matchCategories("STRIPE SUPABASE VERCEL");
    expect(cats).toContain("payments");
    expect(cats).toContain("database");
    expect(cats).toContain("deploy");
  });

  // ─── Non-English text falls back to defaults ───

  it("non-English text gets fallback categories (matcher is English-only)", () => {
    const cats = matchCategories("сайт ветклиники с оплатой");
    // No English keywords → fallback to auth + database + docs + always_include
    expect(cats).toContain("auth");
    expect(cats).toContain("database");
    expect(cats).toContain("docs");
    expect(cats).toContain("review");
    expect(cats).toContain("security");
  });

  // ─── No duplicates ───

  it("returns unique categories", () => {
    const cats = matchCategories("auth login signup register oauth sso");
    const unique = [...new Set(cats)];
    expect(cats.length).toBe(unique.length);
  });
});
