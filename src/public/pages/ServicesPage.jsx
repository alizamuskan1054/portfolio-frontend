import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Mail, MessageCircle, Phone, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { paths } from '@/routes/paths'
import { Container } from '@/public/components/Container'
import { PageHero } from '@/public/components/PageHero'
import { Reveal } from '@/public/components/Reveal'
import { Section } from '@/public/components/Section'
import { SectionHeading } from '@/public/components/SectionHeading'
import { useServices } from '@/public/hooks/usePublicData'
import { usePublicSite } from '@/public/hooks/usePublicSite'

// =====================================================================================
// SERVICES PAGE (v3): hero (animated), featured service (icon ke baghair), redesigned cards,
// How I Work (4 steps), Contact CTA band.
//
// v3 changes:
//   - Hero: aurora glow, moving grid, orbit rings + orbiting dots, floating particles, shimmer title.
//   - Featured: visual panel se icon + rings hata diye; ab sirf glow + bara ghost number.
//   - Cards: media header (image ya navy pattern), glass tag, overlapping icon tile, ghost number.
//   - Colors / theme variables (--c-*) bilkul wahi hain, kuch change nahi.
//
// Order aur backgrounds:  navy hero -> background (featured + cards) -> blue-tint (How I Work)
//                         -> background (CTA gradient card) -> navy footer (layout ka hissa)
//
// Visibility (section_visibility.services):
//   how_i_work   -> process steps section (steps na hon to bhi hide)
//   contact_cta  -> bottom CTA band
//
// Animations: `sv-*` classes + <Reveal>. prefers-reduced-motion mein sab band.
// =====================================================================================

