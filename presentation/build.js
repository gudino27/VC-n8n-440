// Virtual Counselor — CPTS 440 Final Presentation
// 10-min talk focused on the LLM + RAG pipeline.

const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const {
  FaBookOpen, FaQuestionCircle, FaSearch, FaCheckCircle, FaGraduationCap,
  FaProjectDiagram, FaCogs, FaBolt, FaRobot, FaDatabase, FaArrowRight,
  FaLayerGroup, FaSlidersH, FaCode, FaListUl, FaBalanceScale, FaFlask
} = require("react-icons/fa");

// ---------- palette ----------
const CRIMSON   = "981E32";   // WSU crimson, primary
const DEEP      = "2B2D42";   // charcoal/midnight for headers
const CREAM     = "F8F4F0";   // off-white background
const SAND      = "EDE6DD";   // card background
const TEAL      = "0E7C86";   // accent for data / "RAG" path
const GOLD      = "C58E2A";   // accent for "deterministic" path
const MUTED     = "6B6B6B";   // body muted text
const LINE      = "C9BFB3";   // separator

// ---------- icon helper ----------
function svg(IconComponent, color = "#000000", size = 256) {
  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  );
}
async function icon(IconComponent, hex) {
  const png = await sharp(Buffer.from(svg(IconComponent, "#" + hex, 256))).png().toBuffer();
  return "image/png;base64," + png.toString("base64");
}

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13.3 x 7.5
  pres.author = "Group 6";
  pres.title  = "Virtual Counselor — CPTS 440";

  const W = 13.3, H = 7.5;

  // ---- shared decorations ----
  const addFooter = (slide, page) => {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: H - 0.35, w: W, h: 0.35, fill: { color: DEEP }, line: { color: DEEP }
    });
    slide.addText("Virtual Counselor  ·  CPTS 440  ·  Group 6", {
      x: 0.5, y: H - 0.35, w: 8, h: 0.35,
      fontFace: "Calibri", fontSize: 10, color: "FFFFFF", valign: "middle", margin: 0
    });
    slide.addText(String(page), {
      x: W - 0.7, y: H - 0.35, w: 0.4, h: 0.35,
      fontFace: "Calibri", fontSize: 10, color: "FFFFFF", valign: "middle", align: "right", margin: 0
    });
  };

  const titleBar = (slide, kicker, title) => {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 0.25, h: H, fill: { color: CRIMSON }, line: { color: CRIMSON }
    });
    slide.addText(kicker.toUpperCase(), {
      x: 0.7, y: 0.4, w: 12, h: 0.35,
      fontFace: "Consolas", fontSize: 12, color: CRIMSON, bold: true, charSpacing: 4, margin: 0
    });
    slide.addText(title, {
      x: 0.7, y: 0.75, w: 12, h: 0.85,
      fontFace: "Georgia", fontSize: 32, color: DEEP, bold: true, margin: 0
    });
  };

  // pre-render icons
  const ICO = {
    book:   await icon(FaBookOpen, CRIMSON.slice()),
    q:      await icon(FaQuestionCircle, CRIMSON.slice()),
    search: await icon(FaSearch, CRIMSON.slice()),
    check:  await icon(FaCheckCircle, GOLD.slice()),
    cap:    await icon(FaGraduationCap, GOLD.slice()),
    flow:   await icon(FaProjectDiagram, CRIMSON.slice()),
    cog:    await icon(FaCogs, CRIMSON.slice()),
    bolt:   await icon(FaBolt, CRIMSON.slice()),
    robot:  await icon(FaRobot, TEAL.slice()),
    db:     await icon(FaDatabase, CRIMSON.slice()),
    arrow:  await icon(FaArrowRight, MUTED.slice()),
    layers: await icon(FaLayerGroup, TEAL.slice()),
    slide:  await icon(FaSlidersH, CRIMSON.slice()),
    code:   await icon(FaCode, GOLD.slice()),
    list:   await icon(FaListUl, CRIMSON.slice()),
    bal:    await icon(FaBalanceScale, GOLD.slice()),
    flask:  await icon(FaFlask, TEAL.slice())
  };

  // =======================================================================
  // SLIDE 1 — Title
  // =======================================================================
  {
    const s = pres.addSlide();
    s.background = { color: DEEP };

    // crimson side band
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 4.6, h: H, fill: { color: CRIMSON }, line: { color: CRIMSON }
    });
    s.addText("CPTS 440", {
      x: 0.6, y: 0.7, w: 3.5, h: 0.5,
      fontFace: "Consolas", fontSize: 16, color: "FFFFFF", bold: true, charSpacing: 6, margin: 0
    });
    s.addText("Final\nProject", {
      x: 0.6, y: 1.4, w: 3.5, h: 2.4,
      fontFace: "Georgia", fontSize: 60, color: "FFFFFF", bold: true, margin: 0
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.6, y: 4.2, w: 0.6, h: 0.05, fill: { color: "FFFFFF" }, line: { color: "FFFFFF" }
    });
    s.addText("AI Final Project ·  Spring 2026", {
      x: 0.6, y: 4.35, w: 3.7, h: 0.4,
      fontFace: "Calibri", fontSize: 13, color: "FFFFFF", margin: 0
    });

    // right side title
    s.addText("Virtual Counselor", {
      x: 5.0, y: 1.3, w: 8, h: 1.4,
      fontFace: "Georgia", fontSize: 54, color: "FFFFFF", bold: true, margin: 0
    });
    s.addText("an LLM + RAG course advisor for WSU", {
      x: 5.0, y: 2.7, w: 8, h: 0.6,
      fontFace: "Georgia", fontSize: 22, color: "CADCFC", italic: true, margin: 0
    });

    // three callout chips
    const chips = [
      { t: "catalog parsing", c: CREAM },
      { t: "deterministic checks", c: CREAM },
      { t: "cosine + reranker RAG", c: CREAM }
    ];
    let cx = 5.0;
    for (const ch of chips) {
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: cx, y: 3.7, w: 2.55, h: 0.5,
        fill: { color: "FFFFFF", transparency: 88 }, line: { color: "FFFFFF", width: 0.75 }, rectRadius: 0.08
      });
      s.addText(ch.t, {
        x: cx, y: 3.7, w: 2.55, h: 0.5,
        fontFace: "Consolas", fontSize: 11, color: "FFFFFF", align: "center", valign: "middle", margin: 0
      });
      cx += 2.7;
    }

    s.addText("Group 6", {
      x: 5.0, y: 5.6, w: 8, h: 0.4,
      fontFace: "Calibri", fontSize: 16, color: "FFFFFF", bold: true, margin: 0
    });
    s.addText("Washington State University  ·  School of EECS", {
      x: 5.0, y: 6.0, w: 8, h: 0.4,
      fontFace: "Calibri", fontSize: 13, color: "CADCFC", margin: 0
    });
  }

  // =======================================================================
  // SLIDE 2 — The Problem
  // =======================================================================
  {
    const s = pres.addSlide();
    s.background = { color: CREAM };
    titleBar(s, "the problem", "advising shouldn't require a PDF and a flowchart");

    // left: pain points
    const points = [
      ["catalogs are 200+ pages of dense pdf",       "students dig through prereq trees by hand"],
      ["one wrong prereq = a wasted semester",        "blocking courses are easy to miss"],
      ["advisors are overloaded",                     "appointments fill up weeks out"],
      ["existing chatbots hallucinate course codes",  "they sound confident and ship bad info"]
    ];
    let py = 1.85;
    for (const [a, b] of points) {
      s.addShape(pres.shapes.RECTANGLE, {
        x: 0.7, y: py, w: 0.05, h: 0.85, fill: { color: CRIMSON }, line: { color: CRIMSON }
      });
      s.addText(a, {
        x: 0.95, y: py, w: 5.5, h: 0.4,
        fontFace: "Calibri", fontSize: 16, color: DEEP, bold: true, margin: 0
      });
      s.addText(b, {
        x: 0.95, y: py + 0.4, w: 5.5, h: 0.45,
        fontFace: "Calibri", fontSize: 13, color: MUTED, margin: 0
      });
      py += 1.05;
    }

    // right: our claim card
    s.addShape(pres.shapes.RECTANGLE, {
      x: 7.4, y: 1.85, w: 5.2, h: 4.2,
      fill: { color: DEEP }, line: { color: DEEP }
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 7.4, y: 1.85, w: 0.1, h: 4.2, fill: { color: CRIMSON }, line: { color: CRIMSON }
    });
    s.addText("our claim", {
      x: 7.7, y: 2.1, w: 4.8, h: 0.4,
      fontFace: "Consolas", fontSize: 12, color: "CADCFC", bold: true, charSpacing: 4, margin: 0
    });
    s.addText("RAG over a parsed catalog +\ndeterministic prereq logic\nbeats either piece alone.", {
      x: 7.7, y: 2.55, w: 4.8, h: 1.7,
      fontFace: "Georgia", fontSize: 22, color: "FFFFFF", bold: true, margin: 0
    });
    s.addText("the LLM writes the answer.\nthe rule engine decides if you can take the class.", {
      x: 7.7, y: 4.4, w: 4.8, h: 1.4,
      fontFace: "Calibri", fontSize: 14, color: "CADCFC", italic: true, margin: 0
    });

    addFooter(s, 2);
  }

  // =======================================================================
  // SLIDE 3 — System overview / pipeline
  // =======================================================================
  {
    const s = pres.addSlide();
    s.background = { color: CREAM };
    titleBar(s, "system overview", "one question, three pipelines");

    // top row — ingest pipeline
    const stepBox = (x, y, w, h, label, sub, color, ic) => {
      s.addShape(pres.shapes.RECTANGLE, {
        x, y, w, h, fill: { color: "FFFFFF" }, line: { color: LINE, width: 0.75 },
        shadow: { type: "outer", blur: 6, offset: 1, color: "000000", opacity: 0.08, angle: 90 }
      });
      s.addShape(pres.shapes.RECTANGLE, {
        x, y, w: 0.08, h, fill: { color }, line: { color }
      });
      s.addImage({ data: ic, x: x + 0.25, y: y + 0.18, w: 0.4, h: 0.4 });
      s.addText(label, {
        x: x + 0.75, y: y + 0.12, w: w - 0.85, h: 0.4,
        fontFace: "Calibri", fontSize: 13, color: DEEP, bold: true, margin: 0
      });
      s.addText(sub, {
        x: x + 0.25, y: y + 0.65, w: w - 0.4, h: h - 0.7,
        fontFace: "Calibri", fontSize: 10.5, color: MUTED, margin: 0
      });
    };

    // INGEST track label
    s.addText("offline · ingest", {
      x: 0.7, y: 1.75, w: 3, h: 0.3,
      fontFace: "Consolas", fontSize: 10.5, color: CRIMSON, bold: true, charSpacing: 3, margin: 0
    });
    stepBox(0.7, 2.05, 2.8, 1.5, "WSU catalog (txt)", "~3.5k course chunks +\n191 degree blocks", CRIMSON, ICO.book);
    s.addImage({ data: ICO.arrow, x: 3.6, y: 2.65, w: 0.3, h: 0.3 });
    stepBox(4.0, 2.05, 2.8, 1.5, "ingestor + parser", "regex prereq extractor,\ndegree alias table", CRIMSON, ICO.cog);
    s.addImage({ data: ICO.arrow, x: 6.9, y: 2.65, w: 0.3, h: 0.3 });
    stepBox(7.3, 2.05, 2.8, 1.5, "MiniLM-L6 embed", "384-d vectors,\nL2-normalized", CRIMSON, ICO.layers);
    s.addImage({ data: ICO.arrow, x: 10.2, y: 2.65, w: 0.3, h: 0.3 });
    stepBox(10.6, 2.05, 2.4, 1.5, "FAISS (IndexFlatIP)", "cosine over\nmetadata.json", CRIMSON, ICO.db);

    // QUERY track label
    s.addText("online · query routing", {
      x: 0.7, y: 3.95, w: 4, h: 0.3,
      fontFace: "Consolas", fontSize: 10.5, color: TEAL, bold: true, charSpacing: 3, margin: 0
    });

    // user question oval
    s.addShape(pres.shapes.OVAL, {
      x: 0.7, y: 4.3, w: 2.6, h: 0.9, fill: { color: DEEP }, line: { color: DEEP }
    });
    s.addText("student question", {
      x: 0.7, y: 4.3, w: 2.6, h: 0.9,
      fontFace: "Calibri", fontSize: 13, color: "FFFFFF", bold: true, align: "center", valign: "middle", margin: 0
    });

    // router diamond-ish
    s.addImage({ data: ICO.arrow, x: 3.4, y: 4.65, w: 0.3, h: 0.3 });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 3.85, y: 4.3, w: 1.8, h: 0.9, fill: { color: GOLD }, line: { color: GOLD }
    });
    s.addText("router", {
      x: 3.85, y: 4.3, w: 1.8, h: 0.9,
      fontFace: "Calibri", fontSize: 14, color: "FFFFFF", bold: true, align: "center", valign: "middle", margin: 0
    });

    // three branch boxes
    const branch = (x, t, sub, color) => {
      s.addShape(pres.shapes.RECTANGLE, {
        x, y: 5.55, w: 2.3, h: 1.4,
        fill: { color: "FFFFFF" }, line: { color, width: 1.5 }
      });
      s.addShape(pres.shapes.RECTANGLE, {
        x, y: 5.55, w: 2.3, h: 0.06, fill: { color }, line: { color }
      });
      s.addText(t, {
        x: x + 0.15, y: 5.65, w: 2.0, h: 0.4,
        fontFace: "Consolas", fontSize: 11, color, bold: true, margin: 0
      });
      s.addText(sub, {
        x: x + 0.15, y: 6.0, w: 2.0, h: 0.95,
        fontFace: "Calibri", fontSize: 11, color: DEEP, margin: 0
      });
    };

    // arrow from router to branches
    s.addShape(pres.shapes.LINE, { x: 4.75, y: 5.2, w: 0, h: 0.3, line: { color: MUTED, width: 1.5 } });
    s.addShape(pres.shapes.LINE, { x: 1.85, y: 5.5, w: 9.6, h: 0, line: { color: MUTED, width: 1.5 } });

    branch(1.55,  "can_take",     "deterministic prereq\ncheck → LLM explainer",      CRIMSON);
    branch(5.5,   "what_to_grad", "degree lookup + diff →\nLLM graduation plan",      GOLD);
    branch(9.45,  "freeform",     "cosine top-30 → reranker\ntop-3 → LLM (Haiku 4.5)", TEAL);

    addFooter(s, 3);
  }

  // =======================================================================
  // SLIDE 4 — Catalog parsing
  // =======================================================================
  {
    const s = pres.addSlide();
    s.background = { color: CREAM };
    titleBar(s, "step 1 · ingest", "parsing the catalog into something searchable");

    // left col — what we extract
    s.addText("what we pull out", {
      x: 0.7, y: 1.85, w: 5, h: 0.4,
      fontFace: "Consolas", fontSize: 12, color: CRIMSON, bold: true, charSpacing: 3, margin: 0
    });

    const items = [
      [ICO.code,  "course codes",     "CPT S 121, MATH 171, …  via _CODE_RE regex"],
      [ICO.list,  "prereq strings",   "captured by _PREREQ_RE then parsed to DNF"],
      [ICO.cap,   "degree blocks",    "title patterns + credit counts → 191 blocks"],
      [ICO.bal,   "required courses", "schedule tables vs footnote/elective pools"]
    ];
    let yy = 2.3;
    for (const [ic, t, sub] of items) {
      s.addShape(pres.shapes.OVAL, {
        x: 0.7, y: yy, w: 0.55, h: 0.55, fill: { color: SAND }, line: { color: SAND }
      });
      s.addImage({ data: ic, x: 0.81, y: yy + 0.1, w: 0.33, h: 0.33 });
      s.addText(t, {
        x: 1.4, y: yy - 0.02, w: 5.2, h: 0.32,
        fontFace: "Calibri", fontSize: 14, color: DEEP, bold: true, margin: 0
      });
      s.addText(sub, {
        x: 1.4, y: yy + 0.28, w: 5.2, h: 0.36,
        fontFace: "Consolas", fontSize: 10.5, color: MUTED, margin: 0
      });
      yy += 0.95;
    }

    // right col — DNF example card
    s.addShape(pres.shapes.RECTANGLE, {
      x: 7.0, y: 1.85, w: 5.7, h: 4.65,
      fill: { color: DEEP }, line: { color: DEEP }
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 7.0, y: 1.85, w: 0.08, h: 4.65, fill: { color: TEAL }, line: { color: TEAL }
    });
    s.addText("the trick: disjunctive normal form", {
      x: 7.25, y: 2.05, w: 5.4, h: 0.4,
      fontFace: "Consolas", fontSize: 12, color: "9DD8DC", bold: true, charSpacing: 3, margin: 0
    });
    s.addText("raw prereq text", {
      x: 7.25, y: 2.5, w: 5.3, h: 0.3,
      fontFace: "Calibri", fontSize: 11, color: "CADCFC", margin: 0
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 7.25, y: 2.85, w: 5.3, h: 0.6, fill: { color: "1E1F33" }, line: { color: "1E1F33" }
    });
    s.addText('"CPT S 215, 223, or 233; MATH 216"', {
      x: 7.4, y: 2.85, w: 5.1, h: 0.6,
      fontFace: "Consolas", fontSize: 12, color: "FFE9A8", valign: "middle", margin: 0
    });

    s.addText("parsed to AND-of-ORs", {
      x: 7.25, y: 3.55, w: 5.3, h: 0.3,
      fontFace: "Calibri", fontSize: 11, color: "CADCFC", margin: 0
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 7.25, y: 3.9, w: 5.3, h: 1.0, fill: { color: "1E1F33" }, line: { color: "1E1F33" }
    });
    s.addText('[ ["CPT S 215", "CPT S 223", "CPT S 233"],\n  ["MATH 216"] ]', {
      x: 7.4, y: 3.9, w: 5.1, h: 1.0,
      fontFace: "Consolas", fontSize: 12, color: "9DD8DC", valign: "middle", margin: 0
    });

    s.addText("why it matters", {
      x: 7.25, y: 5.05, w: 5.3, h: 0.3,
      fontFace: "Consolas", fontSize: 11, color: "FFE9A8", bold: true, charSpacing: 3, margin: 0
    });
    s.addText("flat prereq lists treat \"or\" as \"and\" and reject students who actually qualify. DNF lets the checker say \"any one of these in this group, and all groups must hold.\"", {
      x: 7.25, y: 5.35, w: 5.3, h: 1.05,
      fontFace: "Calibri", fontSize: 12, color: "FFFFFF", margin: 0
    });

    addFooter(s, 4);
  }

  // =======================================================================
  // SLIDE 5 — "Can I take X?" pipeline
  // =======================================================================
  {
    const s = pres.addSlide();
    s.background = { color: CREAM };
    titleBar(s, "pipeline · can_take", "\"can I take CPTS 322 with 223 done?\"");

    // 4-step pipeline boxes across the top
    const step = (i, x, t, sub, ic) => {
      s.addShape(pres.shapes.RECTANGLE, {
        x, y: 1.95, w: 2.7, h: 1.95,
        fill: { color: "FFFFFF" }, line: { color: LINE, width: 0.75 },
        shadow: { type: "outer", blur: 6, offset: 1, color: "000000", opacity: 0.08, angle: 90 }
      });
      s.addShape(pres.shapes.RECTANGLE, {
        x, y: 1.95, w: 2.7, h: 0.06, fill: { color: CRIMSON }, line: { color: CRIMSON }
      });
      s.addShape(pres.shapes.OVAL, {
        x: x + 0.18, y: 2.18, w: 0.42, h: 0.42, fill: { color: CRIMSON }, line: { color: CRIMSON }
      });
      s.addText(String(i), {
        x: x + 0.18, y: 2.18, w: 0.42, h: 0.42,
        fontFace: "Georgia", fontSize: 14, color: "FFFFFF", bold: true, align: "center", valign: "middle", margin: 0
      });
      s.addImage({ data: ic, x: x + 2.1, y: 2.2, w: 0.4, h: 0.4 });
      s.addText(t, {
        x: x + 0.18, y: 2.7, w: 2.35, h: 0.4,
        fontFace: "Calibri", fontSize: 14, color: DEEP, bold: true, margin: 0
      });
      s.addText(sub, {
        x: x + 0.18, y: 3.05, w: 2.35, h: 0.85,
        fontFace: "Calibri", fontSize: 11, color: MUTED, margin: 0
      });
    };
    step(1, 0.7,  "extract codes",  "regex pulls courses\nout of the question",   ICO.search);
    step(2, 3.55, "lookup chunk",   "fetch course chunk\nfrom metadata.json",     ICO.db);
    step(3, 6.4,  "DNF check",      "evaluate AND-of-ORs\nagainst transcript",    ICO.bal);
    step(4, 9.25, "LLM explainer",  "Claude haiku 4.5 turns\nresult into prose",  ICO.robot);

    // arrows
    [3.25, 6.10, 8.95].forEach(x => {
      s.addImage({ data: ICO.arrow, x, y: 2.85, w: 0.3, h: 0.3 });
    });

    // bottom — checker output card  +  fix callout
    // left card — JSON output
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.7, y: 4.25, w: 7.0, h: 2.6,
      fill: { color: DEEP }, line: { color: DEEP }
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.7, y: 4.25, w: 0.08, h: 2.6, fill: { color: GOLD }, line: { color: GOLD }
    });
    s.addText("PrereqChecker.check() returns", {
      x: 0.95, y: 4.4, w: 6.7, h: 0.35,
      fontFace: "Consolas", fontSize: 12, color: "FFE9A8", bold: true, charSpacing: 3, margin: 0
    });
    s.addText(
      '{\n' +
      '  "found":  true,\n' +
      '  "can_take": false,\n' +
      '  "groups":  [["CPT S 215","CPT S 223","CPT S 233"], ["MATH 216"]],\n' +
      '  "missing": ["MATH 216"],\n' +
      '  "unmet_groups": [1]\n' +
      '}',
      {
        x: 0.95, y: 4.8, w: 6.7, h: 1.95,
        fontFace: "Consolas", fontSize: 13, color: "9DD8DC", margin: 0
      }
    );

    // right card — bug fix callout
    s.addShape(pres.shapes.RECTANGLE, {
      x: 7.95, y: 4.25, w: 4.7, h: 2.6,
      fill: { color: SAND }, line: { color: GOLD, width: 1.25 }
    });
    s.addText("the bug we hunted (commit 3fe0a59)", {
      x: 8.15, y: 4.4, w: 4.4, h: 0.35,
      fontFace: "Consolas", fontSize: 11, color: GOLD, bold: true, charSpacing: 3, margin: 0
    });
    s.addText("trailer-strip regex was eating trailing OR clauses, so \"OR 132\" was lost and the checker rejected eligible students.", {
      x: 8.15, y: 4.8, w: 4.4, h: 1.0,
      fontFace: "Calibri", fontSize: 12, color: DEEP, margin: 0
    });
    s.addText("split trailers into inline (strip phrase only) vs. terminal (strip to end).", {
      x: 8.15, y: 5.85, w: 4.4, h: 0.6,
      fontFace: "Calibri", fontSize: 12, color: DEEP, italic: true, margin: 0
    });
    s.addText("71  →  83 / 120 pass", {
      x: 8.15, y: 6.45, w: 4.4, h: 0.35,
      fontFace: "Georgia", fontSize: 16, color: CRIMSON, bold: true, margin: 0
    });

    addFooter(s, 5);
  }

  // =======================================================================
  // SLIDE 6 — Graduation pipeline
  // =======================================================================
  {
    const s = pres.addSlide();
    s.background = { color: CREAM };
    titleBar(s, "pipeline · what_to_grad", "\"what do I need to graduate?\"");

    // Left — flow
    const flowBox = (y, n, t, sub) => {
      s.addShape(pres.shapes.OVAL, {
        x: 0.7, y, w: 0.55, h: 0.55, fill: { color: GOLD }, line: { color: GOLD }
      });
      s.addText(String(n), {
        x: 0.7, y, w: 0.55, h: 0.55,
        fontFace: "Georgia", fontSize: 14, color: "FFFFFF", bold: true, align: "center", valign: "middle", margin: 0
      });
      s.addText(t, {
        x: 1.45, y: y - 0.02, w: 5.5, h: 0.35,
        fontFace: "Calibri", fontSize: 15, color: DEEP, bold: true, margin: 0
      });
      s.addText(sub, {
        x: 1.45, y: y + 0.32, w: 5.5, h: 0.5,
        fontFace: "Calibri", fontSize: 11.5, color: MUTED, margin: 0
      });
    };

    s.addText("GradAdvisor flow", {
      x: 0.7, y: 1.85, w: 5, h: 0.35,
      fontFace: "Consolas", fontSize: 12, color: CRIMSON, bold: true, charSpacing: 3, margin: 0
    });
    flowBox(2.3, 1, "match the degree",       "alias table maps \"CS\" → \"Bachelor of Science, Computer Science\"");
    flowBox(3.25, 2, "scan all 191 chunks",    "exact substring > fuzzy > reverse contains");
    flowBox(4.2, 3, "extract required list",  "courses + total_credits from chunk metadata");
    flowBox(5.15, 4, "diff vs transcript",     "case-insensitive normalization, \"CPT S\" == \"CPTS\"");
    flowBox(6.1, 5, "LLM synthesizes plan",   "structured summary injected as fact, not retrieval");

    // vertical dotted spine
    s.addShape(pres.shapes.LINE, {
      x: 0.975, y: 2.85, w: 0, h: 3.3,
      line: { color: GOLD, width: 1.25, dashType: "dash" }
    });

    // Right — the "why" callout
    s.addShape(pres.shapes.RECTANGLE, {
      x: 7.4, y: 1.95, w: 5.3, h: 4.85,
      fill: { color: "FFFFFF" }, line: { color: LINE, width: 0.75 },
      shadow: { type: "outer", blur: 6, offset: 1, color: "000000", opacity: 0.08, angle: 90 }
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 7.4, y: 1.95, w: 5.3, h: 0.08, fill: { color: GOLD }, line: { color: GOLD }
    });
    s.addText("why we don't trust top-k for this", {
      x: 7.6, y: 2.15, w: 5.0, h: 0.4,
      fontFace: "Consolas", fontSize: 11.5, color: GOLD, bold: true, charSpacing: 3, margin: 0
    });
    s.addText("top-15 FAISS misses Computer Science", {
      x: 7.6, y: 2.55, w: 5.0, h: 0.45,
      fontFace: "Georgia", fontSize: 18, color: DEEP, bold: true, margin: 0
    });
    s.addText("with 191 degree blocks indexed and lots of overlap in title text, the most-asked degree wasn't even in the candidate set. cosine just didn't rank it high.", {
      x: 7.6, y: 3.05, w: 5.0, h: 1.3,
      fontFace: "Calibri", fontSize: 12.5, color: MUTED, margin: 0
    });

    s.addShape(pres.shapes.RECTANGLE, {
      x: 7.6, y: 4.4, w: 5.0, h: 0.04, fill: { color: LINE }, line: { color: LINE }
    });

    s.addText("our fix", {
      x: 7.6, y: 4.5, w: 5.0, h: 0.35,
      fontFace: "Consolas", fontSize: 11.5, color: CRIMSON, bold: true, charSpacing: 3, margin: 0
    });
    s.addText("skip retrieval entirely. scan all 191 chunks deterministically with an alias table, prefer chunks with more required courses listed.", {
      x: 7.6, y: 4.85, w: 5.0, h: 1.2,
      fontFace: "Calibri", fontSize: 12.5, color: DEEP, margin: 0
    });

    s.addText("retrieval is great for fuzzy semantic stuff. lookup is better for known entities.", {
      x: 7.6, y: 6.0, w: 5.0, h: 0.7,
      fontFace: "Calibri", fontSize: 12, color: GOLD, italic: true, margin: 0
    });

    addFooter(s, 6);
  }

  // =======================================================================
  // SLIDE 7 — Freeform RAG
  // =======================================================================
  {
    const s = pres.addSlide();
    s.background = { color: CREAM };
    titleBar(s, "pipeline · freeform RAG", "sentence-transformers + cosine + reranker");

    // top: 5-stage pipeline strip
    const stage = (i, x, w, t, sub, color) => {
      s.addShape(pres.shapes.RECTANGLE, {
        x, y: 1.9, w, h: 1.5,
        fill: { color: "FFFFFF" }, line: { color: LINE, width: 0.75 }
      });
      s.addShape(pres.shapes.RECTANGLE, {
        x, y: 1.9, w, h: 0.06, fill: { color }, line: { color }
      });
      s.addText(String(i), {
        x: x + 0.15, y: 2.0, w: 0.4, h: 0.35,
        fontFace: "Consolas", fontSize: 11, color, bold: true, margin: 0
      });
      s.addText(t, {
        x: x + 0.15, y: 2.3, w: w - 0.25, h: 0.4,
        fontFace: "Calibri", fontSize: 13, color: DEEP, bold: true, margin: 0
      });
      s.addText(sub, {
        x: x + 0.15, y: 2.7, w: w - 0.25, h: 0.7,
        fontFace: "Calibri", fontSize: 10.5, color: MUTED, margin: 0
      });
    };

    stage(1, 0.7,  2.35, "encode question",  "MiniLM-L6-v2\n384-d, L2-norm",     TEAL);
    stage(2, 3.15, 2.35, "FAISS top-30",     "IndexFlatIP\n(inner = cosine)",   TEAL);
    stage(3, 5.6,  2.35, "rerank top-30→3",  "NVIDIA llama-nemotron\nrank-1b-v2",TEAL);
    stage(4, 8.05, 2.35, "build context",    "few-shot + prereq\nchains + UCORE",CRIMSON);
    stage(5, 10.5, 2.15, "LLM answer",       "claude-haiku-4-5\ntemp=0",         CRIMSON);

    // bottom: two cards — model card + system prompt rules
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.7, y: 3.65, w: 6.0, h: 3.2,
      fill: { color: DEEP }, line: { color: DEEP }
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.7, y: 3.65, w: 0.08, h: 3.2, fill: { color: TEAL }, line: { color: TEAL }
    });
    s.addText("model + index", {
      x: 0.95, y: 3.8, w: 5.5, h: 0.35,
      fontFace: "Consolas", fontSize: 11, color: "9DD8DC", bold: true, charSpacing: 3, margin: 0
    });

    const kv = [
      ["embedder", "all-MiniLM-L6-v2  ·  384-d"],
      ["similarity", "cosine via FAISS IndexFlatIP"],
      ["reranker", "nvidia/llama-nemotron-rerank-1b-v2"],
      ["llm", "anthropic claude-haiku-4-5  ·  temp 0  ·  400 max tok"],
      ["top_k / fetch_k", "3 / 30  (sweep-tuned)"],
      ["index size", "~3.5k course chunks + 191 degree blocks"]
    ];
    let ky = 4.2;
    for (const [k, v] of kv) {
      s.addText(k, {
        x: 0.95, y: ky, w: 1.7, h: 0.32,
        fontFace: "Consolas", fontSize: 11, color: "FFE9A8", margin: 0
      });
      s.addText(v, {
        x: 2.65, y: ky, w: 3.95, h: 0.32,
        fontFace: "Consolas", fontSize: 11, color: "FFFFFF", margin: 0
      });
      ky += 0.4;
    }

    // right card — system prompt rules
    s.addShape(pres.shapes.RECTANGLE, {
      x: 6.95, y: 3.65, w: 5.7, h: 3.2,
      fill: { color: "FFFFFF" }, line: { color: LINE, width: 0.75 },
      shadow: { type: "outer", blur: 6, offset: 1, color: "000000", opacity: 0.08, angle: 90 }
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 6.95, y: 3.65, w: 5.7, h: 0.08, fill: { color: CRIMSON }, line: { color: CRIMSON }
    });
    s.addText("what we tell the LLM", {
      x: 7.15, y: 3.85, w: 5.4, h: 0.35,
      fontFace: "Consolas", fontSize: 11, color: CRIMSON, bold: true, charSpacing: 3, margin: 0
    });

    const rules = [
      { text: "render prereq chains as arrows  ",        options: { bullet: true, breakLine: true, fontSize: 12, color: DEEP } },
      { text: "  CPT S 121 → 122 → 223 → 322",            options: { bullet: false, breakLine: true, fontSize: 11.5, color: TEAL, fontFace: "Consolas" } },
      { text: "answer in 1-2 sentences, no markdown",     options: { bullet: true, breakLine: true, fontSize: 12, color: DEEP } },
      { text: "do not invent course codes; use context",  options: { bullet: true, breakLine: true, fontSize: 12, color: DEEP } },
      { text: "suppress \"admission to the major\" boilerplate", options: { bullet: true, breakLine: true, fontSize: 12, color: DEEP } },
      { text: "if context is empty → say so, don't guess", options: { bullet: true, fontSize: 12, color: DEEP } }
    ];
    s.addText(rules, {
      x: 7.15, y: 4.25, w: 5.4, h: 2.5,
      fontFace: "Calibri", margin: 0, paraSpaceAfter: 4
    });

    addFooter(s, 7);
  }

  // =======================================================================
  // SLIDE 8 — Results / accuracy chart
  // =======================================================================
  {
    const s = pres.addSlide();
    s.background = { color: CREAM };
    titleBar(s, "results", "what the improvements actually bought us");

    // top stat strip
    const stat = (x, big, label, color) => {
      s.addShape(pres.shapes.RECTANGLE, {
        x, y: 1.9, w: 3.95, h: 1.4,
        fill: { color: "FFFFFF" }, line: { color: LINE, width: 0.75 }
      });
      s.addShape(pres.shapes.RECTANGLE, {
        x, y: 1.9, w: 0.08, h: 1.4, fill: { color }, line: { color }
      });
      s.addText(big, {
        x: x + 0.2, y: 1.95, w: 3.7, h: 0.85,
        fontFace: "Georgia", fontSize: 40, color: DEEP, bold: true, margin: 0
      });
      s.addText(label, {
        x: x + 0.2, y: 2.8, w: 3.7, h: 0.45,
        fontFace: "Calibri", fontSize: 12, color: MUTED, margin: 0
      });
    };
    stat(0.7,  "30.8%  →  76.7%", "freeform: no-RAG vs RAG accuracy",      CRIMSON);
    stat(4.85, "+45.8 pts",        "biggest single lever in the system",     GOLD);
    stat(9.0,  "144 s  →  72 s",   "reranker cut latency in half",           TEAL);

    // bottom-left: per-category bar chart
    s.addText("per-category accuracy  ·  no-RAG vs RAG (cosine)", {
      x: 0.7, y: 3.55, w: 7.5, h: 0.35,
      fontFace: "Consolas", fontSize: 11, color: DEEP, bold: true, charSpacing: 3, margin: 0
    });

    const chartData = [
      {
        name: "no-RAG",
        labels: ["prereq valid.", "chain disc.", "credits", "schedule", "ucore", "degree prog."],
        values: [13.3, 24.0, 50.0, 26.7, 50.0, 40.0]
      },
      {
        name: "with RAG",
        labels: ["prereq valid.", "chain disc.", "credits", "schedule", "ucore", "degree prog."],
        values: [90.0, 80.0, 70.0, 66.7, 90.0, 60.0]
      }
    ];
    s.addChart(pres.charts.BAR, chartData, {
      x: 0.7, y: 3.9, w: 7.5, h: 3.0, barDir: "col",
      chartColors: [GOLD, CRIMSON],
      chartArea: { fill: { color: "FFFFFF" }, roundedCorners: false },
      catAxisLabelColor: "5B5B5B", catAxisLabelFontSize: 9,
      valAxisLabelColor: "5B5B5B", valAxisLabelFontSize: 9,
      valGridLine: { color: "E2DCD2", size: 0.5 }, catGridLine: { style: "none" },
      showLegend: true, legendPos: "t", legendFontSize: 10,
      showValue: false, valAxisMaxVal: 100, valAxisMinVal: 0
    });

    // bottom-right: commit timeline
    s.addShape(pres.shapes.RECTANGLE, {
      x: 8.5, y: 3.55, w: 4.2, h: 3.35,
      fill: { color: DEEP }, line: { color: DEEP }
    });
    s.addText("the three commits that did it", {
      x: 8.7, y: 3.7, w: 3.9, h: 0.35,
      fontFace: "Consolas", fontSize: 11, color: "9DD8DC", bold: true, charSpacing: 3, margin: 0
    });

    const commits = [
      { sha: "f41a5fa", t: "reranker + system prompt",         d: "+2.5 pts, 50% latency cut" },
      { sha: "1393722", t: "DNF prereq, alias degree, cosine", d: "57 → 71 / 120  (+25%)" },
      { sha: "3fe0a59", t: "prereq trailer fix",               d: "71 → 83 / 120  (+17%)" }
    ];
    let cy = 4.15;
    for (const c of commits) {
      s.addShape(pres.shapes.OVAL, {
        x: 8.7, y: cy + 0.05, w: 0.18, h: 0.18, fill: { color: GOLD }, line: { color: GOLD }
      });
      s.addText(c.sha, {
        x: 8.95, y: cy, w: 1.0, h: 0.3,
        fontFace: "Consolas", fontSize: 10.5, color: "FFE9A8", bold: true, margin: 0
      });
      s.addText(c.t, {
        x: 8.7, y: cy + 0.32, w: 3.9, h: 0.32,
        fontFace: "Calibri", fontSize: 13, color: "FFFFFF", bold: true, margin: 0
      });
      s.addText(c.d, {
        x: 8.7, y: cy + 0.62, w: 3.9, h: 0.3,
        fontFace: "Calibri", fontSize: 11, color: "CADCFC", italic: true, margin: 0
      });
      cy += 1.0;
    }

    addFooter(s, 8);
  }

  // =======================================================================
  // SLIDE 9 — What we learned / takeaways
  // =======================================================================
  {
    const s = pres.addSlide();
    s.background = { color: CREAM };
    titleBar(s, "takeaways", "what we'd tell the next team");

    // 2x2 grid of lessons
    const lesson = (x, y, kicker, t, body, color, ic) => {
      s.addShape(pres.shapes.RECTANGLE, {
        x, y, w: 5.85, h: 2.3,
        fill: { color: "FFFFFF" }, line: { color: LINE, width: 0.75 },
        shadow: { type: "outer", blur: 6, offset: 1, color: "000000", opacity: 0.08, angle: 90 }
      });
      s.addShape(pres.shapes.RECTANGLE, {
        x, y, w: 0.08, h: 2.3, fill: { color }, line: { color }
      });
      s.addShape(pres.shapes.OVAL, {
        x: x + 0.3, y: y + 0.25, w: 0.55, h: 0.55, fill: { color }, line: { color }
      });
      s.addImage({ data: ic, x: x + 0.41, y: y + 0.36, w: 0.33, h: 0.33 });
      s.addText(kicker.toUpperCase(), {
        x: x + 1.0, y: y + 0.22, w: 4.7, h: 0.3,
        fontFace: "Consolas", fontSize: 10, color, bold: true, charSpacing: 3, margin: 0
      });
      s.addText(t, {
        x: x + 1.0, y: y + 0.52, w: 4.7, h: 0.4,
        fontFace: "Georgia", fontSize: 18, color: DEEP, bold: true, margin: 0
      });
      s.addText(body, {
        x: x + 0.3, y: y + 1.05, w: 5.4, h: 1.15,
        fontFace: "Calibri", fontSize: 12, color: MUTED, margin: 0
      });
    };

    lesson(0.7, 1.95, "lesson 1", "RAG isn't always the answer",
      "for known-entity lookups (a degree, a course code), deterministic match beats vector search every time. CS was outside top-15 with 191 indexed.",
      CRIMSON, ICO.bal);

    lesson(6.75, 1.95, "lesson 2", "rerankers are basically free",
      "we expected +1-2% accuracy. we also got 50% lower latency because we let FAISS do a cheap top-20 and only paid the reranker on a small batch.",
      TEAL, ICO.bolt);

    lesson(0.7, 4.45, "lesson 3", "DNF > flat lists for prereqs",
      "modeling \"or\"s as alternatives in an AND-of-ORs structure was the single biggest accuracy unlock. flat lists silently turn \"or\" into \"and\".",
      GOLD, ICO.code);

    lesson(6.75, 4.45, "lesson 4", "let the LLM write, not decide",
      "deterministic checker decides eligibility. claude-haiku-4-5 explains it. when we let the LLM judge prereqs alone, hallucinated codes showed up.",
      DEEP, ICO.robot);

    addFooter(s, 9);
  }

  // =======================================================================
  // SLIDE 10 — Closing / questions
  // =======================================================================
  {
    const s = pres.addSlide();
    s.background = { color: DEEP };

    s.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 0.4, h: H, fill: { color: CRIMSON }, line: { color: CRIMSON }
    });

    s.addText("thanks.", {
      x: 1.0, y: 1.6, w: 11, h: 1.6,
      fontFace: "Georgia", fontSize: 92, color: "FFFFFF", bold: true, margin: 0
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 1.0, y: 3.25, w: 0.7, h: 0.06, fill: { color: CRIMSON }, line: { color: CRIMSON }
    });
    s.addText("questions / pick it apart.", {
      x: 1.0, y: 3.4, w: 11, h: 0.6,
      fontFace: "Georgia", fontSize: 26, color: "CADCFC", italic: true, margin: 0
    });

    // contact / repo strip
    const chip = (x, t, sub) => {
      s.addShape(pres.shapes.RECTANGLE, {
        x, y: 5.4, w: 5.6, h: 1.1,
        fill: { color: "FFFFFF", transparency: 92 }, line: { color: "FFFFFF", width: 0.75 }
      });
      s.addText(t, {
        x: x + 0.25, y: 5.5, w: 5.1, h: 0.4,
        fontFace: "Consolas", fontSize: 11, color: "FFE9A8", bold: true, charSpacing: 3, margin: 0
      });
      s.addText(sub, {
        x: x + 0.25, y: 5.85, w: 5.1, h: 0.55,
        fontFace: "Calibri", fontSize: 14, color: "FFFFFF", margin: 0
      });
    };
    chip(1.0, "repo branch",  "accuracy-improvements");
    chip(6.7, "stack",         "MiniLM-L6 · FAISS · nemotron-rerank · haiku-4-5");

    s.addText("Group 6  ·  CPTS 440  ·  WSU EECS", {
      x: 1.0, y: 6.85, w: 11, h: 0.4,
      fontFace: "Calibri", fontSize: 12, color: "CADCFC", margin: 0
    });
  }

  // ----------------------------------------------------------
  await pres.writeFile({ fileName: "Virtual_Counselor_CPTS440.pptx" });
  console.log("OK  ·  wrote Virtual_Counselor_CPTS440.pptx");
})();
