# Not a Bot — Pricing Model Analysis & Recommendations

*Report Date: February 15, 2026*

---

## Executive Summary

Not a Bot is **well-positioned competitively** at $14.99/$29.99 per month — significantly cheaper than TikTok-specific analytics competitors (Pentos $99+, Exolyt $290+) while offering a genuine AI differentiator that only enterprise tools ($199+/mo) match. Current margins are healthy at 50-65% on Creator and 45-55% on Pro, with room for optimization through prompt caching and scraper selection.

The 7-day trial is shorter than the 14-day industry standard. A 14-day trial at Creator level with tighter usage caps would better balance conversion rates against cost exposure.

---

## 1. Actual Cost Per User (COGS Breakdown)

### Important: Sync Credit Recalibration

The Apify cost estimates below correct for how sync credits actually work in the codebase:
- **1 sync credit = 1 post scraped** (not 1 sync operation)
- **0.15 sync credits = 1 comment scraped**
- 250 Creator credits ≈ scraping ~200 posts + ~330 comments in a typical month
- 750 Pro credits ≈ scraping ~600 posts + ~1,000 comments

### Creator Tier ($14.99/mo) — Per-User Costs

| Cost Component | Monthly Cost | Notes |
|----------------|-------------|-------|
| Apify (TikTok scraping) | $1.00–$2.00 | ~200 posts × $0.003 + ~330 comments × $0.001 + actor starts |
| Anthropic AI (Haiku 4.5) | $2.60 | 1M tokens at current rates (60/40 input/output split) |
| Anthropic w/ prompt caching | $1.80 | 90% savings on system prompt reads |
| Infrastructure (DB, hosting) | $1.00–$2.00 | Estimated share of Neon/Vercel costs |
| **Total COGS** | **$4.80–$6.60** | |
| **Gross Margin** | **$8.39–$10.19** | **56–68%** |

### Pro Tier ($29.99/mo) — Per-User Costs

| Cost Component | Monthly Cost | Notes |
|----------------|-------------|-------|
| Apify (TikTok scraping) | $3.00–$5.00 | ~600 posts × $0.003 + ~1,000 comments × $0.001 + actor starts |
| Anthropic AI (Haiku 4.5) | $7.80 | 3M tokens at current rates |
| Anthropic w/ prompt caching | $5.40 | 90% savings on system prompt reads |
| Infrastructure (DB, hosting) | $2.00–$3.00 | Higher data retention (90 days), more accounts |
| **Total COGS** | **$12.80–$15.80** | |
| **Gross Margin** | **$14.19–$17.19** | **47–57%** |

### Cost Optimization Levers

| Optimization | Savings | Implementation Effort |
|-------------|---------|----------------------|
| **Prompt caching** (Anthropic) | ~30% on AI costs ($0.80/user Creator, $2.40/user Pro) | Low — cache system prompt + analytics catalog |
| **Batch API** for sentiment analysis | 50% on batch-eligible AI calls | Medium — run nightly batch jobs |
| **Switch to apidojo TikTok scraper** | 5-10x cheaper per post ($0.0003 vs $0.003) | Medium — evaluate API constraints |
| **Cap comment depth** | Up to 75% reduction on full sync costs | Low — limit to 100 comments per video |
| **Apify Scale plan** ($199/mo) | 15-25% discount on scraping | Worth it at ~6+ Pro-tier users |

---

## 2. Market Comparison

### How We Compare to TikTok Analytics Competitors

| Competitor | Entry Price | AI Features | Trial | Free Tier |
|-----------|-----------|-------------|-------|-----------|
| **Not a Bot** | **$14.99/mo** | **AI Copilot chat, sentiment analysis** | **7-day** | **No** |
| Pentos | $99/mo | None | Unknown | No |
| Exolyt | ~$290/mo | Sentiment (Advanced only) | Yes, no CC | Yes (very limited) |
| Analisa.io | $69/mo | AI-powered engine (no chat) | Unknown | Yes (basic) |
| TikBuddy | $69/mo | None | Free extension | Yes |
| Tokcount | Free | None | N/A | Yes (entire product) |

**Our pricing is 4-20x cheaper than TikTok-specific competitors** while offering the only conversational AI copilot in the category. This is our strongest competitive advantage.

### How We Compare to Multi-Platform Social Tools

| Competitor | Entry Price | AI Features | Trial | Model |
|-----------|-----------|-------------|-------|-------|
| **Not a Bot** | **$14.99/mo** | **AI Copilot** | **7-day** | **Credits** |
| Buffer | Free–$5/channel | AI Assistant (all plans) | 14-day | Per-channel |
| Later | $25/mo | AI credits (5-50/mo) | 14-day | Per-social-set |
| Iconosquare | $53/mo | AI content gen | 14-day | Per-profile count |
| Socialinsider | $83/mo | AI insights | 14-day | Per-account count |
| Hootsuite | $99/user/mo | OwlyGPT AI | 30-day | Per-user |
| Sprout Social | $199/seat/mo | AI Assist (Advanced $399) | 30-day | Per-seat |