const SERVICES_CSS = `
/* =====================================================================================
   SERVICES PAGE (sv-*): animations, gradients, glass.
   Sab colors theme variables (--c-*) se aate hain, isliye light/dark dono mein theme ke saath chalte hain.
   ===================================================================================== */
:root {
  --sv-deep: color-mix(in srgb, var(--c-primary) 88%, var(--c-navy));
  --sv-icon-end: var(--c-navy);
}
.dark {
  --sv-deep: color-mix(in srgb, var(--c-primary) 38%, var(--c-navy));
  --sv-icon-end: color-mix(in srgb, var(--c-primary) 45%, var(--c-on-navy));
}

@keyframes sv-drift {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  33% { transform: translate3d(36px, -26px, 0) scale(1.12); }
  66% { transform: translate3d(-28px, 22px, 0) scale(0.94); }
}
@keyframes sv-float {
  0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
  50% { transform: translate3d(0, -14px, 0) rotate(1.5deg); }
}
@keyframes sv-gradient {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
@keyframes sv-spin {
  to { transform: rotate(360deg); }
}
@keyframes sv-ping {
  0% { transform: scale(1); opacity: 0.7; }
  80%, 100% { transform: scale(2.6); opacity: 0; }
}
@keyframes sv-shine {
  to { transform: translateX(380%) skewX(-20deg); }
}
@keyframes sv-draw {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
@keyframes sv-sheen {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}
@keyframes sv-rise {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: none; }
}
@keyframes sv-twinkle {
  0%, 100% { opacity: 0.25; transform: scale(0.8) rotate(0deg); }
  50% { opacity: 1; transform: scale(1.15) rotate(20deg); }
}
@keyframes sv-text {
  from { background-position: 120% 0; }
  to { background-position: -120% 0; }
}
@keyframes sv-grid {
  to { background-position: 44px 44px, 44px 44px; }
}
@keyframes sv-pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(0.85); opacity: 0.55; }
  50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
}
@keyframes sv-particle {
  0%, 100% { transform: translate3d(0, 0, 0); opacity: 0.2; }
  50% { transform: translate3d(10px, -22px, 0); opacity: 0.9; }
}
/* elliptical orbit: x aur y alag animate hote hain (y ka phase quarter-cycle aage), depth ke liye scale + opacity */
@keyframes sv-ox {
  from { transform: translateX(calc(var(--rx) * -1)); }
  to { transform: translateX(var(--rx)); }
}
@keyframes sv-oy {
  from { transform: translateY(calc(var(--ry) * -1)) scale(0.82); opacity: 0.55; }
  to { transform: translateY(var(--ry)) scale(1.08); opacity: 1; }
}

@layer components {
  /* ---- scroll reveal ---- */
  .sv-reveal {
    opacity: 0;
    transform: translate3d(0, 28px, 0) scale(0.98);
    transition:
      opacity 0.8s cubic-bezier(0.2, 0.7, 0.2, 1) var(--sv-delay, 0ms),
      transform 0.8s cubic-bezier(0.2, 0.7, 0.2, 1) var(--sv-delay, 0ms);
  }
  .sv-reveal.is-in {
    opacity: 1;
    transform: none;
  }

  /* ---- hero (shared PageHero + decoration, rectangle) ---- */
  .sv-hero-wrap {
    position: relative;
    overflow: hidden;
    color: var(--c-on-navy);
  }
  .sv-hero-wrap .sv-blob {
    z-index: 1;
    pointer-events: none;
  }
  .sv-hero-wrap .sv-dots {
    z-index: 1;
    opacity: 0.5;
    pointer-events: none;
    background-image: radial-gradient(color-mix(in srgb, var(--c-on-navy) 28%, transparent) 1px, transparent 1px);
    -webkit-mask-image: linear-gradient(180deg, #000, transparent 85%);
    mask-image: linear-gradient(180deg, #000, transparent 85%);
  }
  .sv-sheen {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 2px;
    z-index: 2;
    pointer-events: none;
    background: linear-gradient(90deg, transparent, var(--c-primary), var(--c-accent), transparent);
    background-size: 200% 100%;
    animation: sv-sheen 6s linear infinite;
  }

  /* hero title: halki si shimmer jo accent colour se guzarti hai */
  .sv-hero-wrap :is(h1, h2) {
    color: transparent;
    background-image: linear-gradient(
      100deg,
      var(--c-on-navy) 0%,
      var(--c-on-navy) 42%,
      var(--c-accent) 50%,
      var(--c-on-navy) 58%,
      var(--c-on-navy) 100%
    );
    background-size: 250% 100%;
    background-position: 120% 0;
    -webkit-background-clip: text;
    background-clip: text;
    animation: sv-text 7s ease-in-out infinite;
  }

  /* slowly rotating aurora behind the hero */
  .sv-aurora {
    position: absolute;
    z-index: 0;
    left: 50%;
    top: 50%;
    width: 70rem;
    height: 70rem;
    margin: -35rem 0 0 -35rem;
    pointer-events: none;
    border-radius: 9999px;
    opacity: 0.32;
    filter: blur(80px);
    background: conic-gradient(
      from 0deg,
      transparent 0deg,
      var(--c-primary) 70deg,
      transparent 140deg,
      var(--c-accent) 230deg,
      transparent 300deg
    );
    animation: sv-spin 46s linear infinite;
  }

  /* moving grid lines */
  .sv-grid {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    opacity: 0.5;
    background-image:
      linear-gradient(color-mix(in srgb, var(--c-on-navy) 7%, transparent) 1px, transparent 1px),
      linear-gradient(90deg, color-mix(in srgb, var(--c-on-navy) 7%, transparent) 1px, transparent 1px);
    background-size: 44px 44px;
    -webkit-mask-image: radial-gradient(ellipse at 75% 50%, #000 10%, transparent 70%);
    mask-image: radial-gradient(ellipse at 75% 50%, #000 10%, transparent 70%);
    animation: sv-grid 14s linear infinite;
  }

  /* services orbit stage: hero ke right side par services hub ke gird ghoomti hain (xl+ screens) */
  .sv-stage {
    position: absolute;
    z-index: 1;
    top: 0;
    bottom: 0;
    right: 0;
    width: min(40%, 32rem);
    /* orbit ka size hero ki height se naapa jata hai (cqh), isliye kabhi bahar nahi nikalta */
    container-type: size;
    pointer-events: none;
  }
  .sv-stage-ring {
    position: absolute;
    left: 50%;
    top: 50%;
    width: calc(var(--rx) * 2);
    height: calc(var(--ry) * 2);
    transform: translate(-50%, -50%);
    border-radius: 50%;
    border: 1px dashed color-mix(in srgb, var(--c-on-navy) 14%, transparent);
  }
  .sv-hub {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 5rem;
    height: 5rem;
    margin: -2.5rem 0 0 -2.5rem;
    border-radius: 9999px;
    background: conic-gradient(from 0deg, var(--c-primary), var(--c-accent), var(--c-primary));
    box-shadow: 0 0 60px 8px color-mix(in srgb, var(--c-primary) 50%, transparent);
    animation: sv-spin 9s linear infinite;
  }
  .sv-hub::before {
    content: '';
    position: absolute;
    inset: 3px;
    border-radius: 9999px;
    background: radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--c-primary) 55%, var(--c-navy)), var(--c-navy) 72%);
  }
  .sv-hub-halo {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 11rem;
    height: 11rem;
    border-radius: 9999px;
    background: radial-gradient(circle, color-mix(in srgb, var(--c-primary) 45%, transparent), transparent 68%);
    animation: sv-pulse 5s ease-in-out infinite;
  }
  .sv-orb-x {
    position: absolute;
    left: 50%;
    top: 50%;
    animation: sv-ox var(--d) cubic-bezier(0.37, 0, 0.63, 1) infinite alternate;
    animation-delay: calc(-1 * var(--ph));
  }
  .sv-orb-y {
    position: absolute;
    left: 0;
    top: 0;
    animation: sv-oy var(--d) cubic-bezier(0.37, 0, 0.63, 1) infinite alternate;
    animation-delay: calc(-1 * var(--ph) - var(--d) / 2);
  }
  .sv-orb-x.is-rev,
  .sv-orb-x.is-rev .sv-orb-y {
    animation-direction: alternate-reverse;
  }
  .sv-orb-pill {
    position: absolute;
    left: 0;
    top: 0;
    transform: translate(-50%, -50%);
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    max-width: 13rem;
    white-space: nowrap;
    border-radius: 9999px;
    padding: 0.4rem 0.9rem;
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--c-on-navy);
    border: 1px solid color-mix(in srgb, var(--tone) 50%, transparent);
    background: color-mix(in srgb, var(--tone) 16%, color-mix(in srgb, var(--c-navy) 72%, transparent));
    box-shadow: 0 0 22px -6px color-mix(in srgb, var(--tone) 70%, transparent);
    -webkit-backdrop-filter: blur(8px);
    backdrop-filter: blur(8px);
  }
  .sv-orb-pill::before {
    content: '';
    flex: none;
    width: 7px;
    height: 7px;
    border-radius: 9999px;
    background: var(--tone);
    box-shadow: 0 0 10px 2px color-mix(in srgb, var(--tone) 75%, transparent);
  }
  .sv-orb-text {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .sv-particle {
    position: absolute;
    z-index: 1;
    width: 4px;
    height: 4px;
    border-radius: 9999px;
    pointer-events: none;
    background: var(--c-on-navy);
    animation: sv-particle var(--sv-dur, 8s) ease-in-out infinite;
    animation-delay: var(--sv-delay, 0s);
  }

  .sv-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .sv-chip-in {
    animation: sv-rise 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) both;
    animation-delay: calc(var(--i, 0) * 100ms + 150ms);
  }
  .sv-blob {
    position: absolute;
    border-radius: 9999px;
    filter: blur(70px);
    animation: sv-drift 24s ease-in-out infinite;
  }
  .sv-dots {
    position: absolute;
    inset: 0;
    opacity: 0.08;
    background-image: radial-gradient(currentColor 1px, transparent 1px);
    background-size: 26px 26px;
    -webkit-mask-image: radial-gradient(ellipse at 50% 35%, #000 25%, transparent 75%);
    mask-image: radial-gradient(ellipse at 50% 35%, #000 25%, transparent 75%);
  }
  .sv-glass {
    border: 1px solid color-mix(in srgb, var(--c-on-navy) 18%, transparent);
    background: color-mix(in srgb, var(--c-on-navy) 8%, transparent);
    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);
  }
  .sv-float {
    animation: sv-float 7s ease-in-out infinite;
    animation-delay: var(--sv-delay, 0s);
  }
  .sv-dot-live {
    position: relative;
    display: inline-block;
    width: 7px;
    height: 7px;
    border-radius: 9999px;
    background: var(--c-accent);
  }
  .sv-dot-live::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 9999px;
    background: var(--c-accent);
    animation: sv-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
  }
  .sv-twinkle {
    animation: sv-twinkle 3.6s ease-in-out infinite;
    animation-delay: var(--sv-delay, 0s);
  }

  /* ---- shine sweep (buttons) ---- */
  .sv-shine {
    position: relative;
    overflow: hidden;
  }
  .sv-shine::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 28%;
    transform: translateX(-160%) skewX(-20deg);
    background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--c-on-navy) 55%, transparent), transparent);
    pointer-events: none;
  }
  .sv-shine:hover::after,
  .sv-shine:focus-visible::after {
    animation: sv-shine 0.9s ease;
  }

  /* ---- featured card: animated gradient border ---- */
  .sv-gborder {
    padding: 1.5px;
    border-radius: 1rem;
    background: linear-gradient(120deg, var(--c-primary), var(--c-accent), var(--c-primary), var(--c-accent));
    background-size: 300% 300%;
    animation: sv-gradient 12s ease-in-out infinite;
    box-shadow: 0 30px 60px -28px color-mix(in srgb, var(--c-navy) 70%, transparent);
  }
  .sv-gborder-inner {
    overflow: hidden;
    border-radius: calc(1rem - 1.5px);
    background: var(--c-card);
  }
  .sv-visual {
    position: relative;
    isolation: isolate;
    overflow: hidden;
    color: var(--c-on-navy);
    background: var(--c-navy);
  }
  .sv-ring {
    border: 1.5px dashed color-mix(in srgb, var(--c-on-navy) 38%, transparent);
    border-radius: 9999px;
    animation: sv-spin 30s linear infinite;
  }
  .sv-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    border-radius: 9999px;
    padding: 0.3rem 0.85rem;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--c-primary);
    background: linear-gradient(90deg, var(--c-primary-soft), color-mix(in srgb, var(--c-accent) 18%, var(--c-primary-soft)));
    border: 1px solid color-mix(in srgb, var(--c-primary) 22%, transparent);
  }

  /* bara outlined number (featured panel + cards) */
  .sv-num-ghost {
    font-family: var(--f-heading);
    font-weight: 600;
    line-height: 1;
    color: transparent;
    -webkit-text-stroke: 1.5px color-mix(in srgb, var(--c-primary) 28%, transparent);
    user-select: none;
  }
  .sv-num-ghost-light {
    font-family: var(--f-heading);
    font-weight: 600;
    line-height: 1;
    color: transparent;
    -webkit-text-stroke: 1.5px color-mix(in srgb, var(--c-on-navy) 32%, transparent);
    user-select: none;
  }

  /* ---- service cards ---- */
  .sv-card {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    border-radius: 0.75rem;
    border: 1px solid var(--c-line);
    background: var(--c-card);
    box-shadow: 0 1px 2px color-mix(in srgb, var(--c-navy) 8%, transparent);
    transition:
      transform 0.35s cubic-bezier(0.2, 0.7, 0.2, 1),
      border-color 0.3s,
      box-shadow 0.35s;
  }
  .sv-card::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 1;
    opacity: 0;
    pointer-events: none;
    background: radial-gradient(
      20rem circle at var(--mx, 50%) var(--my, 0%),
      color-mix(in srgb, var(--c-primary) 16%, transparent),
      transparent 65%
    );
    transition: opacity 0.35s;
  }
  .sv-card::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 2;
    height: 3px;
    transform: scaleX(0);
    transform-origin: left;
    background: linear-gradient(90deg, var(--c-primary), var(--c-accent));
    transition: transform 0.45s cubic-bezier(0.2, 0.7, 0.2, 1);
  }
  .sv-card:focus-visible,
  .sv-card:hover {
    border-color: color-mix(in srgb, var(--c-primary) 55%, var(--c-line));
    box-shadow: 0 26px 50px -24px color-mix(in srgb, var(--c-primary) 55%, transparent);
  }
  .sv-card:hover {
    transform: translateY(-6px);
  }
  .sv-card:hover::before,
  .sv-card:focus-visible::before {
    opacity: 1;
  }
  .sv-card:hover::after,
  .sv-card:focus-visible::after {
    transform: scaleX(1);
  }

  /* card media header (image ya navy pattern) */
  .sv-card-media {
    position: relative;
    isolation: isolate;
    overflow: hidden;
    aspect-ratio: 16 / 8;
    color: var(--c-on-navy);
    background: var(--c-navy);
  }
  .sv-card-media > img {
    position: absolute;
    inset: 0;
    z-index: -1;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.7s cubic-bezier(0.2, 0.7, 0.2, 1);
  }
  .sv-card:hover .sv-card-media > img {
    transform: scale(1.07);
  }
  .sv-card-media::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(180deg, transparent 35%, color-mix(in srgb, var(--c-navy) 70%, transparent));
  }
  .sv-card-media .sv-blob {
    animation-duration: 28s;
  }
  .sv-card-tag {
    position: absolute;
    top: 0.75rem;
    left: 0.75rem;
    z-index: 2;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    border-radius: 9999px;
    padding: 0.25rem 0.7rem;
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--c-on-navy);
  }
  .sv-card-ghost {
    position: absolute;
    right: 1rem;
    bottom: -0.4rem;
    z-index: 1;
    font-size: 4.75rem;
    transition: transform 0.5s cubic-bezier(0.2, 0.7, 0.2, 1);
  }
  .sv-card:hover .sv-card-ghost {
    transform: translateY(-6px) scale(1.04);
  }
  .sv-card-body {
    position: relative;
    z-index: 1;
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 1.25rem;
  }
  @media (min-width: 640px) {
    .sv-card-body {
      padding: 1.5rem;
    }
  }

  /* gradient icon tile (IconTile variant="gradient") */
  .sv-icon-gradient {
    color: var(--c-on-primary);
    background: linear-gradient(135deg, var(--c-primary), var(--sv-icon-end));
    box-shadow: 0 10px 22px -8px color-mix(in srgb, var(--c-primary) 70%, transparent);
    transition: transform 0.4s cubic-bezier(0.2, 0.7, 0.2, 1);
  }
  .group:hover .sv-icon-gradient {
    transform: rotate(-7deg) scale(1.1);
  }
  .sv-icon-glass {
    color: var(--c-on-navy);
    border: 1px solid color-mix(in srgb, var(--c-on-navy) 28%, transparent);
    background: color-mix(in srgb, var(--c-on-navy) 12%, transparent);
    -webkit-backdrop-filter: blur(8px);
    backdrop-filter: blur(8px);
  }

  /* ---- process steps ---- */
  .sv-step {
    position: relative;
    overflow: hidden;
    border-radius: 0.75rem;
    border: 1px solid var(--c-line);
    background: var(--c-card);
    transition: transform 0.35s cubic-bezier(0.2, 0.7, 0.2, 1), border-color 0.3s, box-shadow 0.35s;
  }
  .sv-step:hover {
    transform: translateY(-5px);
    border-color: color-mix(in srgb, var(--c-primary) 55%, var(--c-line));
    box-shadow: 0 24px 48px -26px color-mix(in srgb, var(--c-primary) 55%, transparent);
  }
  .sv-step-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    transform: scaleX(0);
    transform-origin: left;
    background: linear-gradient(90deg, var(--c-primary), var(--c-accent));
  }
  .is-in .sv-step-bar {
    animation: sv-draw 1s cubic-bezier(0.2, 0.7, 0.2, 1) calc(var(--sv-delay, 0ms) + 250ms) forwards;
  }
  .sv-step-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.75rem;
    height: 2.75rem;
    border-radius: 9999px;
    font-family: var(--f-heading);
    font-size: 1rem;
    font-weight: 600;
    color: var(--c-on-primary);
    background: linear-gradient(135deg, var(--c-primary), var(--sv-icon-end));
    box-shadow:
      0 0 0 6px color-mix(in srgb, var(--c-primary) 14%, transparent),
      0 10px 20px -8px color-mix(in srgb, var(--c-primary) 70%, transparent);
  }

  /* ---- CTA band ---- */
  .sv-cta {
    position: relative;
    isolation: isolate;
    overflow: hidden;
    border-radius: 1rem;
    color: var(--c-on-navy);
    background: var(--c-navy);
    box-shadow: 0 40px 80px -36px color-mix(in srgb, var(--c-navy) 85%, transparent);
  }
  .sv-btn-light {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    height: 2.75rem;
    padding: 0 1.375rem;
    border-radius: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
    color: var(--c-navy);
    background: var(--c-on-navy);
    box-shadow: 0 14px 30px -12px color-mix(in srgb, var(--c-on-navy) 55%, transparent);
    transition: transform 0.25s, background-color 0.25s, box-shadow 0.25s;
  }
  .sv-btn-light:hover {
    transform: translateY(-2px);
    background: color-mix(in srgb, var(--c-accent) 70%, var(--c-on-navy));
  }
  .sv-btn-glass {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    height: 2.75rem;
    padding: 0 1.375rem;
    border-radius: 0.75rem;
    font-weight: 500;
    white-space: nowrap;
    color: var(--c-on-navy);
    border: 1px solid color-mix(in srgb, var(--c-on-navy) 32%, transparent);
    background: color-mix(in srgb, var(--c-on-navy) 8%, transparent);
    transition: transform 0.25s, border-color 0.25s, background-color 0.25s;
  }
  .sv-btn-glass:hover {
    transform: translateY(-2px);
    border-color: var(--c-accent);
    background: color-mix(in srgb, var(--c-on-navy) 14%, transparent);
  }
}

/* Motion band karne walon ke liye: sab animation off, content seedha dikhe */
@media (prefers-reduced-motion: reduce) {
  .sv-reveal {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
  .sv-blob,
  .sv-sheen,
  .sv-chip-in,
  .sv-float,
  .sv-gborder,
  .sv-ring,
  .sv-cta,
  .sv-twinkle,
  .sv-aurora,
  .sv-grid,
  .sv-hub,
  .sv-hub-halo,
  .sv-particle,
  .sv-hero-wrap :is(h1, h2),
  .sv-dot-live::after {
    animation: none !important;
  }
  .sv-hero-wrap :is(h1, h2) {
    background-position: 0 0 !important;
  }
  /* orbit ruk jaye to pills ellipse par barabar faslay se tike rahen */
  .sv-orb-x,
  .sv-orb-y {
    animation: none !important;
  }
  .sv-orb-x {
    transform: translateX(calc(var(--rx) * cos(var(--a))));
  }
  .sv-orb-y {
    transform: translateY(calc(var(--ry) * sin(var(--a))));
  }
  .sv-step-bar {
    transform: scaleX(1) !important;
    animation: none !important;
  }
  .sv-card,
  .sv-card-media > img,
  .sv-card-ghost,
  .sv-step,
  .sv-btn-light,
  .sv-btn-glass {
    transition: none !important;
  }
  .sv-card:hover,
  .sv-step:hover,
  .sv-btn-light:hover,
  .sv-btn-glass:hover {
    transform: none !important;
  }
}
`

