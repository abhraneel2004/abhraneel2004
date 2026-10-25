// Re-skins the snk contribution snake with a theme picked by date (IST).
// Usage: SNAKE_THEME=auto|<theme> node .github/scripts/snake-theme.mjs <dir-with-svgs>

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

// Lunar festivals move every year, extend these when they run out.
const DIWALI = ["2026-11-08", "2027-10-29", "2028-10-17", "2029-11-05", "2030-10-26"];
const HOLI = ["2027-03-22", "2028-03-11", "2029-03-01", "2030-03-20"];

// Themes without a `light` palette use the dark card in both modes.
export const THEMES = {
  neon: {
    label: ({ owner }) => `▸ PLAYER 1${owner ? `: ${owner.toUpperCase()}` : ""}`,
    effects: ["scanline"],
    dark: {
      bg: "#0b0b1a", border: "#ffffff06", empty: "#16162b",
      dots: ["#0b3d2e", "#0f7a46", "#1ed760", "#7dff9b"],
      snake: ["#00f0ff", "#ff2bd6"], ink: "#7dff9b", glow: 2.5, gridGlow: 1,
    },
    light: {
      bg: "#fdf4ff", border: "#00000008", empty: "#f1e8f7",
      dots: ["#c7f5e0", "#86e8c4", "#34c9a0", "#0f9b7a"],
      snake: ["#0891b2", "#c026d3"], ink: "#a21caf", glow: 1.5,
    },
  },
  halloween: {
    label: "▸ SPOOKY SEASON",
    effects: ["moon", "bats"],
    dark: {
      bg: "#120a1f", border: "#ffffff06", empty: "#231537",
      dots: ["#5a2a00", "#a34700", "#ff7a00", "#ffb347"],
      snake: ["#b6ff3b", "#7c3aed"], ink: "#ff9a1f", glow: 2.5,
      fx: ["#f6efd2", "#9b7bc4"],
    },
  },
  diwali: {
    label: "▸ HAPPY DIWALI",
    effects: ["flicker", "fireworks"],
    dark: {
      bg: "#1a0f05", border: "#ffffff06", empty: "#2b1a0a",
      dots: ["#6b3a00", "#b86b00", "#ffa500", "#ffe08a"],
      snake: ["#fff7d6", "#ffb300"], ink: "#ffc94d", glow: 2.5, gridGlow: 1.2,
      fx: ["#ffd166", "#ff9f1c", "#fff3b0", "#ff6b6b", "#ffffff"],
    },
  },
  winter: {
    label: "▸ LET IT SNOW",
    effects: ["snow"],
    dark: {
      bg: "#0b1d33", border: "#ffffff06", empty: "#12304f",
      dots: ["#1e4f7a", "#3b82c4", "#7cc4f2", "#e0f4ff"],
      snake: ["#ef4444", "#f8fafc"], cycle: true, ink: "#bfe6ff", glow: 2,
      fx: ["#ffffff"],
    },
    light: {
      bg: "#f3f9ff", border: "#0000000a", empty: "#dde9f7",
      dots: ["#bfdbfe", "#93c5fd", "#60a5fa", "#2563eb"],
      snake: ["#dc2626", "#16a34a"], cycle: true, ink: "#1d4ed8", glow: 1.5,
      fx: ["#a9c4e4"],
    },
  },
  newyear: {
    label: ({ date }) => `▸ HAPPY NEW YEAR ${+date.slice(0, 4) + (date.slice(5, 7) === "12" ? 1 : 0)}`,
    effects: ["fireworks"],
    dark: {
      bg: "#0d0b14", border: "#ffffff06", empty: "#1c1826",
      dots: ["#4a3b12", "#8a6d1c", "#d4af37", "#ffe9a3"],
      snake: ["#ffd700", "#fff3c4"], ink: "#ffd700", glow: 2.5,
      fx: ["#ffd700", "#ff4fa3", "#3ddcff", "#7dff9b", "#ffffff"],
    },
  },
  holi: {
    label: "▸ HAPPY HOLI",
    effects: ["powder"],
    dark: {
      bg: "#14101f", border: "#ffffff06", empty: "#241d33",
      dots: ["#ff8fc7", "#ffd23f", "#3ddc84", "#4f8bff"],
      snake: ["#ff2d55", "#ff9500", "#ffcc00", "#34c759", "#007aff", "#af52de"], cycle: true,
      ink: "#ffd23f", glow: 2,
      fx: ["#ff2d95", "#ffcc00", "#00d084", "#2f80ff", "#ff7a00", "#a855f7"],
    },
    light: {
      bg: "#fffaf3", border: "#0000000a", empty: "#f1ebe2",
      dots: ["#ff8fc7", "#ffd23f", "#3ddc84", "#4f8bff"],
      snake: ["#ff2d55", "#ff9500", "#ffcc00", "#34c759", "#007aff", "#af52de"], cycle: true,
      ink: "#db2777", glow: 1.5,
      fx: ["#ff2d95", "#ffcc00", "#00d084", "#2f80ff", "#ff7a00", "#a855f7"],
    },
  },
};

