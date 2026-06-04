# Sign language GIFs

Place GIF files in this folder. The app uses two kinds:

1. **Mood GIFs** — general AI assistant replies (listening, thinking, happy, …)
2. **Phrase GIFs** — real sign clips for common phrases (filename = the signed phrase)

There is no `neutral.gif`. Calm/default AI replies use `idle.gif`.

## Folder

```
frontend/public/gifs/
```

## Mood GIFs (AI replies)

| File | Used when |
|------|-----------|
| `idle.gif` | Listening, neutral, default |
| `thinking.gif` | Processing |
| `happy.gif` | Positive / cheerful |
| `empathetic.gif` | Supportive / sorry tone |
| `question.gif` | Clarifying question (also mapped to keyboard **Question**) |
| `help.gif` | Help / urgent (also mapped to keyboard **Help**) |
| `encourage.gif` | Praise / motivation |
| `confused.gif` | Uncertain |
| `goodbye.gif` | Goodbye (also mapped to **bye**, **see you**) |

## Phrase GIFs (sign keyboard + matching messages)

Keep the **exact filename** (spaces and casing matter on disk).

| File | Phrase key | Also matches |
|------|------------|--------------|
| `hello.gif` | hello | hi, hey, good day |
| `how are you.gif` | how are you | how r you, how are u |
| `good morning.gif` | good morning | morning, gm |
| `what's up.gif` | what's up | whats up, wassup, sup |
| `excuse me.gif` | excuse me | pardon, pardon me |
| `please repeat.gif` | please repeat | say again, repeat that, one more time |
| `I Dont Understand.gif` | i don't understand | i dont understand, don't understand |
| `is it far.gif` | is it far | how far, far away, distance |
| `i enjoy this.gif` | i enjoy this | i like this, love this, having fun |
| `maybe.gif` | maybe | perhaps, possibly, not sure |

Phrases without a GIF (thank you, yes, no, please, sorry, good, bad, water, food) still use the **2D sign widget** in the preview panel.

## Tips

- Keep each file under ~2 MB when possible.
- Prefer square or portrait clips (~480×480) — they fit the preview panel with `object-contain`.
- Until a file is missing, the UI shows a labeled emoji fallback with the expected filename.
