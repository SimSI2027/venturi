#!/bin/sh
# Build docs/index.html from src/ with the cutaway skill, then add the page's title, meta tags and favicon.
node "$HOME/.claude/skills/cutaway/sims/build.mjs" ./src >> logs.txt 2>&1 &&
  node scripts/head.mjs cutaway-out/dist/src.html docs/index.html