const day = (iso) => Date.parse(`${iso}T00:00:00Z`) / 864e5;
const near = (iso, dates, before, after) =>
  dates.some((d) => day(iso) - day(d) >= -before && day(iso) - day(d) <= after);

export const pickTheme = (iso) => {
  const md = iso.slice(5);
  if (md >= "12-31" || md <= "01-06") return "newyear";
  if (near(iso, DIWALI, 4, 2)) return "diwali";
  if (near(iso, HOLI, 3, 1)) return "holi";
  if (md >= "10-20" && md <= "11-01") return "halloween";
  if (md >= "12-01") return "winter";
  return "neon";
};

const todayIST = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());

const mulberry32 = (a) => () => {
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const hash = (s) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);

const rgb = (c) => c.slice(1).match(/../g).map((x) => parseInt(x, 16));
const mix = (a, b, k) =>
  "#" + rgb(a).map((v, i) => Math.round(v + (rgb(b)[i] - v) * k).toString(16).padStart(2, "0")).join("");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const f1 = (n) => n.toFixed(1);
const loop = (name, dur, rand, easing = "linear") => `animation:${name} ${dur.toFixed(2)}s ${easing} -${(rand() * dur).toFixed(2)}s infinite`;

const BAT =
  "M0 0Q3-4 9-2Q7-1 7 1Q5 0 4.5 1.5Q3 .5 1.5 1.8Z" +
  "M0 0Q-3-4-9-2Q-7-1-7 1Q-5 0-4.5 1.5Q-3 .5-1.5 1.8Z" +
  "M-1.2-.5L-1-2.6L-.3-1.2L.3-1.2L1-2.6L1.2-.5Q0 3.2-1.2-.5Z";

