# Obsidian Manual Sync Guide

This document explains how to manually sync your Obsidian vault with Glog.

## 1. Vault Structure
Ensure your Obsidian vault follows the Glog frontmatter format. 

### Required Frontmatter
```markdown
---
title: 'Your Title'
description: 'Brief summary'
pubDate: '2026-01-18'
tags: ['tag1', 'tag2']
# Optional: password for protected posts
# password: 'your-secret-code'
---
```

## 2. Syncing methods

### Method A: Direct File Copy (NAS)
If you use a NAS (Synology, QNAP, etc.):
1. Mount your NAS blog folder to your local machine.
2. Draft your posts in Obsidian.
3. When ready to publish, copy/move the `.md` file to `src/content/blog/` in the Glog project root.

### Method B: Git Sync
1. Use the **Obsidian Git** plugin.
2. Push your notes to a private repository.
3. Pull the repository into the `src/content/blog/` directory of your Glog instance.

## 3. Image Management (NAS as Image Bed)
Instead of using public image beds like Lsky Pro, you can use your NAS:
1. Upload images to a public folder on your NAS.
2. Generate a shared link or use the direct file path if hosted on the same server.
3. Reference the image in your Markdown:
   ```markdown
   ![Alt text](http://your-nas-ip:port/sharing/image.jpg)
   ```

## 4. Finalizing Publication
After syncing files, run the build command:
```bash
bun run build
```
Or wait for your CI/CD (GitHub Actions) to trigger reaching the new files.