const pad = (n) => String(n).padStart(2, '0')

// Contact page par jao; service ka naam subject ke taur par (contact form baad mein prefill kar sakta hai)
const toContact = (slug, subject) => ({
  pathname: paths.siteContact(slug),
  search: subject ? `?subject=${encodeURIComponent(subject)}` : '',
})

// Admin ne "featured" mark kiya ho to wo; warna 3+ services par pehli ko highlight (design fallback)
function pickFeatured(services) {
  return services.find((s) => s.is_featured) ?? (services.length >= 3 ? services[0] : null)
}

// ---------- 1. Hero ----------

const chipClass = 'border-on-navy/20 bg-on-navy/10 text-on-navy/85 inline-flex items-center rounded-full border'
const chipStyle = { gap: '0.375rem', padding: '0.375rem 0.75rem', fontSize: '0.75rem' }
const chipLink = `${chipClass} transition-colors hover:border-accent hover:text-accent`

// Hero ke floating particles: [left, top, delay(s), duration(s)]
const PARTICLES = [
  ['8%', '22%', 0, 9],
  ['22%', '70%', 1.4, 11],
  ['41%', '18%', 2.6, 8],
  ['58%', '78%', 0.8, 10],
  ['72%', '14%', 3.2, 12],
  ['90%', '66%', 2, 9],
]