// Each effect returns css plus markup for the layer behind the grid (back) or above the snake (front).
const EFFECTS = {
  scanline: ({ vx, vy, vw, vh }) => ({
    css: `.fx-scan{animation:fx-scan 6s linear infinite}@keyframes fx-scan{0%{transform:translateY(0)}60%,100%{transform:translateY(${vh + 14}px)}}`,
    front: `<rect class="fx-scan" x="${vx}" y="${vy - 14}" width="${vw}" height="14" fill="url(#fx-scan)"/>`,
  }),

  snow: ({ vx, vy, vw, vh }, p, rand) => {
    const fall = (name, s) =>
      `@keyframes ${name}{` +
      [0, 4, -3, 3, 0].map((x, k) => `${k * 25}%{transform:translate(${x * s}px,${f1(((vh + 8) * k) / 4)}px)}`).join("") +
      "}";
    const flakes = Array.from({ length: 45 }, (_, i) =>
      `<circle cx="${f1(vx + rand() * vw)}" cy="${vy - 4}" r="${f1(0.7 + rand() * 1.5)}" fill="${p.fx[0]}" opacity="${(0.5 + rand() * 0.5).toFixed(2)}" style="${loop(`fx-fall${i % 2}`, 7 + rand() * 7, rand)}"/>`,
    );
    return { css: fall("fx-fall0", 1) + fall("fx-fall1", -1), front: flakes.join("") };
  },

  moon: ({ vx, vy, vw }, p) => {
    const cx = vx + vw - 34;
    const cy = vy + 15;
    return {
      back: `<circle cx="${cx}" cy="${cy}" r="10" fill="${p.fx[0]}" filter="url(#fx-glow)"/><circle cx="${cx + 4}" cy="${cy - 3}" r="8.5" fill="${p.bg}"/>`,
    };
  },

  bats: ({ vx, vy, vw }, p, rand) => ({
    css:
      `@keyframes fx-fly{0%{transform:translate(${vx - 20}px,0)}50%{transform:translate(${vx + vw / 2}px,-4px)}100%{transform:translate(${vx + vw + 20}px,0)}}` +
      `@keyframes fx-flap{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.35)}}` +
      `.fx-bat{transform-box:fill-box;transform-origin:center;animation:fx-flap .35s ease-in-out infinite}`,
    front: Array.from({ length: 4 }, () =>
      `<g style="${loop("fx-fly", 14 + rand() * 10, rand)}"><g transform="translate(0 ${f1(vy + 9 + rand() * 14)}) scale(${(1.1 + rand() * 0.4).toFixed(2)})"><path class="fx-bat" fill="${p.fx[1]}" d="${BAT}"/></g></g>`,
    ).join(""),
  }),

  fireworks: ({ vx, vy, vw }, p, rand) => {
    const bursts = Array.from({ length: 6 }, () => {
      const color = p.fx[Math.floor(rand() * p.fx.length)];
      const timing = loop("fx-burst", 3 + rand() * 2.5, rand, "ease-out");
      const sparks = Array.from({ length: 12 }, (_, k) =>
        `<g transform="rotate(${k * 30})"><circle r="1.7" fill="${color}" style="${timing}"/></g>`,
      ).join("");
      return `<g transform="translate(${f1(vx + 40 + rand() * (vw - 80))} ${f1(vy + 10 + rand() * 60)}) scale(${(0.8 + rand() * 0.6).toFixed(2)})">${sparks}</g>`;
    });
    return {
      css: `@keyframes fx-burst{0%{transform:translateX(0);opacity:0}4%{opacity:1}45%{transform:translateX(16px);opacity:.9}60%,100%{transform:translateX(19px);opacity:0}}`,
      back: `<g filter="url(#fx-glow-wide)" opacity=".85">${bursts.join("")}</g>`,
    };
  },

  powder: ({ vx, vy, vw, vh }, p, rand) => ({
    css: `.fx-puff{transform-box:fill-box;transform-origin:center}@keyframes fx-puff{0%{transform:scale(.2);opacity:0}30%{opacity:.45}100%{transform:scale(1.3);opacity:0}}`,
    back:
      `<g filter="url(#fx-blur)">` +
      Array.from({ length: 9 }, () =>
        `<circle class="fx-puff" cx="${f1(vx + rand() * vw)}" cy="${f1(vy + rand() * vh)}" r="${f1(14 + rand() * 14)}" fill="${p.fx[Math.floor(rand() * p.fx.length)]}" style="${loop("fx-puff", 4 + rand() * 4, rand, "ease-out")}"/>`,
      ).join("") +
      `</g>`,
  }),

  flicker: () => ({
    css: `.fx-grid{animation:fx-flicker 2.6s ease-in-out infinite}@keyframes fx-flicker{0%,100%{opacity:1}30%{opacity:.85}45%{opacity:.97}70%{opacity:.88}}`,
  }),
};