**Our AI copilot is comparable to features that cost $99-$399/mo at Hootsuite and Sprout Social.** The $14.99 entry point is extremely competitive.

### Creator Economy Tool Pricing Alignment

| Tool | Entry | Mid | Premium |
|------|-------|-----|---------|
| Linktree | Free | $15/mo | $35/mo |
| Beacons | Free | $10/mo | $30/mo |
| Stan Store | $29/mo | $99/mo | — |
| **Not a Bot** | **$14.99/mo** | **$29.99/mo** | **—** |

Our pricing naturally slots into the creator economy price band ($10-$35/mo), which is the right positioning for our target audience.

---

## 3. Trial Analysis & Recommendations

### Current Trial: 7-Day Creator Level

| Resource | Amount | Max Cost Exposure |
|----------|--------|------------------|
| Sync credits | 500 (250 signup + 250 trial bonus) | ~$2–$3 Apify cost |
| AI tokens | 1,000,000 | ~$2.60 Anthropic cost |
| Connected accounts | 5 | Minimal marginal cost |
| **Total max cost per trial user** | | **~$5–$6** |

### Industry Trial Benchmarks

| Duration | Prevalence | Examples | Conversion Rate |
|----------|-----------|----------|----------------|
| 3 days | Rare | Pathable | Higher urgency, lower adoption |
| **7 days** | Common (creator tools) | Linktree, Not a Bot | Good for simple products |
| **14 days** | **Most common (SaaS standard)** | Buffer, Iconosquare, Socialinsider, Stan, Later | **18-25% opt-in conversion (median)** |
| 30 days | Premium/enterprise | Sprout Social, Hootsuite | Lower urgency, higher engagement |

**Opt-in (no CC) median conversion: 18.5%** | **Opt-out (CC required) median: 48-60%**

### Trial Economics

| Scenario | Cost/Trial User | Conversion Rate | Cost Per Acquired Customer | Break-even LTV |
|----------|----------------|-----------------|---------------------------|----------------|
| 7-day, full usage | $5–$6 | 18% | $28–$33 | ~2 months Creator |
| 7-day, avg usage (50%) | $2.50–$3 | 18% | $14–$17 | ~1 month Creator |
| 14-day, full usage | $8–$10 | 22% (longer = higher) | $36–$45 | ~3 months Creator |
| 14-day, capped usage | $5–$6 | 22% | $23–$27 | ~2 months Creator |

### Trial Recommendation

**Extend to 14 days with slightly reduced usage caps:**

| Resource | Current (7-day) | Recommended (14-day) | Rationale |
|----------|----------------|---------------------|-----------|
| Duration | 7 days | **14 days** | Industry standard, better conversion |
| Trial tier | Creator (basic) | **Creator (basic)** | Keep as-is — all features accessible |
| Trial sync credits | 250 | **150** | Enough for 1 full sync + several incrementals |
| Signup bonus | 250 | **250** | Keep — one-time, persists after trial |
| Trial AI tokens | 1,000,000 | **500,000** | ~100 AI interactions, enough to experience the copilot |
| Total sync credits available | 500 | **400** | Slightly reduced but spread over 14 days |
| Total AI tokens | 1,000,000 | **500,000** | 50% reduction offsets longer duration |
| **Est. max cost/trial user** | **$5–$6** | **$4–$5** | Lower per-user cost despite longer trial |
| **Est. cost/acquired customer** | **$28–$33** | **$18–$23** | Better conversion rate + lower cost |

**Why this works:**
- 14 days matches industry standard and gives users two weekends to explore
- Reduced token/credit caps keep cost exposure under control
- 400 total sync credits is still enough to fully experience syncing + AI analysis
- The signup bonus (250) persists after trial — gives expired users something to come back for
- Better conversion rate (22% vs 18%) more than offsets the longer duration

---

## 4. Pricing Tier Recommendations

### Current Pricing Assessment

| Tier | Price | Verdict | Rationale |
|------|-------|---------|-----------|
| Creator $14.99 | Keep | 56-68% margin, competitive with creator tools, well below TikTok analytics competitors |
| Pro $29.99 | **Consider $39.99** | 47-57% margin is adequate but tight for heavy users; Pro delivers more value than the price suggests |
| Credit packs | Keep | Reasonable, no market comparable — unique revenue stream |

### Detailed Recommendations

#### Creator Tier: Keep at $14.99/mo
- Healthy 56-68% gross margin
- Perfectly positioned in the creator economy price band ($10-$35)
- 4-20x cheaper than TikTok analytics competitors
- Price increase would risk losing the "affordable" positioning advantage

#### Pro Tier: Consider Increasing to $39.99/mo
- Current margin (47-57%) is adequate but leaves little room for cost increases
- At $39.99, margin improves to 60-68% — matching Creator tier margins
- Still significantly cheaper than Sprout Social ($199), Hootsuite ($99), Socialinsider ($83)
- The 25-account limit and 90-day retention are agency-level features worth more
- **Risk**: May reduce conversion from Creator to Pro. Monitor upgrade rates if implemented.
- **Alternative**: Keep $29.99 but introduce an annual plan at $24.99/mo ($299/year) to lock in commitment

