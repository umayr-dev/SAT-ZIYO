# SAT Practice Platform - UX/UI Flow Documentation

Complete user journey and interface specifications for the Digital SAT practice platform.

## Table of Contents

1. [User Roles](#user-roles)
2. [Student Journey](#student-journey)
3. [Test Taking Experience](#test-taking-experience)
4. [Screen-by-Screen Specifications](#screen-by-screen-specifications)
5. [Admin Journey](#admin-journey)
6. [UI Components](#ui-components)
7. [Accessibility Considerations](#accessibility-considerations)

---

## User Roles

### Student
- Browse available practice tests
- Take full-length SAT practice tests
- Review results and explanations
- Track progress over time

### Admin
- Create SAT test templates
- Add/edit/delete questions
- Validate test completeness
- Monitor test usage

---

## Student Journey

### Overview Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Login     │ ──▶ │  Dashboard  │ ──▶ │ Test List   │ ──▶ │ Start Test  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
                    ┌──────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         TEST TAKING FLOW                                 │
│                                                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐           │
│  │ English  │ ─▶ │ English  │ ─▶ │  10 min  │ ─▶ │   Math   │           │
│  │ Module 1 │    │ Module 2 │    │  Break   │    │ Module 1 │           │
│  │ (32 min) │    │ (32 min) │    │          │    │ (35 min) │           │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘           │
│                                                        │                 │
│                                                        ▼                 │
│                                                  ┌──────────┐            │
│                                                  │   Math   │            │
│                                                  │ Module 2 │            │
│                                                  │ (35 min) │            │
│                                                  └──────────┘            │
│                                                        │                 │
└────────────────────────────────────────────────────────┼─────────────────┘
                                                         ▼
                                              ┌─────────────────┐
                                              │    Results &    │
                                              │     Review      │
                                              └─────────────────┘
```

### Detailed Flow

1. **Login/Registration**
   - Email + Password login
   - Google OAuth option
   - OTP verification for new accounts

2. **Dashboard**
   - Welcome message
   - Quick stats (tests taken, average score)
   - "Continue Test" button (if in-progress attempt exists)
   - "Start New Test" button

3. **Test Selection**
   - List of available practice tests
   - Each test shows:
     - Title and description
     - Total duration (~2 hours 14 minutes)
     - Number of questions (98)
     - Previous attempts and scores

4. **Pre-Test Instructions**
   - Test overview
   - Rules and timing
   - Tips for success
   - "Begin Test" confirmation

5. **Test Taking** (see detailed section below)

6. **Results**
   - Overall score
   - Section-by-section breakdown
   - Question-by-question review
   - Explanations for each question

---

## Test Taking Experience

### Module Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ENGLISH SECTION (64 minutes)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Module 1 (32 minutes)                                          │
│   ├── 27 Questions                                               │
│   ├── Mix of difficulties (EASY, MEDIUM, HARD)                   │
│   └── All students get same questions                            │
│                                                                  │
│   ▼ [Finish Module 1]                                            │
│                                                                  │
│   Module 2 (32 minutes) ← ADAPTIVE                               │
│   ├── 27 Questions                                               │
│   ├── If Module 1 score >= 67%: HARD questions                   │
│   └── If Module 1 score < 67%: EASY questions                    │
│                                                                  │
│   ▼ [Finish Module 2]                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    10-MINUTE BREAK                               │
│   • Timer countdown displayed                                    │
│   • Student can end break early                                  │
│   • Automatic transition when break ends                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MATH SECTION (70 minutes)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Module 1 (35 minutes)                                          │
│   ├── 22 Questions                                               │
│   ├── Calculator allowed (Desmos)                                │
│   └── Mix of MCQ and Grid-in questions                           │
│                                                                  │
│   ▼ [Finish Module 1]                                            │
│                                                                  │
│   Module 2 (35 minutes) ← ADAPTIVE                               │
│   ├── 22 Questions                                               │
│   ├── Difficulty based on Module 1 performance                   │
│   └── Mix of MCQ and Grid-in questions                           │
│                                                                  │
│   ▼ [Submit Test]                                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Question Navigation

Within each module, students can:
- Move forward/backward through questions
- Jump to any question using the navigator
- Flag questions for review (UI feature, not API)
- See which questions are answered/unanswered

```
┌─────────────────────────────────────────────────────────────────┐
│  Question Navigator                                              │
│                                                                  │
│  [1] [2] [3] [4] [5] [6] [7] [8] [9] [10] [11] [12] [13]        │
│                                                                  │
│  [14] [15] [16] [17] [18] [19] [20] [21] [22] [23] [24]         │
│                                                                  │
│  [25] [26] [27]                                                  │
│                                                                  │
│  Legend:                                                         │
│  ■ Current    ● Answered    ○ Unanswered    ⚑ Flagged           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Screen-by-Screen Specifications

### 1. Test List Screen

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back                           SAT Practice Tests             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  SAT Practice Test 1                                     │    │
│  │  ─────────────────────────────────────────────────────  │    │
│  │  Full-length Digital SAT practice test                   │    │
│  │                                                          │    │
│  │  ⏱ 2h 14min    📝 98 questions    📊 Your best: 1350    │    │
│  │                                                          │    │
│  │  [Continue Test]  or  [Start New Attempt]                │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  SAT Practice Test 2                                     │    │
│  │  ─────────────────────────────────────────────────────  │    │
│  │  Full-length Digital SAT practice test                   │    │
│  │                                                          │    │
│  │  ⏱ 2h 14min    📝 98 questions    📊 Not attempted      │    │
│  │                                                          │    │
│  │                    [Start Test]                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Pre-Test Instructions Screen

```
┌─────────────────────────────────────────────────────────────────┐
│                     SAT Practice Test 1                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📋 Test Overview                                                │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  This test consists of two sections:                             │
│                                                                  │
│  1. Reading and Writing (64 minutes)                             │
│     • Module 1: 27 questions, 32 minutes                         │
│     • Module 2: 27 questions, 32 minutes (adaptive)              │
│                                                                  │
│  2. Math (70 minutes)                                            │
│     • Module 1: 22 questions, 35 minutes                         │
│     • Module 2: 22 questions, 35 minutes (adaptive)              │
│     • Calculator allowed (Desmos provided)                       │
│                                                                  │
│  ⏸ 10-minute break between sections                              │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  📌 Important Notes:                                             │
│  • You can navigate between questions within a module            │
│  • Once you finish a module, you cannot go back                  │
│  • Your progress is saved automatically                          │
│  • No penalty for wrong answers - answer every question!         │
│                                                                  │
│                                                                  │
│               [ Cancel ]        [ Begin Test ]                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Question Screen - Multiple Choice

```
┌─────────────────────────────────────────────────────────────────┐
│  Reading & Writing    Module 1    ⏱ 28:45    Question 5 of 27   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                       PASSAGE                            │    │
│  │                                                          │    │
│  │  The following passage is adapted from a 2019 article    │    │
│  │  about renewable energy sources.                         │    │
│  │                                                          │    │
│  │  Solar power has emerged as one of the most promising    │    │
│  │  alternatives to fossil fuels. Unlike coal or natural    │    │
│  │  gas, solar energy produces no direct carbon emissions   │    │
│  │  during operation. However, the manufacturing process    │    │
│  │  for solar panels does require significant energy        │    │
│  │  inputs, leading some critics to question the net        │    │
│  │  environmental benefit.                                  │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Which choice best describes the main purpose of the             │
│  passage?                                                        │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  ○  A) To argue that solar power is superior to         │    │
│  │        fossil fuels                                      │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │  ●  B) To present both benefits and drawbacks of        │    │
│  │        solar energy                                      │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │  ○  C) To criticize the solar panel manufacturing       │    │
│  │        process                                           │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │  ○  D) To compare different types of renewable          │    │
│  │        energy                                            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  [ ← Previous ]              [ ⚑ Flag ]              [ Next → ] │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 1  2  3  4 [5] 6  7  8  9  10 11 12 13 14 15 16 17 ...  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4. Question Screen - With Graph/Chart

```
┌─────────────────────────────────────────────────────────────────┐
│  Math    Module 1    ⏱ 31:20    Question 12 of 22    [📐 Calc]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                          │    │
│  │              📊 [BAR CHART IMAGE]                        │    │
│  │                                                          │    │
│  │    Population Growth by Region (2010-2020)               │    │
│  │    ┌────┬────┬────┬────┬────┐                           │    │
│  │    │    │    │    │    │    │                           │    │
│  │    │ ██ │ ██ │ ██ │ ██ │ ██ │                           │    │
│  │    │ ██ │ ██ │ ██ │ ██ │ ██ │                           │    │
│  │    │ ██ │ ██ │ ██ │ ██ │ ██ │                           │    │
│  │    └────┴────┴────┴────┴────┘                           │    │
│  │      A    B    C    D    E                               │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Based on the bar chart above, which region showed the           │
│  greatest percentage increase in population?                     │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  ○  A) Region A                                         │    │
│  │  ○  B) Region B                                         │    │
│  │  ●  C) Region C                                         │    │
│  │  ○  D) Region D                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  [ ← Previous ]              [ ⚑ Flag ]              [ Next → ] │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5. Question Screen - Student-Produced Response (Grid-in)

```
┌─────────────────────────────────────────────────────────────────┐
│  Math    Module 2    ⏱ 25:10    Question 18 of 22    [📐 Calc]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  If 3x + 7 = 22, what is the value of x?                        │
│                                                                  │
│                                                                  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                          │    │
│  │  Enter your answer:                                      │    │
│  │                                                          │    │
│  │  ┌─────────────────────────────────┐                    │    │
│  │  │              5                  │                    │    │
│  │  └─────────────────────────────────┘                    │    │
│  │                                                          │    │
│  │  💡 Tips:                                                │    │
│  │  • Enter only the numerical answer                       │    │
│  │  • Use "/" for fractions (e.g., 3/4)                    │    │
│  │  • Use "." for decimals (e.g., 0.75)                    │    │
│  │  • Use "-" for negative numbers (e.g., -5)              │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│                                                                  │
│  [ ← Previous ]              [ ⚑ Flag ]              [ Next → ] │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16 17 [18] │    │
│  │ 19 20 21 22                                             │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6. Module Completion Screen

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│                                                                  │
│                    ✓ Module 1 Complete                          │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  You have completed Module 1 of the Reading & Writing section.  │
│                                                                  │
│  Summary:                                                        │
│  • Questions answered: 27 / 27                                   │
│  • Time used: 28 minutes 45 seconds                              │
│                                                                  │
│  ⚠️ Important:                                                   │
│  Once you proceed, you cannot return to Module 1.                │
│                                                                  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              [ Review Answers ]                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │           [ Continue to Module 2 → ]                     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7. Break Screen

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│                                                                  │
│                         ☕ Break Time                            │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│         You have completed the Reading & Writing section!        │
│                                                                  │
│              Take a 10-minute break before Math.                 │
│                                                                  │
│                                                                  │
│                    ┌─────────────────┐                          │
│                    │                 │                          │
│                    │     08:32       │                          │
│                    │                 │                          │
│                    └─────────────────┘                          │
│                      Time Remaining                              │
│                                                                  │
│                                                                  │
│  💡 Tips during your break:                                      │
│  • Stretch and move around                                       │
│  • Rest your eyes                                                │
│  • Have a light snack and water                                  │
│  • Don't start studying or reviewing                             │
│                                                                  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              [ End Break Early → ]                       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8. Results Summary Screen

```
┌─────────────────────────────────────────────────────────────────┐
│                     Test Results                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                    🎉 Congratulations!                           │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                          │    │
│  │                    Your Score                            │    │
│  │                                                          │    │
│  │                      1280                                │    │
│  │                    ─────────                             │    │
│  │                    out of 1600                           │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────┐  ┌────────────────────────┐         │
│  │  Reading & Writing     │  │       Math             │         │
│  │                        │  │                        │         │
│  │        640             │  │        640             │         │
│  │      ────────          │  │      ────────          │         │
│  │      out of 800        │  │      out of 800        │         │
│  │                        │  │                        │         │
│  │   47/54 correct (87%)  │  │   38/44 correct (86%)  │         │
│  └────────────────────────┘  └────────────────────────┘         │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  Performance by Content Domain:                                  │
│                                                                  │
│  Information & Ideas      ████████████░░░░  78%                 │
│  Craft & Structure        ██████████████░░  92%                 │
│  Expression of Ideas      ███████████████░  96%                 │
│  Standard English Conv.   ██████████████░░  88%                 │
│  Algebra                  █████████████░░░  84%                 │
│  Advanced Math            ████████████░░░░  80%                 │
│  Problem Solving & Data   ██████████████░░  90%                 │
│  Geometry & Trig          ███████████░░░░░  72%                 │
│                                                                  │
│                                                                  │
│  [ Review All Questions ]      [ Back to Dashboard ]            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 9. Question Review Screen

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back to Results              Question Review                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Reading & Writing > Module 1 > Question 5                       │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  ✓ CORRECT                                              │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  PASSAGE                                                 │    │
│  │                                                          │    │
│  │  Solar power has emerged as one of the most promising    │    │
│  │  alternatives to fossil fuels...                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Which choice best describes the main purpose of the passage?   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  ○  A) To argue that solar power is superior to         │    │
│  │        fossil fuels                                      │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │  ● ✓ B) To present both benefits and drawbacks of       │    │
│  │        solar energy                     [YOUR ANSWER]    │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │  ○  C) To criticize the solar panel manufacturing       │    │
│  │        process                                           │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │  ○  D) To compare different types of renewable          │    │
│  │        energy                                            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  📖 EXPLANATION                                          │    │
│  │                                                          │    │
│  │  The correct answer is B. The passage presents solar     │    │
│  │  energy's benefit (no direct carbon emissions) while     │    │
│  │  also acknowledging a drawback (energy-intensive         │    │
│  │  manufacturing). This balanced presentation indicates    │    │
│  │  the author's purpose is to show both sides.             │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  [ ← Previous Question ]              [ Next Question → ]        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Admin Journey

### Admin Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Login     │ ──▶ │  Dashboard  │ ──▶ │ Manage Tests│
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                    ┌──────────────────────────┼──────────────────┐
                    ▼                          ▼                  ▼
            ┌─────────────┐          ┌─────────────┐     ┌─────────────┐
            │ Create New  │          │ Edit Test   │     │  Validate   │
            │    Test     │          │  Questions  │     │    Test     │
            └─────────────┘          └─────────────┘     └─────────────┘
```

### Admin Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  Admin Dashboard                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Quick Stats                                                     │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐        │
│  │  Total Tests  │  │ Total Users   │  │ Tests Taken   │        │
│  │       5       │  │      234      │  │     1,892     │        │
│  └───────────────┘  └───────────────┘  └───────────────┘        │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  Tests                            [ + Create SAT Test Template ] │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  SAT Practice Test 1           ✓ Complete    147/147    │    │
│  │  Created: Jan 10, 2024         Attempts: 892            │    │
│  │                                                          │    │
│  │  [ Edit ]  [ View Questions ]  [ Validate ]  [ Delete ] │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  SAT Practice Test 2           ⚠ Incomplete   98/147    │    │
│  │  Created: Jan 15, 2024         Attempts: 0              │    │
│  │                                                          │    │
│  │  [ Edit ]  [ View Questions ]  [ Validate ]  [ Delete ] │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Add Question Form

```
┌─────────────────────────────────────────────────────────────────┐
│  Add Question to: English > Module 1 (EASY)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Question Type:                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  ● Multiple Choice    ○ Student-Produced (Grid-in)      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Content Domain:                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  ▼ Information and Ideas                                │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Difficulty:                                                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  ○ Easy    ● Medium    ○ Hard                           │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Passage (optional):                                             │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  The scientist conducted experiments that revealed...    │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Image URL (optional):                                           │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  https://storage.example.com/charts/graph1.png          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Question Text:                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Which choice best maintains the sentence's focus on    │    │
│  │  the scientist's methodology?                            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Choices:                                                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  A: [ careful observation          ] ○ Correct          │    │
│  │  B: [ systematic approach          ] ● Correct          │    │
│  │  C: [ interesting findings         ] ○ Correct          │    │
│  │  D: [ popular theories             ] ○ Correct          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Explanation:                                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  The correct answer is B because "systematic approach"   │    │
│  │  relates directly to methodology...                      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│              [ Cancel ]              [ Save Question ]           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## UI Components

### Timer Component

```
States:
- Normal:    ⏱ 28:45  (white/default color)
- Warning:   ⏱ 04:59  (yellow, < 5 minutes)
- Critical:  ⏱ 00:59  (red, < 1 minute, pulsing)
```

### Question Navigator States

```
○ = Unanswered (empty circle, gray border)
● = Answered (filled circle, blue)
■ = Current (filled square, dark blue)
⚑ = Flagged (with flag icon overlay)
```

### Answer Selection States

```
○ = Unselected (empty radio)
● = Selected (filled radio, blue background)
✓ = Correct (green, shown in review only)
✗ = Incorrect (red, shown in review only)
```

### Progress Indicators

```
Module Progress:  [=====>              ] 27% (5/27)
Section Progress: [===========>        ] 50% (Module 1 complete)
```

---

## Accessibility Considerations

### Keyboard Navigation
- `Tab` / `Shift+Tab`: Navigate between elements
- `Enter` / `Space`: Select answer or button
- `Arrow keys`: Navigate between choices
- `N`: Next question
- `P`: Previous question
- `F`: Flag/unflag question
- `1-9`: Jump to question (within current view)

### Screen Reader Support
- All images must have descriptive alt text
- Question numbers announced: "Question 5 of 27"
- Timer updates announced every 5 minutes and every minute under 5
- Answer selection confirmed: "Selected option B"

### Visual Accessibility
- Minimum contrast ratio: 4.5:1
- Focus indicators visible on all interactive elements
- No information conveyed by color alone
- Text resizable up to 200% without loss of functionality

### Color Coding Guide

```
Primary actions:    Blue (#2563EB)
Success/Correct:    Green (#16A34A)
Error/Incorrect:    Red (#DC2626)
Warning/Time:       Yellow (#CA8A04)
Neutral/Inactive:   Gray (#6B7280)
```
