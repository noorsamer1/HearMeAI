import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  GENERAL_RESPONSE_GIFS,
  generalResponseGifSrc,
} from "@/lib/sign/generalResponseGifs";
import {
  PHRASE_SIGN_GIFS,
  getPhraseSignGifByPhraseKey,
  matchPhraseSignGif,
  phraseSignGifSrc,
} from "@/lib/sign/phraseSignGifs";

const GIFS_DIR = path.join(process.cwd(), "public", "gifs");

/** Realistic user inputs: punctuation, casing, extra words. */
const REAL_WORLD_INPUTS: Record<string, string[]> = {
  hello: ["Hello!", "HELLO", "Hey there", "Hi!"],
  "how are you": ["How are you?", "HOW ARE YOU", "Hey, how are you today"],
  "good morning": ["Good morning!", "GM", "Morning ☀️"],
  "what's up": ["What's up?", "WHATS UP", "Sup dude"],
  "excuse me": ["Excuse me!", "Pardon me.", "EXCUSE ME"],
  "please repeat": [
    "Please repeat!",
    "PLEASE REPEAT",
    "Can you please repeat that?",
    "Say again please",
  ],
  "i don't understand": [
    "I don't understand",
    "I DONT UNDERSTAND",
    "Sorry, I don't understand this",
  ],
  "is it far": ["Is it far?", "How far is it?", "Is that far away?"],
  "i enjoy this": ["I enjoy this!", "Love this!", "We're having fun"],
  maybe: ["Maybe?", "Perhaps...", "I'm not sure"],
  help: ["Help!", "I need help", "HELP ME"],
  question: ["Question?", "What?", "Why is that?"],
  goodbye: ["Goodbye!", "Bye!", "See you later"],
};

function assertGifFileExists(fileName: string): void {
  const filePath = path.join(GIFS_DIR, fileName);
  expect(
    fs.existsSync(filePath),
    `Missing GIF file: public/gifs/${fileName}`
  ).toBe(true);
}

describe("phrase sign GIF assets", () => {
  it("every phrase GIF file exists on disk", () => {
    for (const entry of PHRASE_SIGN_GIFS) {
      assertGifFileExists(entry.fileName);
    }
  });

  it("every mood GIF file exists on disk", () => {
    for (const entry of GENERAL_RESPONSE_GIFS) {
      assertGifFileExists(entry.fileName);
    }
  });

  it("phraseSignGifSrc encodes filenames with spaces", () => {
    expect(phraseSignGifSrc("please repeat.gif")).toBe(
      "/gifs/please%20repeat.gif"
    );
    expect(phraseSignGifSrc("how are you.gif")).toBe(
      "/gifs/how%20are%20you.gif"
    );
  });

  it("generalResponseGifSrc resolves mood GIF paths", () => {
    expect(generalResponseGifSrc("idle")).toBe("/gifs/idle.gif");
    expect(generalResponseGifSrc("happy")).toBe("/gifs/happy.gif");
  });
});

describe("matchPhraseSignGif", () => {
  for (const entry of PHRASE_SIGN_GIFS) {
    describe(entry.phraseKey, () => {
      it("matches canonical phrase key", () => {
        const match = matchPhraseSignGif(entry.phraseKey);
        expect(match?.phraseKey).toBe(entry.phraseKey);
        expect(match?.fileName).toBe(entry.fileName);
      });

      it("getPhraseSignGifByPhraseKey resolves the same entry", () => {
        const byKey = getPhraseSignGifByPhraseKey(entry.phraseKey);
        expect(byKey?.fileName).toBe(entry.fileName);
      });

      it.each(entry.variants)("matches variant %j", (variant) => {
        const match = matchPhraseSignGif(variant);
        expect(match?.phraseKey, `variant "${variant}"`).toBe(entry.phraseKey);
        expect(match?.fileName).toBe(entry.fileName);
      });

      const realWorld = REAL_WORLD_INPUTS[entry.phraseKey] ?? [];
      it.each(realWorld)("matches real-world input %j", (input) => {
        const match = matchPhraseSignGif(input);
        expect(match?.phraseKey, `input "${input}"`).toBe(entry.phraseKey);
      });
    });
  }
});

describe("matchPhraseSignGif — no false positives", () => {
  const unrelated = [
    "thank you",
    "yes",
    "no",
    "please",
    "sorry",
    "water",
    "food",
    "random sentence",
    "",
    "   ",
  ];

  it.each(unrelated)("does not match unrelated text %j", (text) => {
    expect(matchPhraseSignGif(text)).toBeNull();
  });

  // A short variant word buried in a longer sentence must NOT fire a phrase GIF.
  const buriedSingleWordVariant = [
    "hi everyone, where is the bus station today",
    "can you tell me where the nearest hospital is",
    "the help desk is closed until tomorrow morning honestly",
    "i was thinking maybe we could meet sometime next week",
  ];

  it.each(buriedSingleWordVariant)(
    "does not match buried single-word variant %j",
    (text) => {
      expect(matchPhraseSignGif(text)).toBeNull();
    }
  );
});
