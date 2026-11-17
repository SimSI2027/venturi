1. Run 24 (2026-11-17) · small fixes, v3.0.4. 0 shape work, 0 Blender; correction 51 appended to the git-ignored VENTURI_JOB.md and replaces correction 50: progress follows position.
2. Item 2: on step n, steps 1 to n-1 are done and n to 29 are not, however n was reached. Next, Back, the arrow keys, a click on a list row and a click on a list checkbox (goes to that step) all agree; the card's "x of 29 done", the list ticks, the dashes and the mode pill are one number.
3. Done ticks the current step and moves to the next; on step 29 it marks all 29 done (unticking it there drops to 28). Going to any other step clears that.
4. Item 3: each mode's current step (venturi.step.v2) and the step-29 Done (venturi.fin.v3) are saved, so a reload returns to the same step with the same count; the old ticks (venturi.done.v2) are removed once on first load (checked with a planted old tick: both pills read 0/29).
5. Item 4: scratch/modes.mjs (git-ignored) has the 5 cases in both modes, all pass: Next x3 = 3 of 29; Back x1 = 2; list click on step 12 = 11; Done on step 29 = 29 of 29; reload on step 12 = 11 of 29 on step 12. Also arrows, checkbox click, Done on step 12 (12 of 29). 99 checks, 0 failures, 0 console errors.
6. Account script: 111 parts, 0 failures, 0 console errors.
7. Screenshot scratch/run24_a.png: TEAR DOWN step 9 at 800 px reached by Back from step 13, "8 of 29 done", 8 dashes, pill 8/29, 0 console errors.
8. Changed: src/guide.js only (docs rebuilt). Items 1 and 4 touch git-ignored files, so only item 2-3 and this file are commits.
9. Live: https://simsi2027.github.io/venturi/ (200 check in the run's last message) · tag v3.0.4.
10. Look at: the 800 px screenshot; with Done on step 29 a later Back or list click drops the count (position rule). Not done from before: brightness checked in 8 of 58 steps; the 7 unclear marks; real scale in the tray; K16 at step 9. Shape work stays closed (correction 39).
