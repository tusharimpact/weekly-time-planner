# ⏳ 168 Hours — Weekly Time & Life OS

> **"Master your 168 weekly hours with intention and human life perspective."**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)
[![100% Private](https://img.shields.io/badge/Privacy-100%25%20Local-emerald.svg)](#-privacy--storage)

---

## 🔗 Live Demo

👉 **[Launch Live App](https://tusharimpact.github.io/weekly-time-planner/)**

---

## 💡 What is this App About?

Everyone on Earth has exactly **168 hours in a single week** ($7 \text{ days} \times 24 \text{ hours} = 168 \text{ hours}$). How you allocate those 168 hours determines your health, career progression, relationships, and personal growth.

**168 Hours** is a modern, interactive single-page application designed to give you complete clarity on how your weekly hours are distributed. It allows you to visually plan every hour of your week, assign custom activity legends, track allocated vs. unallocated time in real-time, and maintain a high-level human life perspective.

---

## 🎯 Why Was This App Created?

### 1. **The 4,000 Weeks Perspective**
An average human lifespan is roughly **4,000 weeks** (~76.9 years). When you realize how few weeks we truly have, every 168-hour block becomes invaluable. This app embeds a live **Human Life Calculator** that shows you how many weeks you've lived and how many remain based on your age, encouraging intentional living.

### 2. **Sleep-First Architecture (10 PM to 9 PM)**
Most conventional calendars start at midnight or 8:00 AM, treating sleep as an afterthought. **168 Hours** flips this paradigm by starting every day at **10:00 PM at night**. Quality sleep (10 PM to 6 AM) is the foundation of a successful day — if your night is ruined, your next day suffers.

### 3. **Saturday to Friday Week Structure**
Designed for modern flexible schedules, the week runs horizontally from **Saturday through Friday**, placing weekend preparation and rest at the forefront of weekly planning.

### 4. **Pre-Rendered Core Defaults**
To save time, the planner pre-renders essential weekly routines:
- **Sleep:** 8 hours/day (10 PM – 6 AM = 56 hrs)
- **Routine Work:** 4 hours/day (6 AM – 8 AM & 7 PM – 9 PM = 28 hrs)
- **9-to-5 Work:** 8 hours/day on general workdays (40 hrs)
- **Unallocated Time:** Live tracking of remaining hours (44 hrs default)

---

## ✨ Key Features

- 📊 **Daily & Weekly Percentage Metrics:** Live percentage breakdown per legend across both daily (24h) and weekly (168h) allocations.
- 🎯 **Click-to-Toggle Box Selection:** Tap/click any cell to assign the active legend brush. Tap the same cell again to unselect it and revert to unallocated time.
- ⏰ **Custom Time Block Units:** Select your preferred planning block granularity from the top bar dropdown:
  - **1 Hour Blocks** (Default - 168 total blocks)
  - **15 Min Blocks** (672 total blocks for micro-tasking)
  - **30 Min Blocks** (336 total blocks)
  - **2 Hour Blocks** (84 total blocks)
  - **4 Hour Blocks** (42 total blocks)
- 📅 **168-Hour Schedule Matrix:** 7 Days (Sat–Fri) × Vertical Time Slots (10 PM–9 PM).
- 🖌️ **Click & Drag-to-Paint:** Select an active legend brush and drag across cells to rapidly assign blocks of time.
- 🎨 **Dynamic Legend System:** Create, edit, and update custom categories with color pickers and palettes.
- 📄 **Microsoft Word (`.docx`) Export:** Download a complete, beautifully formatted `.docx` file containing:
  - Weekly Category Summary Table.
  - Detailed Day-by-Day Chronological Task Agenda.
  - Full 7-Day Visual Schedule Matrix Table.
  - Personal Reflections & Goal Worksheet.
- ⌛ **Human Life Calculator:** Input your age to calculate weeks lived, weeks remaining, percentage completed, and lifetime hours left.
- 🔒 **100% Client-Side Privacy:** All data is persisted safely in browser `localStorage`. Zero server tracking.

---

## 🛠️ Local Setup & Installation

This application is built with standard web technologies (HTML5, Tailwind CSS, JavaScript ES Modules, and DocxJS) with zero build steps required.

### Quick Start (No Node required):

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/weekly-time-planner.git
   cd weekly-time-planner
   ```

2. **Open directly in your browser:**
   Double-click `index.html` or open it directly:
   ```bash
   open index.html
   ```

3. **Or run with a local Python server:**
   ```bash
   python3 -m http.server 8080
   ```
   Navigate to `http://localhost:8080` in your web browser.

---

## 🚀 Deployment Guide

### Deploying to Vercel (Recommended)

#### Option 1: Via Vercel CLI
```bash
npm i -g vercel
vercel
```

#### Option 2: Via GitHub Integration
1. Push this repository to GitHub.
2. Go to [Vercel Dashboard](https://vercel.com/new).
3. Import your GitHub repository.
4. Click **Deploy** (Zero configuration needed — `vercel.json` is included!).

---

### Deploying to GitHub Pages

1. Go to your repository settings on GitHub.
2. Navigate to **Pages** (under Code and automation).
3. Set **Source** to `Deploy from a branch`.
4. Select `main` branch and `/ (root)` folder.
5. Click **Save**. Your app will be live at `https://tusharimpact.github.io/weekly-time-planner/`!

---

## 📁 Project Structure

```text
weekly-time-planner/
├── index.html        # Main SPA interface & modal layout
├── app.js            # Schedule matrix logic, legend manager & drag-to-paint engine
├── styles.css        # Custom styles, matrix cell hover effects, and print CSS
├── docx-exporter.js  # Microsoft Word (.docx) document generator
├── vercel.json       # Vercel deployment configuration
├── .gitignore        # Git ignore rules
└── README.md         # Documentation & setup guide
```

---

## 📄 License

Distributed under the MIT License. Feel free to fork, customize, and share!
