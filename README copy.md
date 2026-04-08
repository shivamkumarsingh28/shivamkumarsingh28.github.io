# Personal Portfolio — Setup Guide

## 📁 File Structure
```
portfolio/
├── index.html      ← Main HTML (single file, all pages)
├── style.css       ← All styles (dark/light theme, responsive)
├── app.js          ← All JavaScript (routing, GSAP, API, pages)
├── Code.gs         ← Google Apps Script backend (copy to GAS editor)
└── README.md       ← This file
```

---

## 🚀 Quick Start

### Step 1 — Customize your info
Open `app.js` and edit the `CONFIG` object at the top:
```js
const CONFIG = {
  GAS_URL: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
  AUTHOR: {
    name:      'Your Name',
    firstName: 'Your',
    lastName:  'Name',
    // ... edit everything here
  }
};
```

### Step 2 — Set up Google Apps Script backend
1. Go to [script.google.com](https://script.google.com) → **New Project**
2. Delete default code, paste the entire contents of `Code.gs`
3. Click **Deploy** → **New Deployment**
4. Set: Type = **Web app** · Execute as = **Me** · Access = **Anyone**
5. Click **Deploy** → copy the Web App URL
6. Paste URL into `CONFIG.GAS_URL` in `app.js`

### Step 3 — Set up your Google Sheets
In the same Google account, open a **new Google Spreadsheet**.

Create tabs with these column headers:

**`projects` sheet:**
```
id | title | description | tags | emoji | github | link | featured | date
```

**`blog` sheet:**
```
id | title | excerpt | content | tags | emoji | date | author | readTime
```

**`messages` sheet** (auto-created on first contact form submit):
```
firstName | lastName | email | subject | message | timestamp
```

> 💡 **Tip:** The `tags` column should be comma-separated: `JavaScript, React, Node.js`
> 💡 **Tip:** Set `featured` to `true` for projects to appear on the home page
> 💡 **Tip:** `readTime` is in minutes (e.g., `5`)

### Step 4 — Deploy to GitHub Pages
1. Create a new GitHub repository
2. Push all files (`index.html`, `style.css`, `app.js`) — **do not push** `Code.gs`
3. Go to repo **Settings** → **Pages** → Source: **main branch / root**
4. Your site is live at `https://yourusername.github.io/repo-name/`

> ✅ Hash-based routing (`#/projects`, `#/blog`, etc.) is already set up — no 404s!

---

## 🎨 Customization

### Change your photo
In `app.js`, find the `renderHome()` function and replace:
```html
<div class="about-placeholder">{ }</div>
```
with:
```html
<img src="photo.jpg" alt="Your Name" />
```

### Change theme colors
In `style.css`, edit the CSS variables in `:root` (dark) and `[data-theme="light"]`:
```css
:root {
  --accent: #6495ED;        /* Primary accent color */
  --accent-warm: #E8935A;   /* Secondary accent */
  /* ... */
}
```

### Add more project tables
In `app.js` `CONFIG.TABLES`:
```js
TABLES: {
  projects: ['projects', 'webapps', 'opensource', 'freelance'],
  blog:     ['blog', 'tutorials', 'thoughts', 'reviews'],
}
```
Then create matching sheets in your Google Spreadsheet.

---

## 🔌 API Reference

Your GAS backend supports these URL patterns:

| URL | Description |
|-----|-------------|
| `?action=tables` | List all sheet names |
| `?table=projects` | Get all rows from "projects" sheet |
| `?table=projects&filter[featured]=true` | Filter rows |
| `?table=projects&sort=date:desc` | Sort by column |
| `?table=projects&limit=3` | Limit results |
| `?action=submit&table=messages&name=John&email=...` | Submit contact form |

---

## ✅ Checklist

- [ ] Edit `CONFIG.AUTHOR` in `app.js`
- [ ] Deploy `Code.gs` to Google Apps Script
- [ ] Copy Web App URL to `CONFIG.GAS_URL`
- [ ] Create Google Sheets with correct column headers
- [ ] Add your photo (optional)
- [ ] Customize colors in `style.css` (optional)
- [ ] Push to GitHub and enable GitHub Pages
- [ ] Update social links in `index.html` footer

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| HTML5 | Structure |
| CSS3 (Custom Properties) | Styling & theming |
| Vanilla JavaScript (ES2021) | Routing, API, interactivity |
| GSAP 3 | Animations (home page) |
| Google Apps Script | Free backend API |
| Google Sheets | Database |
| GitHub Pages | Hosting |

---

Built with ❤️ and zero npm packages.