// Har service ka apna orbit; itne orbits se zyada ho to services orbits share karti hain
const MAX_ORBITS = 5
const TONES = ['var(--c-primary)', 'var(--c-accent)', 'var(--c-on-navy)']

function Hero({ services, stepCount, showProcess }) {
  const { slug, pageIntros } = usePublicSite()
  const intro = pageIntros?.services
  const title = intro?.title || 'Services'
  const subtitle = intro?.subtitle || 'Ways we can work together, from first conversation to final delivery.'

  const pills = [
    services.length > 0 && `${services.length} service ${services.length === 1 ? 'area' : 'areas'}`,
    showProcess && stepCount > 0 && `${stepCount}-step process`,
  ].filter(Boolean)

  const links = 1 + (showProcess ? 1 : 0)

  // jitni services utne orbits (max 5). r = radius (hero height ka %), d = speed (zyada = slow)
  const orbiting = services.slice(0, 12)
  const ringCount = Math.min(orbiting.length, MAX_ORBITS)
  const rings = Array.from({ length: ringCount }, (_, r) => ({
    r: ringCount === 1 ? 31 : 20 + (22 * r) / (ringCount - 1),
    d: 8 + r * 3,
    items: [],
  }))
  orbiting.forEach((s, i) => rings[i % ringCount].items.push(s))

  return (
    <div className="sv-hero-wrap">
      <PageHero eyebrow="Work with me" title={title} subtitle={subtitle}>
        <ul className="sv-chips">
          {pills.map((text, i) => (
            <li key={text} className={`sv-chip-in ${chipClass}`} style={{ ...chipStyle, '--i': i }}>
              <Sparkles className="text-accent" width={13} height={13} aria-hidden="true" />
              {text}
            </li>
          ))}
          <li className="sv-chip-in" style={{ '--i': pills.length }}>
            <Link to={toContact(slug)} className={chipLink} style={chipStyle}>
              Get in touch
              <ArrowRight className="text-accent" width={13} height={13} aria-hidden="true" />
            </Link>
          </li>
          {showProcess && (
            <li className="sv-chip-in" style={{ '--i': pills.length + links - 1 }}>
              <a href="#process" className={chipLink} style={chipStyle}>
                See how I work
                <ArrowUpRight className="text-accent" width={13} height={13} aria-hidden="true" />
              </a>
            </li>
          )}
        </ul>
      </PageHero>

      {/* decoration: overlay, clicks nahi rokta */}
      <span aria-hidden="true" className="sv-aurora" />
      <span aria-hidden="true" className="sv-grid" />
      <span
        aria-hidden="true"
        className="sv-blob bg-primary"
        style={{ top: '-8rem', right: '-4rem', width: '22rem', height: '22rem', opacity: 0.38 }}
      />
      <span
        aria-hidden="true"
        className="sv-blob bg-accent"
        style={{ bottom: '-9rem', left: '-3rem', width: '18rem', height: '18rem', opacity: 0.26, animationDuration: '30s' }}
      />
      <span aria-hidden="true" className="sv-dots" />

      {/* services orbit: hub ke gird ghoomti hain (sirf xl+ screens par) */}
      <div aria-hidden="true" className="sv-stage hidden min-[1100px]:block">
        {rings.map((o, r) => (
          <span key={r} className="sv-stage-ring" style={{ '--rx': `${o.r}cqh`, '--ry': `${o.r}cqh` }} />
        ))}
        <span className="sv-hub-halo" />
        <span className="sv-hub" />
        {rings.flatMap((o, r) =>
          o.items.map((s, k) => {
            const frac = (k / o.items.length + r * 0.17) % 1
            return (
              <span
                key={s.id ?? `${r}-${k}`}
                className={`sv-orb-x${r % 2 === 1 ? ' is-rev' : ''}`}
                style={{
                  '--rx': `${o.r}cqh`,
                  '--ry': `${o.r}cqh`,
                  '--d': `${o.d}s`,
                  '--ph': `${(frac * 2 * o.d).toFixed(2)}s`,
                  '--a': `${Math.round(frac * 360)}deg`,
                  '--tone': TONES[(r + k) % TONES.length],
                }}
              >
                <span className="sv-orb-y">
                  <span className="sv-orb-pill">
                    <span className="sv-orb-text">{s.title}</span>
                  </span>
                </span>
              </span>
            )
          }),
        )}
      </div>

      {PARTICLES.map(([left, top, delay, dur], i) => (
        <span
          key={i}
          aria-hidden="true"
          className="sv-particle"
          style={{ left, top, '--sv-delay': `${delay}s`, '--sv-dur': `${dur}s` }}
        />
      ))}

      <span aria-hidden="true" className="sv-sheen" />
    </div>
  )
}