#### Consider: Add an AI Token Upsell
- Currently no way to purchase additional AI tokens (only sync credit packs exist)
- Heavy AI users hit a hard wall at their tier limit — potential churn risk
- **Suggestion**: Add AI token packs alongside sync credit packs:

| Pack | Tokens | Price | Per-1K Rate |
|------|--------|-------|-------------|
| AI Starter | 500K | $2.99 | $0.006 |
| AI Value | 1.5M | $6.99 | $0.005 |
| AI Power | 5M | $14.99 | $0.003 |

At these prices, margins would be 50-70% even on Haiku 4.5 (which costs ~$2.60/1M tokens).

#### Consider: Limited Free Tier for Re-engagement
The current "Unsubscribed" state (0 everything) is a complete lockout. Consider a minimal free tier:
- 0 sync credits (no new data)
- 50K AI tokens (~10 chat interactions)
- 1 connected account (read-only, no sync)
- 7-day data retention

**Cost**: ~$0.13/month per free user in AI tokens — negligible. But it keeps users engaged and gives them a reason to re-subscribe when they see their data aging out.

---

## 5. Key Cost Risks & Mitigations

### Risk 1: Viral Comment Volume
A creator with a viral video (100K+ comments) could make a single full sync cost $100+ in Apify fees while consuming only ~15,250 sync credits (100K × 0.15 + posts).

**Mitigation**: Cap comment fetching at 500-1,000 comments per video. Most analytics insights are captured within the top comments. Implement a configurable comment depth limit.

### Risk 2: Anthropic Price Increases
If Anthropic raises Haiku pricing, AI costs could double or triple.

**Mitigation**:
- Implement prompt caching now (30% savings, low effort)
- Evaluate batch API for non-interactive tasks (sentiment analysis, recommendations)
- Keep model selection configurable for easy migration

### Risk 3: Apify Scraper Reliability
Dependency on third-party Actors (clockworks/tiktok-scraper) — pricing or availability could change.

**Mitigation**:
- Evaluate the cheaper apidojo alternative ($0.0003/post vs $0.003/post)
- Consider building a custom Apify Actor for more control over costs
- At scale (50+ users), negotiate enterprise Apify pricing (40-70% discounts)

### Risk 4: Trial Abuse
Users creating multiple accounts to chain free trials.

**Mitigation**: Already partially handled by Clerk auth (one account per email). Consider:
- Rate limiting trial starts by IP/device fingerprint
- Requiring email verification before trial credit grant
- Monitoring for patterns of sequential trial accounts

---

## 6. Action Items (Priority Order)

1. **Implement prompt caching** — ~30% AI cost reduction, low effort, immediate ROI
2. **Extend trial to 14 days** with reduced caps (150 trial sync credits, 500K AI tokens) — better conversion, lower per-acquisition cost
3. **Cap comment depth** at 500-1,000 per video — eliminates viral comment cost risk
4. **Add AI token packs** — new revenue stream, addresses churn risk from hard token limits
5. **Evaluate apidojo TikTok scraper** — potential 5-10x reduction in scraping costs
6. **Consider Pro price increase to $39.99** — improves margin, still well below competitors
7. **Consider minimal free tier** for re-engagement — negligible cost, reduces hard churn
8. **Upgrade to Apify Scale plan** when reaching ~6+ Pro users — 15-25% scraping discount

---

## Appendix: Source Data

### Anthropic API Pricing (Current — Haiku 4.5)
- Input: $1.00/MTok | Output: $5.00/MTok
- Prompt cache reads: $0.10/MTok (90% savings)
- Batch: 50% discount on all rates
- Current model in use: `claude-haiku-4-5`

### Apify Pricing (clockworks/tiktok-scraper, Bronze tier)
- Per post result: $0.003
- Per comment: $0.001
- Per actor start: $0.005
- Alternative (apidojo): $0.0003/post (flat rate)

### Competitor Pricing Summary
- Pentos: $99-$999/mo (TikTok analytics, no AI)
- Exolyt: Free-$700/mo (TikTok analytics, AI on highest tier)
- Analisa.io: Free-$149/mo (Instagram + TikTok)
- Iconosquare: Free-$85/mo (multi-platform, AI content gen)
- Sprout Social: $199-$399/seat/mo (enterprise, AI on Advanced)
- Hootsuite: $99-$249/user/mo (enterprise, AI on all plans)
- Buffer: Free-$10/channel/mo (scheduling-focused, AI on all plans)
- Later: $25-$200/mo (visual-first, AI credits system)

---

*Research conducted by: Apify Cost Analyst, Anthropic Cost Analyst, Market Researcher, Pricing Analyst*
*Synthesized by: Team Lead*
