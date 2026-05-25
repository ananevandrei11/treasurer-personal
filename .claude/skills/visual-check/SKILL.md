---
name: visual-check
description: >
  Visual layout checker for the Treasurer frontend (http://localhost:3000).
  Use this skill whenever the user wants to check the UI, verify layout, inspect responsive design,
  find visual bugs, check for overflows or broken grids, or audit console errors.
  Trigger on: "проверь верстку", "visual check", "look at the UI", "check layout",
  "/visual-check", or when user wants to see how a page looks at different screen sizes.
  Accepts an optional list of page paths (e.g. /visual-check /login /dashboard).
  Defaults to "/" if no pages are given.
model: claude-haiku-4-5-20251001
---

# Visual Check

Check the Treasurer frontend layout across breakpoints and report issues concisely.

## Input

Arguments are space-separated page paths. Examples:

- `/visual-check` → check `/`
- `/visual-check /login` → check `/login`
- `/visual-check /login /dashboard /settings` → check all three

If no arguments are provided, default to `["/"]`.

## Steps

### 1. Open the app

Use `list_pages` to find an existing browser tab. If none is open, use `new_page` to open one.

Base URL: `http://localhost:3000`

### 2. Ensure authentication

Before checking any pages, navigate to `http://localhost:3000/` and check if the result URL is `/login`. If it is, perform login:

1. Navigate to `http://localhost:3000/login`
2. Fill the email field (selector: `input[type="email"]`) with `testuser@example.com`
3. Fill the password field (selector: `input[type="password"]`) with `password123`
4. Click the submit button (selector: `button[type="submit"]`)
5. Wait for navigation away from `/login` using `wait_for` (condition: `url` does not contain `/login`)
6. Confirm login succeeded by checking current URL

Credentials come from `frontend/DEVELOPMENT.md`. If login fails, stop and report the error.

### 3. For each page

Navigate to `http://localhost:3000{path}` using `navigate_page`.

**Redirect check**: after navigation, call `list_pages` and compare the current URL with the requested one. If they differ unexpectedly (not counting query params or trailing slashes), stop for this page and report:

> ⚠️ `/categories` — unexpected redirect to `<url>`. Skipping layout check.

Then for each breakpoint **in order** — 375, 768, 1024, 1440:

1. `resize_page` to the target width (use height 812 for 375, 900 for others)
2. `take_screenshot` — visually inspect the result for:
   - **Overflow**: elements spilling outside the viewport, horizontal scrollbar
   - **Grid**: broken columns, misaligned items, unexpected wrapping
   - **Readability**: text truncated, contrast issues, overlapping elements, icons clipped

Note issues per breakpoint. If a breakpoint looks fine, note it as ✓.

### 3. Console errors

After checking all pages, call `list_console_messages` and filter for `error` and `warning` level messages. Ignore network-level noise (favicon 404, HMR websocket). Report only actionable errors.

## Output format

Write a compact report. Use this structure:

```
## Visual Check Report

### /login
| Breakpoint | Status | Issues |
|---|---|---|
| 375 | ⚠️ | Form overflows viewport, submit button clipped |
| 768 | ✓ | — |
| 1024 | ✓ | — |
| 1440 | ⚠️ | Input width exceeds container |

### /dashboard
...

### Console
- [error] TypeError: Cannot read property 'x' of undefined (auth.js:42)
- No warnings
```

If everything is clean across all pages and breakpoints, say so in one line.

Keep descriptions short — one phrase per issue is enough. No need to explain how to fix.