// ---------- 2. Featured service ----------

function FeaturedService({ service, slug }) {
  return (
    <Reveal className="sv-gborder">
      <article
        className="sv-gborder-inner"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 22rem), 1fr))' }}
      >
        {/* Visual panel (icon nahi, sirf glow + bara number) */}
        <div className="sv-visual flex items-center justify-center" style={{ minHeight: '15rem' }}>
          {service.image && (
            <img
              src={service.image}
              alt=""
              loading="lazy"
              className="absolute inset-0 -z-10 size-full object-cover opacity-70 mix-blend-luminosity"
            />
          )}
          <span
            aria-hidden="true"
            className="sv-blob bg-primary"
            style={{ top: '-4rem', right: '-4rem', width: '16rem', height: '16rem', opacity: 0.38 }}
          />
          <span
            aria-hidden="true"
            className="sv-blob bg-accent"
            style={{ bottom: '-5rem', left: '-3rem', width: '14rem', height: '14rem', opacity: 0.26, animationDuration: '28s' }}
          />
          <span aria-hidden="true" className="sv-dots" />

          {!service.image && (
            <span
              aria-hidden="true"
              className="sv-num-ghost-light relative"
              style={{ fontSize: 'clamp(6rem, 14vw, 9rem)' }}
            >
              01
            </span>
          )}

          <span className="sv-glass absolute bottom-4 left-4 rounded-full px-3 py-1 text-xs font-semibold tracking-widest text-on-navy uppercase">
            Primary service
          </span>
        </div>

        {/* Content panel */}
        <div className="flex flex-col justify-center p-6 sm:p-8">
          <span className="sv-badge self-start">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Featured service
          </span>
          <h2 className="mt-4 text-2xl sm:text-3xl">{service.title}</h2>
          {service.short_description && (
            <p className="mt-3 line-clamp-[8] text-justify [hyphens:auto] [text-align-last:left] leading-relaxed text-body">{service.short_description}</p>
          )}
          <span className="mt-5 block h-px w-full bg-linear-to-r from-primary/40 via-accent/40 to-transparent" aria-hidden="true" />
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              as={Link}
              to={toContact(slug, service.title)}
              className="sv-shine group shadow-lg shadow-primary/30"
            >
              Enquire about this service
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </article>
    </Reveal>
  )
}

