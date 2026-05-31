/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * PreIntent Hackathon Deck Generator
 * Run: npm run build:deck
 * Output: outputs/PREINTENT_Hackathon_Deck.pptx
 */

const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");

const {
  FaSearch,
  FaGavel,
  FaComments,
  FaBolt,
  FaFileAlt,
  FaDatabase,
  FaMicrophone,
  FaCogs,
  FaCheckCircle,
  FaTimesCircle,
  FaChartLine,
  FaUsers,
  FaLightbulb,
  FaShieldAlt,
  FaRocket,
  FaPlay,
} = require("react-icons/fa");

async function iconPng(IconComp, color, size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComp, { color, size: String(size) }),
  );
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

// Matches PreIntent app design tokens (premium-demo-data.ts)
const C = {
  bg: "07090F",
  surface: "0C1018",
  card: "111820",
  cardLt: "0F161F",
  border: "18232F",
  blue: "2070FF",
  blueLt: "60A5FA",
  void: "FF5A52",
  comp: "F0A000",
  pain: "24C038",
  conv: "9060FF",
  orange: "FF8800",
  white: "DDEEFf",
  silver: "C2D0DE",
  dim: "4A6070",
  ink: "243040",
};

const TOTAL_SLIDES = 12;

async function build() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.title = "PreIntent — GTM Intelligence Platform";
  pres.author = "PreIntent Team";

  const icSearch = await iconPng(FaSearch, "#" + C.void, 256);
  const icGavel = await iconPng(FaGavel, "#" + C.comp, 256);
  const icComments = await iconPng(FaComments, "#" + C.pain, 256);
  const icBolt = await iconPng(FaBolt, "#" + C.conv, 256);
  const icFile = await iconPng(FaFileAlt, "#" + C.blueLt, 256);
  const icDB = await iconPng(FaDatabase, "#" + C.conv, 256);
  const icMic = await iconPng(FaMicrophone, "#" + C.comp, 256);
  const icCogs = await iconPng(FaCogs, "#" + C.silver, 256);
  const icCheck = await iconPng(FaCheckCircle, "#" + C.pain, 256);
  const icX = await iconPng(FaTimesCircle, "#" + C.void, 256);
  const icChart = await iconPng(FaChartLine, "#" + C.blue, 256);
  const icUsers = await iconPng(FaUsers, "#" + C.pain, 256);
  const icIdea = await iconPng(FaLightbulb, "#" + C.comp, 256);
  const icShield = await iconPng(FaShieldAlt, "#" + C.void, 256);
  const icRocket = await iconPng(FaRocket, "#" + C.conv, 256);
  const icPlay = await iconPng(FaPlay, "#" + C.pain, 256);

  function sNum(s, n) {
    s.addText(`${n} / ${TOTAL_SLIDES}`, {
      x: 9.1,
      y: 5.38,
      w: 0.72,
      h: 0.16,
      fontSize: 7,
      color: C.dim,
      align: "right",
      margin: 0,
    });
  }

  function card(s, x, y, w, h, accentColor, fillColor) {
    s.addShape(pres.ShapeType.rect, {
      x,
      y,
      w,
      h,
      fill: { color: fillColor || C.card },
      line: { color: accentColor || C.border, width: 0.6 },
      shadow: { type: "outer", color: "000000", opacity: 0.25, blur: 8, offset: 2, angle: 135 },
    });
  }

  function accentBar(s, x, y, h, color) {
    s.addShape(pres.ShapeType.rect, {
      x,
      y,
      w: 0.055,
      h,
      fill: { color },
      line: { color, width: 0 },
    });
  }

  function sponsorChip(s, x, y, label, color) {
    s.addShape(pres.ShapeType.roundRect, {
      x,
      y,
      w: 1.15,
      h: 0.22,
      rectRadius: 0.04,
      fill: { color, transparency: 82 },
      line: { color, width: 0.7 },
    });
    s.addText(label, {
      x,
      y,
      w: 1.15,
      h: 0.22,
      fontSize: 7,
      color,
      align: "center",
      valign: "middle",
      bold: true,
      charSpacing: 0.4,
      margin: 0,
    });
  }

  function sponsorRow(s, names, xStart, y) {
    const colorMap = {
      BrightData: C.blue,
      "AI/ML API": C.void,
      Featherless: C.pain,
      Cognee: C.conv,
      Speechmatics: C.comp,
      TriggerWare: C.orange,
    };
    let x = xStart;
    for (const n of names) {
      sponsorChip(s, x, y, n, colorMap[n] || C.silver);
      x += 1.22;
    }
  }

  function eyebrow(s, text, color, y = 0.38) {
    s.addText(text, {
      x: 0.6,
      y,
      w: 8.8,
      h: 0.2,
      fontSize: 7.5,
      color: color || C.blue,
      bold: true,
      charSpacing: 3.5,
      margin: 0,
    });
  }

  function dot(s, x, y, color) {
    s.addShape(pres.ShapeType.ellipse, {
      x,
      y,
      w: 0.1,
      h: 0.1,
      fill: { color },
      line: { color, width: 0 },
    });
  }

  // SLIDE 1 — COVER
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };

    s.addShape(pres.ShapeType.rect, {
      x: 6.2,
      y: 0,
      w: 3.8,
      h: 5.625,
      fill: { color: C.surface },
      line: { color: C.border, width: 0.5 },
    });

    s.addShape(pres.ShapeType.rect, {
      x: 0.55,
      y: 0.95,
      w: 0.05,
      h: 4.0,
      fill: { color: C.conv },
      line: { color: C.conv, width: 0 },
    });

    s.addText("BRIGHT DATA  ·  WEB DATA UNLOCKED  ·  GTM INTELLIGENCE TRACK", {
      x: 0.76,
      y: 0.96,
      w: 5.3,
      h: 0.2,
      fontSize: 6.5,
      color: C.blue,
      bold: true,
      charSpacing: 1.6,
      margin: 0,
    });

    s.addText("PREINTENT", {
      x: 0.72,
      y: 1.32,
      w: 5.4,
      h: 1.2,
      fontSize: 68,
      fontFace: "Cambria",
      color: C.white,
      bold: true,
      charSpacing: 7,
      margin: 0,
    });

    s.addShape(pres.ShapeType.rect, {
      x: 0.76,
      y: 2.62,
      w: 2.8,
      h: 0.03,
      fill: { color: C.border },
      line: { color: C.border, width: 0 },
    });

    s.addText("Three invisible forces.\nOne unfair pipeline advantage.", {
      x: 0.76,
      y: 2.78,
      w: 5.3,
      h: 0.84,
      fontSize: 17,
      fontFace: "Cambria",
      color: C.silver,
      margin: 0,
      lineSpacingMultiple: 1.42,
    });

    s.addText(
      "A live Next.js GTM intelligence platform. RUN FULL SCAN orchestrates Bright Data → AI scoring → convergence → Slack/CRM — surfacing certified buying events with AI Intel Briefs before any intent vendor sees the signal.",
      {
        x: 0.76,
        y: 3.76,
        w: 5.2,
        h: 0.88,
        fontSize: 9.5,
        color: C.dim,
        margin: 0,
        lineSpacingMultiple: 1.62,
      },
    );

    s.addShape(pres.ShapeType.roundRect, {
      x: 0.76,
      y: 4.86,
      w: 2.35,
      h: 0.28,
      rectRadius: 0.05,
      fill: { color: C.orange, transparency: 84 },
      line: { color: C.orange, width: 0.7 },
    });
    s.addText("Track 1  ·  GTM Intelligence", {
      x: 0.76,
      y: 4.86,
      w: 2.35,
      h: 0.28,
      fontSize: 7.5,
      color: C.orange,
      align: "center",
      valign: "middle",
      bold: true,
      margin: 0,
    });

    s.addShape(pres.ShapeType.roundRect, {
      x: 3.2,
      y: 4.86,
      w: 2.05,
      h: 0.28,
      rectRadius: 0.05,
      fill: { color: C.pain, transparency: 88 },
      line: { color: C.pain, width: 0.7 },
    });
    s.addText("Live at /demo", {
      x: 3.2,
      y: 4.86,
      w: 2.05,
      h: 0.28,
      fontSize: 7.5,
      color: C.pain,
      align: "center",
      valign: "middle",
      bold: true,
      margin: 0,
    });

    s.addText("GTM\nINTELLIGENCE\nPLATFORM", {
      x: 6.45,
      y: 0.9,
      w: 3.3,
      h: 1.6,
      fontSize: 22,
      fontFace: "Cambria",
      color: C.white,
      bold: true,
      margin: 0,
      lineSpacingMultiple: 1.18,
    });

    s.addShape(pres.ShapeType.rect, {
      x: 6.45,
      y: 2.62,
      w: 3.1,
      h: 0.03,
      fill: { color: C.border },
      line: { color: C.border, width: 0 },
    });

    [
      { t: "Void Scanner", c: C.void },
      { t: "Compliance Radar", c: C.comp },
      { t: "Pain Listener", c: C.pain },
    ].forEach(({ t, c }, i) => {
      const ey = 2.82 + i * 0.62;
      s.addShape(pres.ShapeType.rect, {
        x: 6.45,
        y: ey + 0.1,
        w: 0.05,
        h: 0.28,
        fill: { color: c },
        line: { color: c, width: 0 },
      });
      s.addText(t, {
        x: 6.6,
        y: ey + 0.06,
        w: 2.9,
        h: 0.36,
        fontSize: 13,
        fontFace: "Cambria",
        color: C.white,
        bold: true,
        margin: 0,
      });
    });

    s.addText("Convergence 33/33/33  →  Intel Brief", {
      x: 6.45,
      y: 4.72,
      w: 3.3,
      h: 0.22,
      fontSize: 8.5,
      color: C.conv,
      bold: true,
      margin: 0,
    });

    sNum(s, 1);
  }

  // SLIDE 2 — THE PROBLEM
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };

    eyebrow(s, "THE PROBLEM");

    s.addText("Sales teams are always the last to know.", {
      x: 0.6,
      y: 0.54,
      w: 9.2,
      h: 0.62,
      fontSize: 30,
      fontFace: "Cambria",
      color: C.white,
      bold: true,
      margin: 0,
    });

    const stats = [
      {
        val: "3+",
        unit: "day lag vs PreIntent",
        body: "Intent vendors detect Brex's Stripe Atlas signal 3 days after PreIntent — quantified in our competitive comparison widget",
        color: C.void,
        icon: icShield,
      },
      {
        val: "$50K",
        unit: "ACV per deal",
        body: "One Brex-scale convergence alert pays for 50 months of PreIntent at $1,000/mo — ROI calculator built into the live demo",
        color: C.comp,
        icon: icChart,
      },
      {
        val: "3",
        unit: "signal layers",
        body: "Competitor retreats, regulatory shockwaves, and community pain — no existing tool monitors all three simultaneously",
        color: C.pain,
        icon: icUsers,
      },
    ];

    const CARD_Y = 1.34;
    const CARD_H = 3.94;
    const CARD_W = 3.0;
    const GAP = 0.085;

    stats.forEach(({ val, unit, body, color, icon }, i) => {
      const x = 0.45 + i * (CARD_W + GAP);
      card(s, x, CARD_Y, CARD_W, CARD_H, color);
      s.addShape(pres.ShapeType.rect, {
        x,
        y: CARD_Y,
        w: CARD_W,
        h: 0.42,
        fill: { color, transparency: 80 },
        line: { color, width: 0 },
      });
      s.addImage({ data: icon, x: x + 0.14, y: CARD_Y + 0.1, w: 0.24, h: 0.24 });
      s.addText(val, {
        x: x + 0.18,
        y: CARD_Y + 0.56,
        w: 2.66,
        h: 1.12,
        fontSize: 54,
        fontFace: "Cambria",
        color,
        bold: true,
        margin: 0,
      });
      s.addText(unit, {
        x: x + 0.18,
        y: CARD_Y + 1.72,
        w: 2.66,
        h: 0.26,
        fontSize: 10,
        color,
        bold: true,
        charSpacing: 1.2,
        margin: 0,
      });
      s.addShape(pres.ShapeType.rect, {
        x: x + 0.18,
        y: CARD_Y + 2.1,
        w: 2.48,
        h: 0.03,
        fill: { color: C.border },
        line: { color: C.border, width: 0 },
      });
      s.addText(body, {
        x: x + 0.18,
        y: CARD_Y + 2.22,
        w: 2.66,
        h: 1.56,
        fontSize: 9.5,
        color: C.silver,
        margin: 0,
        lineSpacingMultiple: 1.5,
      });
    });

    sNum(s, 2);
  }

  // SLIDE 3 — THE GAP
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };

    eyebrow(s, "THE GAP");
    s.addText("Every intent platform watches the same surface.", {
      x: 0.6,
      y: 0.6,
      w: 9.2,
      h: 0.48,
      fontSize: 28,
      fontFace: "Cambria",
      color: C.white,
      bold: true,
      margin: 0,
    });

    card(s, 0.45, 1.28, 4.35, 0.38, C.void);
    s.addShape(pres.ShapeType.rect, {
      x: 0.45,
      y: 1.28,
      w: 4.35,
      h: 0.38,
      fill: { color: "280A0A" },
      line: { color: C.void, width: 0 },
    });
    s.addImage({ data: icX, x: 0.58, y: 1.34, w: 0.24, h: 0.24 });
    s.addText("Intent Platforms Today", {
      x: 0.9,
      y: 1.3,
      w: 3.75,
      h: 0.32,
      fontSize: 11,
      fontFace: "Cambria",
      color: C.void,
      bold: true,
      margin: 0,
    });

    [
      { t: "Content consumption signals", d: "Everyone gets the same list, at the same time. Zero competitive edge." },
      { t: "Review site visit tracking", d: "Buyer is already mid-decision. You're arriving after the shortlist is set." },
      { t: "Ad click & intent keywords", d: "Surface-level signals stripped of strategic context or urgency." },
      { t: "Demo request / form fills", d: "Downstream indicators — the decision to evaluate was made weeks ago." },
    ].forEach(({ t, d }, i) => {
      const y = 1.82 + i * 0.82;
      card(s, 0.45, y, 4.35, 0.72, C.border);
      s.addImage({ data: icX, x: 0.6, y: y + 0.12, w: 0.2, h: 0.2 });
      s.addText(t, {
        x: 0.9,
        y: y + 0.08,
        w: 3.72,
        h: 0.24,
        fontSize: 10.5,
        fontFace: "Cambria",
        color: C.white,
        bold: true,
        margin: 0,
      });
      s.addText(d, { x: 0.9, y: y + 0.36, w: 3.72, h: 0.28, fontSize: 8.5, color: C.silver, margin: 0 });
    });
    s.addText("Same data. Same timing. No edge.", {
      x: 0.6,
      y: 5.14,
      w: 4.1,
      h: 0.2,
      fontSize: 9,
      color: C.void,
      italic: true,
      margin: 0,
    });

    s.addShape(pres.ShapeType.ellipse, {
      x: 4.58,
      y: 2.8,
      w: 0.78,
      h: 0.44,
      fill: { color: C.cardLt },
      line: { color: C.border, width: 0.6 },
    });
    s.addText("VS", {
      x: 4.58,
      y: 2.8,
      w: 0.78,
      h: 0.44,
      fontSize: 11,
      fontFace: "Cambria",
      color: C.dim,
      bold: true,
      align: "center",
      valign: "middle",
      margin: 0,
    });

    card(s, 5.18, 1.28, 4.35, 0.38, C.pain);
    s.addShape(pres.ShapeType.rect, {
      x: 5.18,
      y: 1.28,
      w: 4.35,
      h: 0.38,
      fill: { color: "0A2614" },
      line: { color: C.pain, width: 0 },
    });
    s.addImage({ data: icCheck, x: 5.3, y: 1.34, w: 0.24, h: 0.24 });
    s.addText("PreIntent — What Nobody Else Sees", {
      x: 5.62,
      y: 1.3,
      w: 3.75,
      h: 0.32,
      fontSize: 11,
      fontFace: "Cambria",
      color: C.pain,
      bold: true,
      margin: 0,
    });

    [
      {
        t: "Competitor page deletions",
        d: "Stripe Atlas SMB fast-track removed — 340+ Brex subsidiaries orphaned with no migration path.",
      },
      {
        t: "Regulatory publications",
        d: "PCI-DSS 4.0 deadline in 89 days — instant in-market list with acknowledgment gap scoring.",
      },
      {
        t: "Community frustration signals",
        d: "Brex Head of Treasury on r/fintech: 'evaluating alternatives' — pre-intent, unfiltered.",
      },
      {
        t: "Podcast & audio transcripts",
        d: "Speechmatics caught Brex VP Finance on Payments Unfiltered Ep.127 — 2 weeks before Reddit.",
      },
    ].forEach(({ t, d }, i) => {
      const y = 1.82 + i * 0.82;
      card(s, 5.18, y, 4.35, 0.72, C.border);
      s.addImage({ data: icCheck, x: 5.3, y: y + 0.12, w: 0.2, h: 0.2 });
      s.addText(t, {
        x: 5.6,
        y: y + 0.08,
        w: 3.72,
        h: 0.24,
        fontSize: 10.5,
        fontFace: "Cambria",
        color: C.white,
        bold: true,
        margin: 0,
      });
      s.addText(d, { x: 5.6, y: y + 0.36, w: 3.72, h: 0.28, fontSize: 8.5, color: C.silver, margin: 0 });
    });
    s.addText("Unique signals. 3-day head start. Unfair advantage.", {
      x: 5.3,
      y: 5.14,
      w: 4.1,
      h: 0.2,
      fontSize: 9,
      color: C.pain,
      italic: true,
      margin: 0,
    });

    sNum(s, 3);
  }

  // SLIDE 4 — HOW IT WORKS
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };

    eyebrow(s, "HOW IT WORKS");
    s.addText("Three engines. One score. One brief.", {
      x: 0.6,
      y: 0.6,
      w: 9.2,
      h: 0.45,
      fontSize: 26,
      fontFace: "Cambria",
      color: C.white,
      bold: true,
      margin: 0,
    });

    [
      { label: "VOID SCANNER", sub: "Competitor retreats", color: C.void, x: 0.45, icon: icSearch },
      { label: "COMPLIANCE RADAR", sub: "Regulatory shockwaves", color: C.comp, x: 3.58, icon: icGavel },
      { label: "PAIN LISTENER", sub: "Community pain signals", color: C.pain, x: 6.72, icon: icComments },
    ].forEach(({ label, sub, color, x, icon }) => {
      card(s, x, 1.18, 2.82, 1.2, color, C.card);
      s.addShape(pres.ShapeType.rect, {
        x,
        y: 1.18,
        w: 2.82,
        h: 0.3,
        fill: { color, transparency: 80 },
        line: { color, width: 0 },
      });
      s.addImage({ data: icon, x: x + 0.14, y: 1.22, w: 0.2, h: 0.2 });
      s.addText(label, {
        x: x + 0.42,
        y: 1.2,
        w: 2.25,
        h: 0.25,
        fontSize: 8,
        color,
        bold: true,
        charSpacing: 0.8,
        margin: 0,
      });
      s.addText(sub, {
        x: x + 0.16,
        y: 1.56,
        w: 2.52,
        h: 0.68,
        fontSize: 12,
        fontFace: "Cambria",
        color: C.white,
        bold: true,
        margin: 0,
        lineSpacingMultiple: 1.2,
      });
    });

    [1.52, 4.65, 7.78].forEach((cx) => {
      s.addShape(pres.ShapeType.rect, {
        x: cx - 0.02,
        y: 2.4,
        w: 0.04,
        h: 0.3,
        fill: { color: C.dim },
        line: { color: C.dim, width: 0 },
      });
    });
    s.addShape(pres.ShapeType.rect, {
      x: 1.5,
      y: 2.66,
      w: 6.3,
      h: 0.04,
      fill: { color: C.dim },
      line: { color: C.dim, width: 0 },
    });
    s.addShape(pres.ShapeType.rect, {
      x: 4.63,
      y: 2.66,
      w: 0.04,
      h: 0.3,
      fill: { color: C.dim },
      line: { color: C.dim, width: 0 },
    });
    s.addShape(pres.ShapeType.triangle, {
      x: 4.53,
      y: 2.92,
      w: 0.24,
      h: 0.14,
      fill: { color: C.dim },
      line: { color: C.dim, width: 0 },
      rotate: 180,
    });

    card(s, 2.85, 3.1, 4.3, 0.96, C.conv, C.cardLt);
    s.addShape(pres.ShapeType.rect, {
      x: 2.85,
      y: 3.1,
      w: 4.3,
      h: 0.28,
      fill: { color: C.conv, transparency: 82 },
      line: { color: C.conv, width: 0 },
    });
    s.addImage({ data: icBolt, x: 2.98, y: 3.13, w: 0.2, h: 0.2 });
    s.addText("CONVERGENCE ENGINE", {
      x: 3.26,
      y: 3.13,
      w: 3.65,
      h: 0.22,
      fontSize: 8.5,
      color: C.conv,
      bold: true,
      charSpacing: 1.2,
      margin: 0,
    });
    s.addText(
      "POST /api/sweep  ·  Cognee profile memory  ·  AI/ML weighted scoring  ·  TriggerWare at ≥85",
      {
        x: 3.0,
        y: 3.44,
        w: 3.95,
        h: 0.56,
        fontSize: 9,
        color: C.silver,
        margin: 0,
        lineSpacingMultiple: 1.38,
      },
    );

    s.addShape(pres.ShapeType.rect, {
      x: 4.63,
      y: 4.08,
      w: 0.04,
      h: 0.28,
      fill: { color: C.dim },
      line: { color: C.dim, width: 0 },
    });
    s.addShape(pres.ShapeType.triangle, {
      x: 4.53,
      y: 4.32,
      w: 0.24,
      h: 0.14,
      fill: { color: C.dim },
      line: { color: C.dim, width: 0 },
      rotate: 180,
    });

    [
      { label: "HubSpot Lead", sub: "Webhook + native fields", color: C.blueLt, x: 2.38, icon: icDB },
      { label: "AE Alert", sub: "Slack + draft message", color: C.orange, x: 4.5, icon: icBolt },
      { label: "Intel Brief", sub: "AI/ML generated", color: C.conv, x: 6.62, icon: icFile },
    ].forEach(({ label, sub, color, x, icon }) => {
      card(s, x, 4.5, 1.9, 0.65, color);
      s.addImage({ data: icon, x: x + 0.1, y: 4.58, w: 0.2, h: 0.2 });
      s.addText(label, {
        x: x + 0.36,
        y: 4.56,
        w: 1.42,
        h: 0.24,
        fontSize: 11,
        fontFace: "Cambria",
        color,
        bold: true,
        margin: 0,
      });
      s.addText(sub, {
        x: x + 0.36,
        y: 4.8,
        w: 1.42,
        h: 0.22,
        fontSize: 7.5,
        color: C.silver,
        margin: 0,
      });
    });

    sponsorRow(s, ["BrightData", "Cognee", "AI/ML API", "TriggerWare"], 0.45, 5.24);
    sNum(s, 4);
  }

  // SLIDE 5 — VOID SCANNER
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };

    s.addShape(pres.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 4.3,
      h: 5.625,
      fill: { color: C.surface },
      line: { color: C.surface, width: 0 },
    });
    s.addShape(pres.ShapeType.rect, {
      x: 4.28,
      y: 0,
      w: 0.06,
      h: 5.625,
      fill: { color: C.void },
      line: { color: C.void, width: 0 },
    });

    s.addText("ENGINE  01", {
      x: 0.5,
      y: 0.55,
      w: 3.55,
      h: 0.22,
      fontSize: 7.5,
      color: C.void,
      bold: true,
      charSpacing: 3.5,
      margin: 0,
    });
    s.addImage({ data: icSearch, x: 0.5, y: 0.85, w: 0.52, h: 0.52 });
    s.addText("VOID\nSCANNER", {
      x: 0.5,
      y: 1.45,
      w: 3.55,
      h: 1.38,
      fontSize: 48,
      fontFace: "Cambria",
      color: C.white,
      bold: true,
      margin: 0,
      lineSpacingMultiple: 1.05,
    });
    s.addText("Detects what competitors\nsilently remove from their\nweb presence.", {
      x: 0.5,
      y: 2.96,
      w: 3.52,
      h: 0.86,
      fontSize: 10.5,
      color: C.silver,
      margin: 0,
      lineSpacingMultiple: 1.55,
    });

    s.addText("BRIGHT DATA TOOLS", {
      x: 0.5,
      y: 3.98,
      w: 3.5,
      h: 0.2,
      fontSize: 7,
      color: C.dim,
      bold: true,
      charSpacing: 2,
      margin: 0,
    });
    [
      ["Scraping Browser", "stripe.com/atlas pricing diffs"],
      ["Web Unlocker", "Bot-protected product docs"],
    ].forEach(([t, d], i) => {
      const y = 4.24 + i * 0.52;
      s.addShape(pres.ShapeType.roundRect, {
        x: 0.5,
        y,
        w: 3.55,
        h: 0.42,
        rectRadius: 0.04,
        fill: { color: C.void, transparency: 88 },
        line: { color: C.void, width: 0.5 },
      });
      s.addText(t, {
        x: 0.65,
        y: y + 0.05,
        w: 3.25,
        h: 0.2,
        fontSize: 9,
        color: C.void,
        bold: true,
        margin: 0,
      });
      s.addText(d, { x: 0.65, y: y + 0.22, w: 3.25, h: 0.16, fontSize: 7.5, color: C.silver, margin: 0 });
    });

    s.addText("LIVE DEMO: BREX × STRIPE ATLAS", {
      x: 4.56,
      y: 0.38,
      w: 5.1,
      h: 0.2,
      fontSize: 7.5,
      color: C.blue,
      bold: true,
      charSpacing: 2.5,
      margin: 0,
    });
    [
      {
        t: "SMB fast-track tier silently removed",
        d: "Before: same-day entity formation, expedited EIN, priority support. After: 3–5 day standard queue. 340+ Brex subsidiaries affected.",
      },
      {
        t: "Cognee semantic diff with provenance",
        d: "Every signal tagged: Bright Data Scraping Browser, captured 2025-05-30 08:14 UTC, confidence 94%. Evidence panel shows before/after.",
      },
      {
        t: "Void score 87/100 — ALERT status",
        d: "Category-defining signal: Crayon and Klue track additions. Nobody watches deletions. That gap is the moat.",
      },
      {
        t: "Detected 3 days before intent vendors",
        d: "Competitive comparison widget quantifies $18,750 advantage on Brex at $50K ACV — built into the live dashboard.",
      },
    ].forEach(({ t, d }, i) => {
      const y = 0.78 + i * 1.16;
      card(s, 4.52, y, 5.1, 1.06, C.void);
      accentBar(s, 4.52, y, 1.06, C.void);
      s.addText(t, {
        x: 4.76,
        y: y + 0.1,
        w: 4.7,
        h: 0.28,
        fontSize: 11,
        fontFace: "Cambria",
        color: C.white,
        bold: true,
        margin: 0,
      });
      s.addText(d, {
        x: 4.76,
        y: y + 0.44,
        w: 4.7,
        h: 0.58,
        fontSize: 8.5,
        color: C.silver,
        margin: 0,
        lineSpacingMultiple: 1.42,
      });
    });

    sNum(s, 5);
  }

  // SLIDE 6 — COMPLIANCE RADAR
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };

    s.addShape(pres.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 4.3,
      h: 5.625,
      fill: { color: C.surface },
      line: { color: C.surface, width: 0 },
    });
    s.addShape(pres.ShapeType.rect, {
      x: 4.28,
      y: 0,
      w: 0.06,
      h: 5.625,
      fill: { color: C.comp },
      line: { color: C.comp, width: 0 },
    });

    s.addText("ENGINE  02", {
      x: 0.5,
      y: 0.55,
      w: 3.55,
      h: 0.22,
      fontSize: 7.5,
      color: C.comp,
      bold: true,
      charSpacing: 3.5,
      margin: 0,
    });
    s.addImage({ data: icGavel, x: 0.5, y: 0.85, w: 0.52, h: 0.52 });
    s.addText("COMPLIANCE\nRADAR", {
      x: 0.5,
      y: 1.45,
      w: 3.55,
      h: 1.38,
      fontSize: 40,
      fontFace: "Cambria",
      color: C.white,
      bold: true,
      margin: 0,
      lineSpacingMultiple: 1.05,
    });
    s.addText("Every new regulation\ncreates an instant list\nof in-market accounts.", {
      x: 0.5,
      y: 2.96,
      w: 3.52,
      h: 0.86,
      fontSize: 10.5,
      color: C.silver,
      margin: 0,
      lineSpacingMultiple: 1.55,
    });

    s.addText("SOURCES MONITORED", {
      x: 0.5,
      y: 3.98,
      w: 3.5,
      h: 0.2,
      fontSize: 7,
      color: C.dim,
      bold: true,
      charSpacing: 2,
      margin: 0,
    });
    [
      "Federal Register  ·  SEC EDGAR",
      "EUR-Lex  ·  FCA  ·  BaFin  ·  CNIL",
      "PCI Security Standards Council",
      "FINRA  ·  OCC  ·  HHS  ·  FDA",
    ].forEach((t, i) => {
      dot(s, 0.52, 4.28 + i * 0.28 + 0.05, C.comp);
      s.addText(t, {
        x: 0.72,
        y: 4.26 + i * 0.28,
        w: 3.38,
        h: 0.24,
        fontSize: 8.5,
        color: C.silver,
        margin: 0,
      });
    });

    s.addText("THE PIPELINE", {
      x: 4.56,
      y: 0.38,
      w: 5.1,
      h: 0.2,
      fontSize: 7.5,
      color: C.blue,
      bold: true,
      charSpacing: 2.5,
      margin: 0,
    });
    [
      {
        n: "01",
        t: "Regulation published",
        d: "SERP API monitors 40+ authoritative feeds. PCI-DSS 4.0 indexed before any analyst briefs sales.",
      },
      {
        n: "02",
        t: "Structured extraction",
        d: "AI/ML API extracts industries, size thresholds, geographic scope, deadlines, and required actions.",
      },
      {
        n: "03",
        t: "Firmographic cross-reference",
        d: "Web Scraper maps scope to Brex ($2.1B monthly card volume) — instant prioritised in-market list.",
      },
      {
        n: "04",
        t: "Acknowledgment gap check",
        d: "Brex: zero public roadmap, 1 compliance role posted 3 days ago. Score 74/100 — behind schedule.",
      },
    ].forEach(({ n, t, d }, i) => {
      const y = 0.78 + i * 1.16;
      card(s, 4.52, y, 5.1, 1.06, C.comp);
      s.addShape(pres.ShapeType.rect, {
        x: 4.52,
        y,
        w: 0.52,
        h: 1.06,
        fill: { color: C.comp, transparency: 78 },
        line: { color: C.comp, width: 0 },
      });
      s.addText(n, {
        x: 4.52,
        y,
        w: 0.52,
        h: 1.06,
        fontSize: 14,
        color: C.comp,
        bold: true,
        align: "center",
        valign: "middle",
        margin: 0,
      });
      s.addText(t, {
        x: 5.14,
        y: y + 0.1,
        w: 4.3,
        h: 0.28,
        fontSize: 11,
        fontFace: "Cambria",
        color: C.white,
        bold: true,
        margin: 0,
      });
      s.addText(d, {
        x: 5.14,
        y: y + 0.44,
        w: 4.3,
        h: 0.58,
        fontSize: 8.5,
        color: C.silver,
        margin: 0,
        lineSpacingMultiple: 1.42,
      });
    });

    sNum(s, 6);
  }

  // SLIDE 7 — PAIN LISTENER
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };

    s.addShape(pres.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 4.3,
      h: 5.625,
      fill: { color: C.surface },
      line: { color: C.surface, width: 0 },
    });
    s.addShape(pres.ShapeType.rect, {
      x: 4.28,
      y: 0,
      w: 0.06,
      h: 5.625,
      fill: { color: C.pain },
      line: { color: C.pain, width: 0 },
    });

    s.addText("ENGINE  03", {
      x: 0.5,
      y: 0.55,
      w: 3.55,
      h: 0.22,
      fontSize: 7.5,
      color: C.pain,
      bold: true,
      charSpacing: 3.5,
      margin: 0,
    });
    s.addImage({ data: icComments, x: 0.5, y: 0.85, w: 0.52, h: 0.52 });
    s.addText("PAIN\nLISTENER", {
      x: 0.5,
      y: 1.45,
      w: 3.55,
      h: 1.38,
      fontSize: 48,
      fontFace: "Cambria",
      color: C.white,
      bold: true,
      margin: 0,
      lineSpacingMultiple: 1.05,
    });
    s.addText("Intercepts buyers before\nthey know they are\nbuyers.", {
      x: 0.5,
      y: 2.96,
      w: 3.52,
      h: 0.86,
      fontSize: 10.5,
      color: C.silver,
      margin: 0,
      lineSpacingMultiple: 1.55,
    });

    s.addText("TOOLS", {
      x: 0.5,
      y: 3.98,
      w: 3.5,
      h: 0.2,
      fontSize: 7,
      color: C.dim,
      bold: true,
      charSpacing: 2,
      margin: 0,
    });
    [
      ["Web Unlocker", C.pain],
      ["Scraping Browser", C.pain],
      ["Speechmatics", C.comp],
      ["Featherless AI", C.pain],
    ].forEach(([t, c], i) => {
      const tx = 0.5 + (i % 2) * 1.82;
      const ty = 4.24 + Math.floor(i / 2) * 0.38;
      s.addShape(pres.ShapeType.roundRect, {
        x: tx,
        y: ty,
        w: 1.68,
        h: 0.28,
        rectRadius: 0.04,
        fill: { color: c, transparency: 86 },
        line: { color: c, width: 0.6 },
      });
      s.addText(t, {
        x: tx,
        y: ty,
        w: 1.68,
        h: 0.28,
        fontSize: 7.5,
        color: c,
        align: "center",
        valign: "middle",
        bold: true,
        margin: 0,
      });
    });

    s.addText("LIVE SIGNAL: BREX 93/100", {
      x: 4.56,
      y: 0.38,
      w: 5.1,
      h: 0.2,
      fontSize: 7.5,
      color: C.blue,
      bold: true,
      charSpacing: 2.5,
      margin: 0,
    });
    [
      {
        t: "Reddit r/fintech — ACTIVE_EVALUATION",
        d: "u/treasury_lead_sf: 'Evaluating alternatives to Stripe Atlas — support gone silent.' 67 upvotes, 23 comments. Featherless classified urgency: high.",
        color: C.pain,
      },
      {
        t: "G2 · Capterra · TrustRadius reviews",
        d: "'Looking for alternatives at renewal' surfaced in real time. Review feeds catch switching intent before any form fill.",
        color: C.pain,
      },
      {
        t: "LinkedIn public posts",
        d: "Decision-makers announce evaluations publicly. Brex VP of Treasury linked via post history + Cognee author mapping.",
        color: C.pain,
      },
      {
        t: "Payments Unfiltered Ep.127 — Speechmatics",
        d: "Michael Torres, VP Finance at Brex: 'Atlas support model isn't scaling with us at 12 entities.' Transcript confidence 94%.",
        color: C.comp,
      },
    ].forEach(({ t, d, color }, i) => {
      const y = 0.78 + i * 1.16;
      card(s, 4.52, y, 5.1, 1.06, color);
      accentBar(s, 4.52, y, 1.06, color);
      s.addText(t, {
        x: 4.76,
        y: y + 0.1,
        w: 4.7,
        h: 0.28,
        fontSize: 11,
        fontFace: "Cambria",
        color: C.white,
        bold: true,
        margin: 0,
      });
      s.addText(d, {
        x: 4.76,
        y: y + 0.44,
        w: 4.7,
        h: 0.58,
        fontSize: 8.5,
        color: C.silver,
        margin: 0,
        lineSpacingMultiple: 1.42,
      });
    });

    sNum(s, 7);
  }

  // SLIDE 8 — CONVERGENCE
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };

    eyebrow(s, "CONVERGENCE", C.conv);
    s.addText("All three signals on one account\n= a certified buying event.", {
      x: 0.6,
      y: 0.6,
      w: 9.2,
      h: 0.84,
      fontSize: 24,
      fontFace: "Cambria",
      color: C.white,
      bold: true,
      margin: 0,
      lineSpacingMultiple: 1.28,
    });

    card(s, 0.45, 1.62, 4.72, 3.72, C.border);

    s.addText("LIVE ACCOUNT", {
      x: 0.65,
      y: 1.76,
      w: 4.32,
      h: 0.2,
      fontSize: 7,
      color: C.dim,
      bold: true,
      charSpacing: 2.5,
      margin: 0,
    });
    s.addText("Brex", {
      x: 0.65,
      y: 2.0,
      w: 4.32,
      h: 0.42,
      fontSize: 24,
      fontFace: "Cambria",
      color: C.white,
      bold: true,
      margin: 0,
    });
    s.addText("1,200 employees  ·  San Francisco  ·  $12.3B valuation  ·  ALERT", {
      x: 0.65,
      y: 2.46,
      w: 4.32,
      h: 0.22,
      fontSize: 8.5,
      color: C.silver,
      margin: 0,
    });

    s.addChart(
      pres.charts.BAR,
      [
        {
          name: "Score",
          labels: ["Pain Listener", "Void Scanner", "Compliance Radar"],
          values: [93, 87, 74],
        },
      ],
      {
        x: 0.58,
        y: 2.78,
        w: 4.46,
        h: 2.0,
        barDir: "bar",
        chartColors: [C.pain, C.void, C.comp],
        chartArea: { fill: { color: C.card } },
        plotArea: { fill: { color: C.card } },
        catAxisLabelColor: C.silver,
        valAxisLabelColor: C.silver,
        valGridLine: { color: C.border, size: 0.5 },
        catGridLine: { style: "none" },
        showValue: true,
        dataLabelColor: C.white,
        dataLabelFontSize: 10,
        showLegend: false,
        valAxisMinVal: 0,
        valAxisMaxVal: 100,
      },
    );

    card(s, 0.45, 4.82, 4.72, 0.44, C.conv, C.cardLt);
    s.addText("CONVERGENCE SCORE", {
      x: 0.65,
      y: 4.88,
      w: 2.8,
      h: 0.2,
      fontSize: 7.5,
      color: C.conv,
      bold: true,
      charSpacing: 1,
      margin: 0,
    });
    s.addText("85", {
      x: 3.82,
      y: 4.8,
      w: 0.72,
      h: 0.5,
      fontSize: 32,
      fontFace: "Cambria",
      color: C.conv,
      bold: true,
      align: "right",
      valign: "middle",
      margin: 0,
    });
    s.addText("/ 100  ·  91% confidence", {
      x: 4.55,
      y: 4.92,
      w: 1.5,
      h: 0.28,
      fontSize: 8,
      color: C.dim,
      align: "left",
      margin: 0,
    });

    s.addText("AUTOMATED TRIGGERS", {
      x: 5.52,
      y: 1.62,
      w: 4.15,
      h: 0.2,
      fontSize: 7.5,
      color: C.blue,
      bold: true,
      charSpacing: 2.5,
      margin: 0,
    });
    [
      { r: "50+", a: "Watchlist — monitoring frequency doubled", c: C.silver },
      { r: "65+", a: "CRM account flagged with signal summary", c: C.blueLt },
      { r: "75+", a: "CRM lead created with full signal breakdown", c: C.blue },
      { r: "85+", a: "Slack alert to AE + pre-written opening line", c: C.comp },
      { r: "95+", a: "Executive escalation — act today flag raised", c: C.void },
      { r: "100", a: "Immediate trigger regardless of composite score", c: C.pain },
    ].forEach(({ r, a, c }, i) => {
      const y = 1.98 + i * 0.54;
      card(s, 5.48, y, 4.14, 0.46, C.border);
      s.addShape(pres.ShapeType.rect, {
        x: 5.48,
        y,
        w: 0.55,
        h: 0.46,
        fill: { color: c, transparency: 80 },
        line: { color: c, width: 0 },
      });
      s.addText(r, {
        x: 5.48,
        y,
        w: 0.55,
        h: 0.46,
        fontSize: 9,
        color: c,
        bold: true,
        align: "center",
        valign: "middle",
        margin: 0,
      });
      s.addText(a, {
        x: 6.1,
        y: y + 0.1,
        w: 3.35,
        h: 0.3,
        fontSize: 9,
        color: C.silver,
        margin: 0,
      });
    });

    sponsorRow(s, ["Cognee", "AI/ML API", "TriggerWare"], 5.52, 5.38);
    sNum(s, 8);
  }

  // SLIDE 9 — INTEL BRIEF
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };

    eyebrow(s, "THE OUTPUT");
    s.addText("One brief. Three signals. Ready to send.", {
      x: 0.6,
      y: 0.6,
      w: 9.2,
      h: 0.42,
      fontSize: 24,
      fontFace: "Cambria",
      color: C.white,
      bold: true,
      margin: 0,
    });

    card(s, 0.45, 1.2, 5.65, 4.22, C.border, C.surface);
    s.addShape(pres.ShapeType.rect, {
      x: 0.45,
      y: 1.2,
      w: 5.65,
      h: 0.32,
      fill: { color: C.cardLt },
      line: { color: C.border, width: 0 },
    });
    s.addText("PREINTENT  ·  INTEL BRIEF  ·  BREX  ·  CONVERGENCE 85/100  ·  HIGH URGENCY", {
      x: 0.6,
      y: 1.24,
      w: 5.38,
      h: 0.22,
      fontSize: 6.5,
      color: C.blueLt,
      bold: true,
      charSpacing: 0.4,
      margin: 0,
    });

    const briefs = [
      {
        label: "① VOID SCANNER",
        score: "87/100",
        color: C.void,
        body: "Stripe Atlas removed SMB fast-track tier May 30. Brex has 12 subsidiaries formed via Atlas since 2022 — no migration path. Semantic diff via Cognee, Scraping Browser provenance.",
      },
      {
        label: "② COMPLIANCE RADAR",
        score: "74/100",
        color: C.comp,
        body: "PCI-DSS 4.0 enforcement Aug 31 (89 days). Brex processes $2.1B card volume monthly. Zero public compliance roadmap — 1 compliance role posted 3 days ago.",
      },
      {
        label: "③ PAIN LISTENER",
        score: "93/100",
        color: C.pain,
        body: "VP of Treasury on r/fintech: 'evaluating alternatives to Stripe Atlas.' Speechmatics transcript (Payments Unfiltered Ep.127) confirms active migration planning.",
      },
    ];

    let ly = 1.68;
    briefs.forEach(({ label, score, color, body }) => {
      s.addText(`${label}   ${score}`, {
        x: 0.62,
        y: ly,
        w: 5.34,
        h: 0.2,
        fontSize: 8,
        fontFace: "Consolas",
        color,
        bold: true,
        margin: 0,
      });
      ly += 0.24;
      s.addText(body, {
        x: 0.62,
        y: ly,
        w: 5.34,
        h: 0.5,
        fontSize: 8,
        fontFace: "Consolas",
        color: C.silver,
        margin: 0,
        lineSpacingMultiple: 1.32,
      });
      ly += 0.56;
      s.addShape(pres.ShapeType.rect, {
        x: 0.62,
        y: ly,
        w: 5.34,
        h: 0.02,
        fill: { color: C.border },
        line: { color: C.border, width: 0 },
      });
      ly += 0.1;
    });

    s.addText("SUGGESTED OPENING LINE", {
      x: 0.62,
      y: ly + 0.06,
      w: 5.34,
      h: 0.2,
      fontSize: 7,
      fontFace: "Consolas",
      color: C.conv,
      bold: true,
      margin: 0,
    });
    s.addText(
      '"Hi Sarah — I noticed Stripe made some changes to their Atlas plans recently, and with PCI-DSS 4.0 coming in August, I thought the timing might be worth a conversation."',
      {
        x: 0.62,
        y: ly + 0.3,
        w: 5.34,
        h: 0.56,
        fontSize: 8,
        fontFace: "Consolas",
        color: C.white,
        margin: 0,
        lineSpacingMultiple: 1.35,
      },
    );

    s.addText("DELIVERED VIA TRIGGERWARE + SLACK", {
      x: 6.38,
      y: 1.2,
      w: 3.28,
      h: 0.22,
      fontSize: 7.5,
      color: C.blue,
      bold: true,
      charSpacing: 1.5,
      margin: 0,
    });
    [
      {
        t: "HubSpot Lead",
        d: "Auto-created with all three signal breakdowns. Share modal exports to CRM, Slack, email, or PDF.",
        color: C.blueLt,
        icon: icDB,
      },
      {
        t: "AE Slack Alert",
        d: "Real webhook when convergence ≥ 85. Rep receives brief + pre-written first line in seconds.",
        color: C.orange,
        icon: icBolt,
      },
      {
        t: "Intel Brief",
        d: "AI/ML API generates structured brief. Scannable in 60 seconds — stream visible in BRIEF tab.",
        color: C.conv,
        icon: icFile,
      },
    ].forEach(({ t, d, color, icon }, i) => {
      const y = 1.58 + i * 1.1;
      card(s, 6.35, y, 3.28, 0.96, color);
      accentBar(s, 6.35, y, 0.96, color);
      s.addImage({ data: icon, x: 6.54, y: y + 0.12, w: 0.22, h: 0.22 });
      s.addText(t, {
        x: 6.84,
        y: y + 0.1,
        w: 2.64,
        h: 0.26,
        fontSize: 12,
        fontFace: "Cambria",
        color,
        bold: true,
        margin: 0,
      });
      s.addText(d, {
        x: 6.54,
        y: y + 0.42,
        w: 2.95,
        h: 0.48,
        fontSize: 8.5,
        color: C.silver,
        margin: 0,
        lineSpacingMultiple: 1.4,
      });
    });

    card(s, 6.35, 4.92, 3.28, 0.34, C.pain);
    s.addText("Signal detected  →  AE alerted in under 5 min", {
      x: 6.52,
      y: 4.97,
      w: 2.98,
      h: 0.22,
      fontSize: 8.5,
      color: C.pain,
      bold: true,
      margin: 0,
    });

    sponsorRow(s, ["AI/ML API", "TriggerWare", "Speechmatics"], 0.45, 5.34);
    sNum(s, 9);
  }

  // SLIDE 10 — LIVE PRODUCT (NEW)
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };

    eyebrow(s, "SHIPPED MVP", C.pain);
    s.addText("Not a mockup. A working product.", {
      x: 0.6,
      y: 0.6,
      w: 9.2,
      h: 0.42,
      fontSize: 26,
      fontFace: "Cambria",
      color: C.white,
      bold: true,
      margin: 0,
    });

    const features = [
      {
        icon: icPlay,
        label: "90-Second Guided Tour",
        body: "Press T — 10 scripted steps from hook to close. Teleprompter script + keyboard shortcuts for judges.",
        color: C.conv,
      },
      {
        icon: icRocket,
        label: "RUN FULL SCAN",
        body: "POST /api/sweep orchestrates Bright Data → AI/ML → Featherless → Speechmatics → convergence → delivery. Mock mode works with zero keys.",
        color: C.blue,
      },
      {
        icon: icUsers,
        label: "6 Real Account Watchlist",
        body: "Brex, Notion, Vercel, Rippling, Mercury, Linear — recognizable companies with evidence panels and confidence intervals.",
        color: C.pain,
      },
      {
        icon: icChart,
        label: "ROI + Competitive Edge",
        body: "Built-in ROI calculator ($417/3-day advantage at $50K ACV). Competitive comparison quantifies 3-day head start vs intent vendors.",
        color: C.comp,
      },
    ];

    features.forEach(({ icon, label, body, color }, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 0.45 + col * 4.72;
      const y = 1.22 + row * 2.05;
      card(s, x, y, 4.52, 1.88, color, C.card);
      accentBar(s, x, y, 1.88, color);
      s.addImage({ data: icon, x: x + 0.18, y: y + 0.16, w: 0.28, h: 0.28 });
      s.addText(label, {
        x: x + 0.54,
        y: y + 0.14,
        w: 3.8,
        h: 0.28,
        fontSize: 12,
        fontFace: "Cambria",
        color,
        bold: true,
        margin: 0,
      });
      s.addText(body, {
        x: x + 0.22,
        y: y + 0.52,
        w: 4.1,
        h: 1.2,
        fontSize: 9,
        color: C.silver,
        margin: 0,
        lineSpacingMultiple: 1.45,
      });
    });

    card(s, 0.45, 5.02, 9.15, 0.38, C.border, C.cardLt);
    s.addText(
      "Next.js 16  ·  TypeScript  ·  Vitest + Playwright e2e  ·  GET /api/health  ·  Vercel-ready  ·  Clean mode (C) for recording",
      {
        x: 0.6,
        y: 5.08,
        w: 8.85,
        h: 0.24,
        fontSize: 8,
        color: C.dim,
        align: "center",
        margin: 0,
      },
    );

    sNum(s, 10);
  }

  // SLIDE 11 — TECHNOLOGY STACK
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };

    eyebrow(s, "TECHNOLOGY");
    s.addText("Six sponsors. Every integration is load-bearing.", {
      x: 0.6,
      y: 0.6,
      w: 9.2,
      h: 0.42,
      fontSize: 24,
      fontFace: "Cambria",
      color: C.white,
      bold: true,
      margin: 0,
    });

    const stack = [
      {
        name: "Bright Data",
        color: C.blue,
        icon: icCogs,
        tools: "Scraping Browser · Web Unlocker · SERP API · Web Scraper API · MCP Server",
        role: "Entire data collection layer. Live sweep fetches competitor pages, regulatory feeds, and community sources with explicit provenance on every signal.",
      },
      {
        name: "AI/ML API",
        color: C.void,
        icon: icBolt,
        tools: "Mistral-7B · Llama-3 · GPT-4o (configurable)",
        role: "Intelligence layer. Structured extraction, pain classification support, convergence sub-scoring, and streaming Intel Brief generation.",
      },
      {
        name: "Featherless AI",
        color: C.pain,
        icon: icIdea,
        tools: "Open-source model inference — zero cost",
        role: "Pain Listener ACTIVE_EVALUATION tagging on community posts. Fast, free, privacy-respecting classification in mock or real mode.",
      },
      {
        name: "Cognee",
        color: C.conv,
        icon: icDB,
        tools: "Account Intelligence Profiles · semantic diffs",
        role: "MVP: browser localStorage profiles track score history, signal evolution, and Void Scanner versioned memory per account.",
      },
      {
        name: "Speechmatics",
        color: C.comp,
        icon: icMic,
        tools: "Speech-to-text · podcast transcription",
        role: "Audio intelligence on Payments Unfiltered and YouTube. Channel no text-only competitor can access.",
      },
      {
        name: "TriggerWare",
        color: C.orange,
        icon: icChart,
        tools: "Event-driven workflow automation",
        role: "Evaluates convergence thresholds and routes CRM lead, Slack alert, or Intel Brief — fully automated at ≥85.",
      },
    ];

    [[0, 3], [3, 6]].forEach(([start, end], ci) => {
      const x = ci === 0 ? 0.45 : 5.12;
      stack.slice(start, end).forEach(({ name, color, icon, tools, role }, ri) => {
        const y = 1.24 + ri * 1.36;
        card(s, x, y, 4.52, 1.24, color, C.card);
        s.addShape(pres.ShapeType.rect, {
          x,
          y,
          w: 4.52,
          h: 0.32,
          fill: { color, transparency: 86 },
          line: { color, width: 0 },
        });
        accentBar(s, x, y, 1.24, color);
        s.addImage({ data: icon, x: x + 0.18, y: y + 0.06, w: 0.2, h: 0.2 });
        s.addText(name, {
          x: x + 0.46,
          y: y + 0.06,
          w: 2.8,
          h: 0.22,
          fontSize: 11.5,
          fontFace: "Cambria",
          color,
          bold: true,
          margin: 0,
        });
        s.addText(tools, {
          x: x + 0.22,
          y: y + 0.36,
          w: 4.14,
          h: 0.2,
          fontSize: 7.5,
          color: C.dim,
          margin: 0,
        });
        s.addText(role, {
          x: x + 0.22,
          y: y + 0.6,
          w: 4.14,
          h: 0.58,
          fontSize: 8.5,
          color: C.silver,
          margin: 0,
          lineSpacingMultiple: 1.38,
        });
      });
    });

    sNum(s, 11);
  }

  // SLIDE 12 — WHY PreIntent WINS
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };

    s.addShape(pres.ShapeType.rect, {
      x: 6.2,
      y: -0.8,
      w: 4.8,
      h: 7.8,
      fill: { color: C.surface },
      line: { color: C.border, width: 0.5 },
      rotate: -8,
    });

    eyebrow(s, "WHY PreIntent WINS");
    s.addText("Built, deployed, and demo-ready.", {
      x: 0.6,
      y: 0.6,
      w: 5.9,
      h: 1.02,
      fontSize: 34,
      fontFace: "Cambria",
      color: C.white,
      bold: true,
      margin: 0,
      lineSpacingMultiple: 1.15,
    });

    [
      {
        label: "Application of Technology",
        icon: icCogs,
        body: "Five Bright Data tools with distinct, justified roles. Live POST /api/sweep pipeline. Cognee memory, Featherless classification, Speechmatics audio — all wired with mock fallbacks and real mode via env.",
        color: C.blue,
      },
      {
        label: "Business Value",
        icon: icChart,
        body: "Real companies (Brex $12.3B). 3-day detection advantage quantified at $18,750/deal. ROI calculator shows 500%+ monthly return at $50K ACV. One deal pays for 50 months.",
        color: C.pain,
      },
      {
        label: "Originality",
        icon: icIdea,
        body: "Void Scanner is category-defining — nobody watches competitor deletions. Three-engine triangulation with 33/33/33 convergence is a novel architecture intent vendors cannot replicate.",
        color: C.void,
      },
      {
        label: "Presentation Impact",
        icon: icBolt,
        body: "Press T for guided tour. Press C for clean recording mode. Watch RUN FULL SCAN live — score rises, TriggerWare fires, brief streams. The demo writes itself.",
        color: C.conv,
      },
    ].forEach(({ label, icon, body, color }, i) => {
      const y = 1.8 + i * 0.86;
      s.addImage({ data: icon, x: 0.6, y: y + 0.02, w: 0.2, h: 0.2 });
      s.addText(label, {
        x: 0.9,
        y,
        w: 5.4,
        h: 0.26,
        fontSize: 11,
        fontFace: "Cambria",
        color,
        bold: true,
        margin: 0,
      });
      s.addText(body, {
        x: 0.9,
        y: y + 0.3,
        w: 5.4,
        h: 0.48,
        fontSize: 8.5,
        color: C.silver,
        margin: 0,
        lineSpacingMultiple: 1.35,
      });
    });

    s.addText("▶  PreIntent  ·  localhost:3000/demo", {
      x: 0.6,
      y: 5.28,
      w: 5.5,
      h: 0.22,
      fontSize: 11,
      fontFace: "Cambria",
      color: C.conv,
      bold: true,
      charSpacing: 4,
      margin: 0,
    });

    sNum(s, 12);
  }

  const outDir = path.join(__dirname, "..", "outputs");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "PREINTENT_Hackathon_Deck.pptx");
  await pres.writeFile({ fileName: outFile });
  console.log("Wrote:", outFile);
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
