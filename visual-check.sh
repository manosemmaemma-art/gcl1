#!/bin/bash
# ──────────────────────────────────────────────────
# GritCore Visual Regression Check
# Run after any UI edit to catch visual regressions
# ──────────────────────────────────────────────────

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
BOLD='\033[1m'

cd "$(dirname "$0")"

echo ""
echo -e "${BOLD}═══════════════════════════════════════${NC}"
echo -e "${BOLD}  GritCore Visual Regression Check${NC}"
echo -e "${BOLD}═══════════════════════════════════════${NC}"
echo ""

if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}First run detected — installing dependencies...${NC}"
  npm install
  npx playwright install chromium
  echo ""
fi

SNAPSHOT_DIR="tests/visual-regression.spec.js-snapshots"
if [ ! -d "$SNAPSHOT_DIR" ] || [ -z "$(ls -A "$SNAPSHOT_DIR" 2>/dev/null)" ]; then
  echo -e "${YELLOW}No baseline screenshots found — creating them now...${NC}"
  echo ""
  npx playwright test --update-snapshots
  echo ""
  echo -e "${GREEN}✓ Baselines created successfully!${NC}"
  echo -e "  Stored in: ${SNAPSHOT_DIR}/"
  echo ""
  echo -e "${BOLD}Run this script again after making UI changes to check for regressions.${NC}"
  exit 0
fi

echo -e "Running visual tests..."
echo ""

if npx playwright test 2>&1; then
  echo ""
  echo -e "${GREEN}${BOLD}═══════════════════════════════════${NC}"
  echo -e "${GREEN}${BOLD}  ✓ ALL VISUAL CHECKS PASSED${NC}"
  echo -e "${GREEN}${BOLD}═══════════════════════════════════${NC}"
  echo ""
  exit 0
else
  EXIT_CODE=$?
  echo ""
  echo -e "${RED}${BOLD}═══════════════════════════════════${NC}"
  echo -e "${RED}${BOLD}  ✗ VISUAL REGRESSIONS DETECTED${NC}"
  echo -e "${RED}${BOLD}═══════════════════════════════════${NC}"
  echo ""
  echo -e "${YELLOW}What to do:${NC}"
  echo -e "  1. Check the diff images in: test-results/"
  echo -e "  2. Open the HTML report:  npx playwright show-report"
  echo -e "  3. Fix the CSS/HTML issues"
  echo -e "  4. Re-run:  ./visual-check.sh"
  echo ""
  echo -e "${YELLOW}If the changes are intentional, update baselines:${NC}"
  echo -e "  npm run test:visual:update"
  echo ""
  exit $EXIT_CODE
fi