// ---------- 3. Service cards ----------

// Mouse ke saath chalne wali halki blue roshni (CSS variables --mx / --my)
function onSpotlightMove(event) {
  const node = event.currentTarget
  const rect = node.getBoundingClientRect()
  node.style.setProperty('--mx', `${event.clientX - rect.left}px`)
  node.style.setProperty('--my', `${event.clientY - rect.top}px`)
}

function ServiceTile({ service, index, slug }) {
  return (
    <Reveal delay={(index % 3) * 90} style={{ height: '100%' }}>
      <Link
        to={toContact(slug, service.title)}
        onPointerMove={onSpotlightMove}
        className="sv-card group"
        aria-label={`${service.title}: enquire about this service`}
      >
        {/* media header: image ya navy pattern */}
        <div className="sv-card-media">
          {service.image ? (
            <img src={service.image} alt="" loading="lazy" />
          ) : (
            <>
              <span
                aria-hidden="true"
                className="sv-blob bg-primary"
                style={{ top: '-4rem', right: '-3rem', width: '11rem', height: '11rem', opacity: 0.4 }}
              />
              <span
                aria-hidden="true"
                className="sv-blob bg-accent"
                style={{ bottom: '-5rem', left: '-2rem', width: '10rem', height: '10rem', opacity: 0.26 }}
              />
              <span aria-hidden="true" className="sv-dots" />
              <span aria-hidden="true" className="sv-card-ghost sv-num-ghost-light">
                {pad(index + 1)}
              </span>
            </>
          )}
          <span className="sv-card-tag sv-glass">
            <span className="sv-dot-live" aria-hidden="true" />
            Service {pad(index + 1)}
          </span>
        </div>

        <div className="sv-card-body">
          <h3 className="text-lg sm:text-xl">{service.title}</h3>
          {service.short_description && (
            <p className="mt-3 line-clamp-[6] flex-1 text-justify [hyphens:auto] [text-align-last:left] leading-relaxed text-body" title={service.short_description}>
              {service.short_description}
            </p>
          )}

          <div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-sm font-semibold text-primary">
            <span>Discuss this service</span>
            <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary-soft transition-colors group-hover:bg-primary group-hover:text-on-primary">
              <ArrowRight
                className="size-4 transition-transform duration-300 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </span>
          </div>
        </div>
      </Link>
    </Reveal>
  )
}

