import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  PHRASE_SIGN_GIFS,
  matchPhraseSignGif,
} from "@/lib/sign/phraseSignGifs";
import {
  applyAssistantGifPreview,
  applySignPreviewFromText,
} from "@/lib/sign/signPreviewHelpers";

const setSignPreview = vi.fn();

vi.mock("@/lib/state/sessionStore", () => ({
  useSessionStore: {
    getState: () => ({
      setSignPreview,
      signShowSpacesBetweenLetters: false,
    }),
  },
}));

describe("applySignPreviewFromText — phrase GIF mode", () => {
  beforeEach(() => {
    setSignPreview.mockClear();
  });

  for (const entry of PHRASE_SIGN_GIFS) {
    it(`sets phrase-gif preview for "${entry.phraseKey}"`, () => {
      applySignPreviewFromText(entry.phraseKey, "deaf");

      expect(setSignPreview).toHaveBeenCalledWith(
        expect.objectContaining({
          phraseKey: entry.phraseKey,
          previewMode: "phrase-gif",
          phraseGifFile: entry.fileName,
          spellPlan: undefined,
        })
      );
    });

    it(`sets phrase-gif preview for first variant of "${entry.phraseKey}"`, () => {
      const variant = entry.variants[0];
      applySignPreviewFromText(variant, "deaf");

      expect(setSignPreview).toHaveBeenCalledWith(
        expect.objectContaining({
          phraseKey: entry.phraseKey,
          previewMode: "phrase-gif",
          phraseGifFile: entry.fileName,
        })
      );
    });
  }

  it("does not finger-spell when phrase GIF matches", () => {
    applySignPreviewFromText("please repeat", "deaf");
    const call = setSignPreview.mock.calls.at(-1)?.[0];
    expect(call?.previewMode).toBe("phrase-gif");
    expect(call?.spellPlan).toBeUndefined();
  });

  it("falls back to 2D phrase widget for thank you (no GIF)", () => {
    applySignPreviewFromText("thank you", "deaf");
    expect(setSignPreview).toHaveBeenCalledWith(
      expect.objectContaining({
        phraseKey: "thank you",
        previewMode: "sign",
        spellPlan: undefined,
      })
    );
    expect(matchPhraseSignGif("thank you")).toBeNull();
  });
});

describe("applyAssistantGifPreview — phrase-only (no mood avatar)", () => {
  beforeEach(() => {
    setSignPreview.mockClear();
  });

  it("shows a phrase GIF when the reply matches a variant", () => {
    applyAssistantGifPreview("hello");
    expect(setSignPreview).toHaveBeenCalledWith(
      expect.objectContaining({ previewMode: "phrase-gif", phraseGifFile: "hello.gif" })
    );
  });

  it("clears the preview (idle) for a free-form reply with no phrase match", () => {
    applyAssistantGifPreview("Sure, the bus station is two blocks north of here.");
    expect(setSignPreview).toHaveBeenLastCalledWith(null);
  });

  it("never emits the generic mood gif preview mode", () => {
    applyAssistantGifPreview("Let me think about that for a moment.");
    for (const [arg] of setSignPreview.mock.calls) {
      expect(arg?.previewMode).not.toBe("gif");
    }
  });

  it("clears the preview for empty text", () => {
    applyAssistantGifPreview("   ");
    expect(setSignPreview).toHaveBeenLastCalledWith(null);
  });
});
