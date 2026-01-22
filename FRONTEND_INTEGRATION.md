# SAT Practice Platform - Frontend Integration Guide

Complete API integration guide for frontend developers.

## Table of Contents

1. [Authentication](#authentication)
2. [Test Discovery](#test-discovery)
3. [Test Taking Flow](#test-taking-flow)
4. [Question Types & Rendering](#question-types--rendering)
5. [Navigation & State Management](#navigation--state-management)
6. [Break Handling](#break-handling)
7. [Results & Review](#results--review)
8. [Admin Panel](#admin-panel)
9. [API Reference](#api-reference)

---

## Authentication

All endpoints require JWT authentication except public auth routes.

```typescript
// Store token after login
const token = response.data.accessToken;
localStorage.setItem('accessToken', token);

// Add to all requests
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

Response:
```json
{
  "id": "uuid",
  "email": "student@example.com",
  "name": "John Doe",
  "role": "STUDENT"
}
```

---

## Test Discovery

### Get Available Tests
```http
GET /practice/tests
```

Response:
```json
[
  {
    "id": "test-uuid",
    "title": "SAT Practice Test 1",
    "description": "Full-length practice test",
    "isActive": true,
    "sections": [
      {
        "sectionType": "ENGLISH",
        "duration": 64,
        "modules": [
          { "moduleNumber": 1, "questionCount": 27, "duration": 32 },
          { "moduleNumber": 2, "questionCount": 27, "duration": 32 }
        ]
      },
      {
        "sectionType": "MATH",
        "duration": 70,
        "allowCalculator": true,
        "modules": [
          { "moduleNumber": 1, "questionCount": 22, "duration": 35 },
          { "moduleNumber": 2, "questionCount": 22, "duration": 35 }
        ]
      }
    ]
  }
]
```

### Get User's Attempt History
```http
GET /practice/my-attempts
```

Response:
```json
[
  {
    "id": "attempt-uuid",
    "testId": "test-uuid",
    "testTitle": "SAT Practice Test 1",
    "status": "COMPLETED",
    "totalScore": 85,
    "startedAt": "2024-01-15T10:00:00Z",
    "completedAt": "2024-01-15T12:15:00Z"
  },
  {
    "id": "attempt-uuid-2",
    "testId": "test-uuid",
    "testTitle": "SAT Practice Test 1",
    "status": "IN_PROGRESS",
    "startedAt": "2024-01-16T14:00:00Z"
  }
]
```

---

## Test Taking Flow

### 1. Start or Resume Test
```http
POST /practice/start/:testId
```

Response:
```json
{
  "attemptId": "attempt-uuid",
  "testTitle": "SAT Practice Test 1",
  "currentSection": {
    "id": "section-uuid",
    "type": "ENGLISH",
    "orderIndex": 0,
    "duration": 64,
    "allowCalculator": false
  },
  "currentModule": {
    "id": "module-uuid",
    "moduleNumber": 1,
    "duration": 32,
    "totalQuestions": 27
  },
  "currentQuestionIndex": 0,
  "question": {
    "id": "question-uuid",
    "questionText": "Which choice best maintains the sentence's focus?",
    "questionType": "MULTIPLE_CHOICE",
    "orderIndex": 0,
    "passage": "The scientist conducted experiments that revealed...",
    "imageUrl": null,
    "choices": [
      { "id": "choice-1", "choiceText": "Option A", "orderIndex": 0 },
      { "id": "choice-2", "choiceText": "Option B", "orderIndex": 1 },
      { "id": "choice-3", "choiceText": "Option C", "orderIndex": 2 },
      { "id": "choice-4", "choiceText": "Option D", "orderIndex": 3 }
    ]
  },
  "breakStatus": "NOT_STARTED"
}
```

### 2. Get Current Question
```http
GET /practice/attempts/:attemptId/current
```

Returns the same structure as above.

### 3. Submit Answer

**For Multiple Choice:**
```http
POST /practice/attempts/:attemptId/answer
Content-Type: application/json

{
  "questionId": "question-uuid",
  "choiceId": "choice-2"
}
```

**For Student-Produced (Grid-in):**
```http
POST /practice/attempts/:attemptId/answer
Content-Type: application/json

{
  "questionId": "question-uuid",
  "textAnswer": "42"
}
```

Response:
```json
{
  "success": true,
  "answeredAt": "2024-01-15T10:05:30Z"
}
```

**Note:** The API does NOT return whether the answer is correct. This is intentional for security.

### 4. Navigation

**Next Question:**
```http
POST /practice/attempts/:attemptId/next
```

**Previous Question:**
```http
POST /practice/attempts/:attemptId/previous
```

**Jump to Specific Question:**
```http
POST /practice/attempts/:attemptId/goto/:index
```

All navigation endpoints return the question data in the same format as `start`.

### 5. Get Answered Questions List
```http
GET /practice/attempts/:attemptId/answers
```

Response:
```json
{
  "answers": [
    { "questionId": "q1", "questionIndex": 0, "answered": true },
    { "questionId": "q2", "questionIndex": 1, "answered": true },
    { "questionId": "q3", "questionIndex": 2, "answered": false },
    { "questionId": "q4", "questionIndex": 3, "answered": true }
  ],
  "totalQuestions": 27,
  "answeredCount": 3
}
```

Use this to render the question navigator showing which questions are answered.

### 6. Finish Module
```http
POST /practice/attempts/:attemptId/finish-module
```

Possible responses:

**Starting Module 2:**
```json
{
  "message": "Module 1 completed. Starting Module 2.",
  "module1Score": 85,
  "module2Difficulty": "HARD",
  "nextStep": "MODULE_2"
}
```

**Starting Break (after English section):**
```json
{
  "message": "Section completed. Break started.",
  "breakDuration": 10,
  "breakEndsAt": "2024-01-15T11:10:00Z",
  "nextStep": "BREAK"
}
```

**Starting Next Section:**
```json
{
  "message": "Starting MATH section",
  "nextStep": "NEW_SECTION",
  "section": {
    "id": "section-uuid",
    "type": "MATH",
    "allowCalculator": true
  }
}
```

**Test Complete:**
```json
{
  "message": "Test completed!",
  "nextStep": "COMPLETE"
}
```

---

## Question Types & Rendering

### Multiple Choice Question

```typescript
interface MultipleChoiceQuestion {
  id: string;
  questionText: string;
  questionType: 'MULTIPLE_CHOICE';
  orderIndex: number;
  passage?: string;      // Reading passage (if applicable)
  imageUrl?: string;     // Chart/graph URL (if applicable)
  choices: {
    id: string;
    choiceText: string;
    orderIndex: number;
  }[];
}
```

**Rendering:**
```tsx
function MultipleChoiceQuestion({ question, selectedChoiceId, onSelect }) {
  return (
    <div className="question">
      {question.passage && (
        <div className="passage">{question.passage}</div>
      )}

      {question.imageUrl && (
        <img src={question.imageUrl} alt="Question graphic" className="question-image" />
      )}

      <div className="question-text">{question.questionText}</div>

      <div className="choices">
        {question.choices.map((choice, index) => (
          <button
            key={choice.id}
            className={`choice ${selectedChoiceId === choice.id ? 'selected' : ''}`}
            onClick={() => onSelect(choice.id)}
          >
            <span className="choice-letter">{String.fromCharCode(65 + index)}</span>
            <span className="choice-text">{choice.choiceText}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
```

### Student-Produced Response (Grid-in)

```typescript
interface StudentProducedQuestion {
  id: string;
  questionText: string;
  questionType: 'STUDENT_PRODUCED';
  orderIndex: number;
  passage?: string;
  imageUrl?: string;
  // No choices array
}
```

**Rendering:**
```tsx
function StudentProducedQuestion({ question, answer, onAnswerChange }) {
  return (
    <div className="question">
      {question.passage && (
        <div className="passage">{question.passage}</div>
      )}

      {question.imageUrl && (
        <img src={question.imageUrl} alt="Question graphic" className="question-image" />
      )}

      <div className="question-text">{question.questionText}</div>

      <div className="grid-in-input">
        <label>Enter your answer:</label>
        <input
          type="text"
          value={answer || ''}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder="Type your answer"
          pattern="[0-9.\-\/]+"
        />
        <p className="hint">
          Enter a number (decimals, fractions like 3/4, or negative numbers allowed)
        </p>
      </div>
    </div>
  );
}
```

### Universal Question Component

```tsx
function Question({ question, answer, onAnswer }) {
  if (question.questionType === 'MULTIPLE_CHOICE') {
    return (
      <MultipleChoiceQuestion
        question={question}
        selectedChoiceId={answer?.choiceId}
        onSelect={(choiceId) => onAnswer({ questionId: question.id, choiceId })}
      />
    );
  }

  if (question.questionType === 'STUDENT_PRODUCED') {
    return (
      <StudentProducedQuestion
        question={question}
        answer={answer?.textAnswer}
        onAnswerChange={(textAnswer) => onAnswer({ questionId: question.id, textAnswer })}
      />
    );
  }
}
```

---

## Navigation & State Management

### Recommended State Structure

```typescript
interface TestState {
  attemptId: string;
  testTitle: string;

  // Current position
  currentSection: {
    id: string;
    type: 'ENGLISH' | 'MATH';
    allowCalculator: boolean;
  };
  currentModule: {
    id: string;
    moduleNumber: number;
    duration: number;
    totalQuestions: number;
  };
  currentQuestionIndex: number;

  // Current question
  question: Question;

  // Tracking
  answeredQuestions: Set<string>;

  // Timer
  moduleStartTime: Date;
  moduleEndTime: Date;

  // Break
  breakStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  breakEndsAt?: Date;
}
```

### Timer Implementation

```typescript
function useModuleTimer(moduleDuration: number, onTimeUp: () => void) {
  const [remainingSeconds, setRemainingSeconds] = useState(moduleDuration * 60);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [moduleDuration, onTimeUp]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return {
    remainingSeconds,
    formatted: `${minutes}:${seconds.toString().padStart(2, '0')}`,
    isLowTime: remainingSeconds < 300 // Less than 5 minutes
  };
}
```

### Question Navigator Component

```tsx
function QuestionNavigator({ totalQuestions, currentIndex, answeredSet, onJump }) {
  return (
    <div className="question-navigator">
      {Array.from({ length: totalQuestions }, (_, i) => (
        <button
          key={i}
          className={`
            nav-btn
            ${i === currentIndex ? 'current' : ''}
            ${answeredSet.has(i) ? 'answered' : 'unanswered'}
          `}
          onClick={() => onJump(i)}
        >
          {i + 1}
        </button>
      ))}
    </div>
  );
}
```

---

## Break Handling

### Check Break Status
```http
GET /practice/attempts/:attemptId/break-status
```

**During Break:**
```json
{
  "breakStatus": "IN_PROGRESS",
  "breakEndsAt": "2024-01-15T11:10:00Z",
  "remainingSeconds": 420,
  "message": "Break is still in progress"
}
```

**Break Complete:**
```json
{
  "message": "Starting MATH section",
  "nextStep": "NEW_SECTION",
  "section": {
    "id": "section-uuid",
    "type": "MATH",
    "allowCalculator": true
  }
}
```

### Break Screen Component

```tsx
function BreakScreen({ breakEndsAt, onBreakEnd }) {
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    const endTime = new Date(breakEndsAt).getTime();

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setRemainingSeconds(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        onBreakEnd();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [breakEndsAt, onBreakEnd]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return (
    <div className="break-screen">
      <h1>Break Time</h1>
      <p>You have a 10-minute break before the Math section.</p>

      <div className="break-timer">
        {minutes}:{seconds.toString().padStart(2, '0')}
      </div>

      <p>The Math section will begin automatically when the break ends.</p>
      <p>You may also end your break early by clicking below.</p>

      <button onClick={onBreakEnd}>End Break Early</button>
    </div>
  );
}
```

---

## Results & Review

### Submit Test
```http
POST /practice/attempts/:attemptId/submit
```

Response:
```json
{
  "totalScore": 85,
  "totalQuestions": 98,
  "correctAnswers": 83,
  "wrongAnswers": 15,
  "completedAt": "2024-01-15T12:15:00Z",
  "sections": [
    {
      "sectionType": "ENGLISH",
      "score": 88,
      "modules": [
        {
          "moduleNumber": 1,
          "difficulty": "EASY",
          "score": 90,
          "correctCount": 24,
          "totalCount": 27,
          "questions": [
            {
              "questionId": "q1",
              "questionText": "Which choice...",
              "questionType": "MULTIPLE_CHOICE",
              "difficulty": "EASY",
              "userChoiceId": "choice-2",
              "correctChoiceId": "choice-2",
              "isCorrect": true,
              "explanation": "The correct answer is B because...",
              "choices": [
                { "id": "choice-1", "choiceText": "A", "isCorrect": false },
                { "id": "choice-2", "choiceText": "B", "isCorrect": true },
                { "id": "choice-3", "choiceText": "C", "isCorrect": false },
                { "id": "choice-4", "choiceText": "D", "isCorrect": false }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

### Get Results (for previously completed attempts)
```http
GET /practice/attempts/:attemptId/results
```

Returns the same structure as submit.

### Results Display Component

```tsx
function ResultsPage({ results }) {
  return (
    <div className="results">
      <div className="score-summary">
        <h1>Your Score: {results.totalScore}%</h1>
        <p>{results.correctAnswers} / {results.totalQuestions} correct</p>
      </div>

      {results.sections.map((section) => (
        <div key={section.sectionType} className="section-results">
          <h2>{section.sectionType} - {section.score}%</h2>

          {section.modules.map((module) => (
            <div key={module.moduleNumber} className="module-results">
              <h3>
                Module {module.moduleNumber} ({module.difficulty})
                - {module.correctCount}/{module.totalCount}
              </h3>

              {module.questions.map((q, idx) => (
                <QuestionReview key={q.questionId} question={q} number={idx + 1} />
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function QuestionReview({ question, number }) {
  return (
    <div className={`question-review ${question.isCorrect ? 'correct' : 'incorrect'}`}>
      <div className="question-header">
        <span>Q{number}</span>
        <span className={question.isCorrect ? 'badge-correct' : 'badge-incorrect'}>
          {question.isCorrect ? 'Correct' : 'Incorrect'}
        </span>
      </div>

      <p className="question-text">{question.questionText}</p>

      {question.questionType === 'MULTIPLE_CHOICE' ? (
        <div className="choices-review">
          {question.choices.map((choice) => (
            <div
              key={choice.id}
              className={`
                choice-review
                ${choice.isCorrect ? 'correct-choice' : ''}
                ${choice.id === question.userChoiceId ? 'user-choice' : ''}
              `}
            >
              {choice.choiceText}
              {choice.isCorrect && <span> (Correct)</span>}
              {choice.id === question.userChoiceId && !choice.isCorrect && <span> (Your answer)</span>}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid-in-review">
          <p>Your answer: {question.userTextAnswer || '(blank)'}</p>
          <p>Correct answer: {question.correctAnswer}</p>
        </div>
      )}

      {question.explanation && (
        <div className="explanation">
          <strong>Explanation:</strong> {question.explanation}
        </div>
      )}
    </div>
  );
}
```

---

## Admin Panel

### Create SAT Test Template
```http
POST /tests/sat-template
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "title": "SAT Practice Test 1",
  "description": "Full-length practice test"
}
```

Response:
```json
{
  "testId": "test-uuid",
  "title": "SAT Practice Test 1",
  "structure": {
    "englishSection": {
      "module1": "27 questions (EASY) - needs questions added",
      "module2Easy": "27 questions (EASY) - needs questions added",
      "module2Hard": "27 questions (HARD) - needs questions added",
      "totalQuestionsNeeded": 81
    },
    "mathSection": {
      "module1": "22 questions (EASY) - needs questions added",
      "module2Easy": "22 questions (EASY) - needs questions added",
      "module2Hard": "22 questions (HARD) - needs questions added",
      "totalQuestionsNeeded": 66
    },
    "grandTotalQuestionsNeeded": 147
  },
  "modules": [
    { "moduleId": "mod-1", "sectionType": "ENGLISH", "moduleNumber": 1, "difficulty": "EASY" },
    { "moduleId": "mod-2", "sectionType": "ENGLISH", "moduleNumber": 2, "difficulty": "EASY" },
    { "moduleId": "mod-3", "sectionType": "ENGLISH", "moduleNumber": 2, "difficulty": "HARD" },
    { "moduleId": "mod-4", "sectionType": "MATH", "moduleNumber": 1, "difficulty": "EASY" },
    { "moduleId": "mod-5", "sectionType": "MATH", "moduleNumber": 2, "difficulty": "EASY" },
    { "moduleId": "mod-6", "sectionType": "MATH", "moduleNumber": 2, "difficulty": "HARD" }
  ],
  "message": "SAT test template created. Add questions to each module."
}
```

### Add Question to Module
```http
POST /tests/modules/:moduleId/questions
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "questionText": "If 2x + 5 = 13, what is the value of x?",
  "questionType": "STUDENT_PRODUCED",
  "contentDomain": "ALGEBRA",
  "orderIndex": 0,
  "difficulty": "EASY",
  "correctAnswer": "4",
  "explanation": "Subtract 5 from both sides: 2x = 8. Divide by 2: x = 4."
}
```

### Validate Test Structure
```http
GET /tests/:testId/validate
Authorization: Bearer <admin-token>
```

Response:
```json
{
  "testId": "test-uuid",
  "title": "SAT Practice Test 1",
  "isValid": false,
  "isReadyForStudents": false,
  "modules": [
    {
      "sectionType": "ENGLISH",
      "moduleNumber": 1,
      "difficulty": "EASY",
      "expectedQuestions": 27,
      "actualQuestions": 27,
      "isComplete": true
    },
    {
      "sectionType": "ENGLISH",
      "moduleNumber": 2,
      "difficulty": "EASY",
      "expectedQuestions": 27,
      "actualQuestions": 15,
      "isComplete": false
    }
  ],
  "issues": [
    "ENGLISH Module 2 (EASY): has 15/27 questions",
    "ENGLISH Module 2 (HARD): has 0/27 questions"
  ],
  "message": "SAT test is incomplete. Please add the missing questions."
}
```

---

## API Reference

### Student Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/practice/tests` | Get available tests |
| `GET` | `/practice/my-attempts` | Get user's attempt history |
| `POST` | `/practice/start/:testId` | Start or resume test |
| `GET` | `/practice/attempts/:attemptId/current` | Get current question |
| `POST` | `/practice/attempts/:attemptId/answer` | Submit answer |
| `POST` | `/practice/attempts/:attemptId/next` | Go to next question |
| `POST` | `/practice/attempts/:attemptId/previous` | Go to previous question |
| `POST` | `/practice/attempts/:attemptId/goto/:index` | Jump to question |
| `GET` | `/practice/attempts/:attemptId/answers` | Get answered questions list |
| `POST` | `/practice/attempts/:attemptId/finish-module` | Finish current module |
| `GET` | `/practice/attempts/:attemptId/break-status` | Check break status |
| `POST` | `/practice/attempts/:attemptId/abandon` | Abandon attempt |
| `POST` | `/practice/attempts/:attemptId/submit` | Submit test for scoring |
| `GET` | `/practice/attempts/:attemptId/results` | Get test results |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/tests/sat-template` | Create SAT test template |
| `GET` | `/tests/:id/validate` | Validate test structure |
| `POST` | `/tests/modules/:moduleId/questions` | Add question to module |
| `PATCH` | `/tests/modules/:moduleId/questions/:questionId` | Update question |
| `DELETE` | `/tests/modules/:moduleId/questions/:questionId` | Delete question |
| `GET` | `/tests` | Get all tests |
| `GET` | `/tests/:id` | Get test details |
| `PATCH` | `/tests/:id` | Update test |
| `DELETE` | `/tests/:id` | Delete/deactivate test |

---

## Error Handling

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

Common status codes:
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (wrong role or not your resource)
- `404` - Not Found

### Error Handling Example

```typescript
async function submitAnswer(attemptId: string, answer: SubmitAnswerDto) {
  try {
    const response = await api.post(`/practice/attempts/${attemptId}/answer`, answer);
    return response.data;
  } catch (error) {
    if (error.response?.status === 400) {
      // Invalid answer format
      toast.error(error.response.data.message);
    } else if (error.response?.status === 403) {
      // Not your attempt or attempt completed
      router.push('/tests');
    } else {
      toast.error('Something went wrong. Please try again.');
    }
    throw error;
  }
}
```

---

## Enums Reference

```typescript
// Question Types
type QuestionType = 'MULTIPLE_CHOICE' | 'STUDENT_PRODUCED';

// Section Types
type SectionType = 'ENGLISH' | 'MATH';

// Difficulty Levels
type ModuleDifficulty = 'EASY' | 'HARD';
type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

// Status
type AttemptStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
type BreakStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

// Content Domains (for analytics)
type ContentDomain =
  // Reading & Writing
  | 'INFORMATION_AND_IDEAS'
  | 'CRAFT_AND_STRUCTURE'
  | 'EXPRESSION_OF_IDEAS'
  | 'STANDARD_ENGLISH_CONVENTIONS'
  // Math
  | 'ALGEBRA'
  | 'ADVANCED_MATH'
  | 'PROBLEM_SOLVING_DATA'
  | 'GEOMETRY_TRIGONOMETRY';
```
