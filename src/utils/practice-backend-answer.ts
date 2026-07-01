/**
 * Shape accepted by the external practice /answer and /answers/batch APIs.
 * markedForReview and eliminatedChoices are kept in localStorage only —
 * the backend rejects them (validation: "property should not exist").
 */
export type BackendAnswerPayload = {
  questionId: string;
  choiceId?: string;
  textAnswer?: string;
};

export function toBackendAnswerPayload(answer: {
  questionId: string;
  choiceId?: string;
  textAnswer?: string;
  markedForReview?: boolean;
  eliminatedChoices?: string[];
}): BackendAnswerPayload {
  const body: BackendAnswerPayload = {
    questionId: String(answer.questionId),
  };
  if (answer.choiceId != null && String(answer.choiceId).trim() !== "") {
    body.choiceId = String(answer.choiceId);
  }
  if (answer.textAnswer !== undefined && answer.textAnswer !== null) {
    body.textAnswer = String(answer.textAnswer);
  }
  return body;
}