function ServicesLoading() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-72 rounded-2xl" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 19rem), 1fr))', gap: '1.5rem' }}>
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

// ---------- 4. How I Work ----------

function HowIWork({ steps }) {
  return (
    <Section tone="blue-tint" id="process" className="relative scroll-mt-16 overflow-hidden">
      {/* soft glow, sirf decoration */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <span
          className="sv-blob bg-primary"
          style={{ top: '-6rem', right: '-6rem', width: '20rem', height: '20rem', opacity: 0.12 }}
        />
        <span
          className="sv-blob bg-accent"
          style={{ bottom: '-8rem', left: '-5rem', width: '20rem', height: '20rem', opacity: 0.1, animationDuration: '30s' }}
        />
      </div>

      <div className="relative">
        <Reveal>
          <SectionHeading
            align="center"
            eyebrow="Process"
            title="How I Work"
            description="A clear, collaborative path from the first conversation to the final hand-over."
          />
        </Reveal>

        <ol
          className="list-none"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 14.5rem), 1fr))',
            gap: '1.25rem',
            margin: 0,
            padding: 0,
          }}
        >
          {steps.map((step, i) => (
            <Reveal as="li" key={step.id ?? i} delay={i * 110} style={{ height: '100%' }}>
              <div className="sv-step h-full p-5 sm:p-6">
                <span className="sv-step-bar" aria-hidden="true" />
                <div className="relative">
                  <span className="sv-step-num" aria-hidden="true">
                    {pad(i + 1)}
                  </span>
                  <h3 className="mt-4 text-lg sm:text-xl">
                    <span className="sr-only">Step {i + 1}: </span>
                    {step.title}
                  </h3>
                  {step.description && (
                    <p
                      className="mt-2 line-clamp-[8] text-justify [hyphens:auto] [text-align-last:left] leading-relaxed text-body"
                      title={step.description}
                    >
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </Section>
  )
}

// ---------- 5. Contact CTA band ----------

function ContactCta() {
  const { slug, contact } = usePublicSite()
  // WhatsApp: contact.whatsapp (ya phone), sirf digits country code ke saath (Footer jaisa)
  const waDigits = String(contact?.whatsapp || contact?.phone || '').replace(/\D/g, '')
  const hasChips = Boolean(contact?.email || contact?.phone)

  return (
    <Section tone="background" id="get-in-touch" className="scroll-mt-16">
      <Reveal className="sv-cta">
        {/* decoration */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <span
            className="sv-blob bg-primary"
            style={{ top: '-7rem', left: '-5rem', width: '24rem', height: '24rem', opacity: 0.38 }}
          />
          <span
            className="sv-blob bg-accent"
            style={{ bottom: '-9rem', right: '-4rem', width: '22rem', height: '22rem', opacity: 0.26, animationDuration: '29s' }}
          />
          <span className="sv-dots" />
          <Sparkles className="sv-twinkle absolute top-8 right-10 size-6 text-accent" style={{ '--sv-delay': '0s' }} />
          <Sparkles className="sv-twinkle absolute bottom-10 left-12 size-4 text-accent" style={{ '--sv-delay': '1.2s' }} />
          <Sparkles className="sv-twinkle absolute top-1/2 left-6 hidden size-3 text-on-navy sm:block" style={{ '--sv-delay': '2.1s' }} />
        </div>

        <div className="relative mx-auto max-w-2xl px-6 py-10 text-center sm:px-10 sm:py-14">
          <p className="sv-glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold tracking-widest text-accent uppercase">
            <span className="sv-dot-live" aria-hidden="true" />
            Direct inquiries welcome
          </p>

          <h2 className="mt-5 text-2xl text-on-navy sm:text-4xl">Let&rsquo;s work together</h2>
          <p className="mx-auto mt-3 max-w-xl leading-relaxed text-on-navy/80 sm:text-lg">
            Have a project, a question or an idea? Tell me a little about it and we will find the right way to work
            together.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Link to={toContact(slug)} className="sv-btn-light sv-shine group">
              Contact me
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            {waDigits && (
              <a href={`https://wa.me/${waDigits}`} target="_blank" rel="noopener noreferrer" className="sv-btn-glass">
                <MessageCircle className="size-4 text-accent" aria-hidden="true" />
                Chat on WhatsApp
              </a>
            )}
          </div>

          {hasChips && (
            <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-on-navy/80">
              {contact.email && (
                <li>
                  <a
                    href={`mailto:${contact.email}`}
                    className="inline-flex items-center gap-2 transition-colors hover:text-accent"
                  >
                    <Mail className="size-4 text-accent" aria-hidden="true" />
                    <span className="break-all">{contact.email}</span>
                  </a>
                </li>
              )}
              {contact.phone && (
                <li>
                  <a
                    href={`tel:${String(contact.phone).replace(/[^\d+]/g, '')}`}
                    className="inline-flex items-center gap-2 transition-colors hover:text-accent"
                  >
                    <Phone className="size-4 text-accent" aria-hidden="true" />
                    {contact.phone}
                  </a>
                </li>
              )}
            </ul>
          )}
        </div>
      </Reveal>
    </Section>
  )
}

// ---------- Page ----------

export function ServicesPage() {
  const { slug, vis, processSteps } = usePublicSite()
  const query = useServices(slug)

  // is_visible=false wali services public par nahi aati
  const services = useMemo(() => (query.data ?? []).filter((s) => s.is_visible !== false), [query.data])
  const featured = pickFeatured(services)
  const cards = featured ? services.filter((s) => s.id !== featured.id) : services

  const showProcess = vis.isVisible('services', 'how_i_work', processSteps.length > 0)
  const showCta = vis.isEnabled('services', 'contact_cta')

  return (
    <>
      <style>{SERVICES_CSS}</style>
      <Hero services={services} stepCount={processSteps.length} showProcess={showProcess} />

      {/* Featured + cards: hero ke neeche, baqi pages jaisi spacing */}
      <div className="bg-background">
        {query.isPending && (
          <Container className="py-16 sm:py-20">
            <ServicesLoading />
          </Container>
        )}

        {query.isError && (
          <Container className="py-16 sm:py-20">
            <ErrorState
              title="Could not load services"
              message={query.error?.message}
              onRetry={() => query.refetch()}
            />
          </Container>
        )}

        {query.isSuccess && services.length === 0 && (
          <Container className="py-16 sm:py-20">
            <EmptyState
              icon={Sparkles}
              title="Services are coming soon"
              description="Details of what is on offer will appear here. In the meantime, feel free to get in touch."
              action={
                <Button as={Link} to={toContact(slug)}>
                  Get in touch
                </Button>
              }
            />
          </Container>
        )}

        {featured && (
          <Container className="pt-10 sm:pt-12">
            <FeaturedService service={featured} slug={slug} />
          </Container>
        )}

        {cards.length > 0 && (
          <Section tone="background">
            <Reveal>
              <SectionHeading
                eyebrow="What I offer"
                title="Services & Engagements"
                description="Choose the kind of support that fits your goals. Every engagement starts with a conversation."
              />
            </Reveal>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 19rem), 1fr))',
                gap: '1.5rem',
              }}
            >
              {cards.map((service, i) => (
                <ServiceTile key={service.id} service={service} index={i} slug={slug} />
              ))}
            </div>
          </Section>
        )}
      </div>

      {showProcess && <HowIWork steps={processSteps} />}
      {showCta && <ContactCta />}
    </>
  )
}