const glowFilter = (id, std, region = "") =>
  `<filter id="${id}"${region}><feGaussianBlur stdDeviation="${std}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;

export const applyTheme = (svg, name, mode, ctx = {}) => {
  const theme = THEMES[name];
  const cells = svg.match(/<rect class="c[ "]/g)?.length ?? 0;
  if (!svg.includes("</style>") || cells < 7) {
    throw new Error(`Unexpected snk output (${cells} grid cells), refusing to theme it`);
  }

  const p = theme[mode] ?? theme.dark;
  const [vx, vy, vw, vh] = svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
  const box = { vx, vy, vw, vh };
  const rand = mulberry32(hash(name + mode));
  const segments = svg.match(/class="s s\d+"/g)?.length ?? 0;
  const segmentFill = (i) =>
    p.cycle ? p.snake[i % p.snake.length] : mix(p.snake[0], p.snake[1], segments > 1 ? i / (segments - 1) : 0);

  const fx = theme.effects.map((e) => EFFECTS[e](box, p, rand));
  const layer = (key) => `<g clip-path="url(#fx-card)">${fx.map((f) => f[key] ?? "").join("")}</g>`;
  const label = typeof theme.label === "function" ? theme.label({ owner: "", date: "", ...ctx }) : theme.label;

  const css =
    `:root{--cb:${p.border}!important;--ce:${p.empty}!important;--c0:${p.empty}!important;--cs:${p.snake[0]}!important;` +
    p.dots.map((c, i) => `--c${i + 1}:${c}!important;`).join("") +
    "}" +
    Array.from({ length: segments }, (_, i) => `.s.s${i}{fill:${segmentFill(i)}}`).join("") +
    ".s{filter:url(#fx-glow)}" +
    (p.gridGlow ? ".fx-grid{filter:url(#fx-grid-glow)}" : "") +
    fx.map((f) => f.css ?? "").join("");

  const card = `x="${vx}" y="${vy}" width="${vw}" height="${vh}" rx="12"`;
  const defs =
    "<defs>" +
    glowFilter("fx-glow", p.glow, ' x="-100%" y="-100%" width="300%" height="300%"') +
    glowFilter("fx-glow-wide", 1.5) +
    (p.gridGlow ? glowFilter("fx-grid-glow", p.gridGlow) : "") +
    `<filter id="fx-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>` +
    `<clipPath id="fx-card"><rect ${card}/></clipPath>` +
    `<linearGradient id="fx-scan" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.ink}" stop-opacity="0"/><stop offset=".5" stop-color="${p.ink}" stop-opacity=".14"/><stop offset="1" stop-color="${p.ink}" stop-opacity="0"/></linearGradient>` +
    "</defs>";
  const underlay =
    defs +
    `<rect ${card} fill="${p.bg}"/>` +
    layer("back") +
    `<text x="0" y="${vy + vh - 26}" font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="10" font-weight="700" letter-spacing="1.5" fill="${p.ink}">${esc(label)}</text>`;

  return svg
    .replace("</style>", () => css + "</style>" + underlay)
    .replace(/(?:<rect class="c[ "][^>]*\/>)+/, (run) => `<g class="fx-grid">${run}</g>`)
    .replace(/<\/svg>\s*$/, () => layer("front") + "</svg>");
};

const main = () => {
  const dir = process.argv[2] ?? "dist";
  const date = todayIST();
  const requested = process.env.SNAKE_THEME || "auto";
  const name = requested === "auto" ? pickTheme(date) : requested;
  if (!THEMES[name]) {
    throw new Error(`Unknown theme "${name}", expected auto or one of: ${Object.keys(THEMES).join(", ")}`);
  }

  const files = readdirSync(dir).filter((f) => f.endsWith(".svg"));
  if (!files.length) throw new Error(`No SVGs found in ${dir}`);

  const ctx = { owner: process.env.GITHUB_REPOSITORY_OWNER ?? "", date };
  for (const file of files) {
    const path = join(dir, file);
    const mode = file.includes("-dark") ? "dark" : "light";
    writeFileSync(path, applyTheme(readFileSync(path, "utf8"), name, mode, ctx));
  }
  console.log(`Applied theme ${name} (${date} IST) to ${files.join(", ")}`);
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
