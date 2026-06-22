# Chapter 14 Drill — TDD + Debugging End-to-End

Do **both** mini-workflows on real (or realistic) code.

## A — TDD
1. "Write failing tests for `<small function>` covering `<cases>`. Don't implement yet."
2. Confirm red. Then: "Implement until the tests pass. Don't modify the tests."
3. Confirm green; review; commit.

## B — Debugging
1. Give Claude an error + stack trace + repro + expected-vs-actual.
2. "Diagnose the root cause and explain it before changing anything." (Read-only / plan mode.)
3. Review the diagnosis. Then: "Fix it and add a regression test that fails without the fix."

## Reflection
- In TDD, did Claude ever try to weaken a test to pass? How did the explicit guard help?
- In debugging, did the forced *diagnosis-first* step reveal a root cause different from the obvious symptom?
- Which of the four meta-moves (understand / verify / scope / increment, Ch. 14 §7) did the most work for you?
</content>
