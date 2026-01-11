---
description: How to update bookmarks on the Benchmarks page
---

Whenever you have a new `public/bookmarks_2025_11_2.html` file (exported from your browser):

1.  Place the new file in the `public/` directory (ensure the filename matches or update the script).
// turbo
2.  Run the parsing script:
    ```bash
    node scripts/parse-bookmarks.mjs
    ```
3.  The `src/data/bookmarks.json` file will be updated automatically, and the Benchmarks page will reflect the changes on next build.
