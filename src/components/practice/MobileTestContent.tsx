"use client";

import { memo } from "react";
import Image from "next/image";
import {
  Question,
  isOpenAnswerQuestion,
  hasChoiceOptions,
  getQuestionImageUrl,
  shouldUnoptimizeImage,
} from "@/src/services/practice.service";
import { QuestionDisplay } from "@/src/components/practice/QuestionDisplay";
import { QuestionActionBar } from "@/src/components/practice/QuestionActionBar";
import { QuestionChoicesPanel } from "@/src/components/practice/QuestionChoicesPanel";
import { StudentProducedResponseDirections } from "@/src/components/practice/StudentProducedResponseDirections";
import { PassagePanel } from "@/src/components/practice/PassagePanel";

type QuestionHighlight = {
  startOffset: number;
  endOffset: number;
  color: "YELLOW" | "GREEN" | "BLUE" | "PINK" | "ORANGE";
  note?: string | null;
};

export interface MobileTestContentProps {
  sectionType: "ENGLISH" | "MATH";
  question: Question;
  questionIndex: number;
  isFlagged: boolean;
  isEliminationMode: boolean;
  eliminatedChoiceIds: Set<string>;
  selectedChoiceId?: string;
  displayTextAnswer?: string;
  isMarkupEnabled: boolean;
  attemptId: string;
  onToggleFlag: () => void;
  onToggleEliminationMode: () => void;
  onSelectChoice: (choiceId: string) => void;
  onTextAnswerChange: (text: string) => void;
  onQuestionHighlightsChange: (highlights: QuestionHighlight[]) => void;
  onPassageHighlightsChange: (
    questionId: string,
    highlights: QuestionHighlight[],
  ) => void;
  onChoiceClick: (choiceId: string) => void;
  onEliminationToggle: (choiceId: string) => void;
  onEliminationUndo: (choiceId: string) => void;
}

export const MobileTestContent = memo(function MobileTestContent({
  sectionType,
  question,
  questionIndex,
  isFlagged,
  isEliminationMode,
  eliminatedChoiceIds,
  selectedChoiceId,
  displayTextAnswer,
  isMarkupEnabled,
  attemptId,
  onToggleFlag,
  onToggleEliminationMode,
  onSelectChoice,
  onTextAnswerChange,
  onQuestionHighlightsChange,
  onPassageHighlightsChange,
  onChoiceClick,
  onEliminationToggle,
  onEliminationUndo,
}: MobileTestContentProps) {
  const isMath = sectionType === "MATH";
  const questionImageUrl = getQuestionImageUrl(question);

  return (
    <div className="flex flex-1 min-h-[40vh] min-w-0 w-full overflow-y-auto overflow-x-hidden overscroll-contain">
      <div className="w-full min-w-0 flex-1 px-3 min-[480px]:px-4 pb-4 sm:pb-6">
        {isMath && isOpenAnswerQuestion(question) && (
          <StudentProducedResponseDirections variant="mobile" />
        )}
        <QuestionActionBar
          questionIndex={questionIndex}
          isFlagged={isFlagged}
          showEliminationToggle={hasChoiceOptions(question)}
          isEliminationMode={isEliminationMode}
          onToggleFlag={onToggleFlag}
          onToggleEliminationMode={onToggleEliminationMode}
          variant="mobile"
        />
        <div className="prose prose-sm sm:prose max-w-none mt-0 mb-3 sm:mb-5 text-xs sm:text-sm">
          <QuestionDisplay
            key={question.id}
            question={question}
            selectedChoiceId={selectedChoiceId}
            textAnswer={displayTextAnswer}
            onSelectChoice={onSelectChoice}
            onTextAnswerChange={onTextAnswerChange}
            isFlagged={isFlagged}
            hidePassage
            showOnlyQuestionText
            isMarkupEnabled={isMarkupEnabled}
            attemptId={attemptId}
            onHighlightsChange={onQuestionHighlightsChange}
          />
        </div>
        {hasChoiceOptions(question) && (
          <QuestionChoicesPanel
            choices={question.choices ?? []}
            selectedChoiceId={selectedChoiceId}
            isEliminationMode={isEliminationMode}
            eliminatedChoiceIds={eliminatedChoiceIds}
            layout="mobile"
            className="space-y-2 sm:space-y-3 mb-4"
            onChoiceClick={onChoiceClick}
            onEliminationToggle={onEliminationToggle}
            onEliminationUndo={onEliminationUndo}
          />
        )}
        {questionImageUrl && (
          <div className="mt-4 sm:mt-5 mb-3 sm:mb-4 p-2 sm:p-3 bg-gray-100 rounded-lg flex justify-center items-center overflow-hidden">
            <Image
              src={questionImageUrl}
              alt="Question figure"
              width={1200}
              height={900}
              unoptimized={shouldUnoptimizeImage(questionImageUrl)}
              className="max-h-[min(50vh,500px)] w-auto max-w-full h-auto rounded-lg object-contain bg-gray-100"
              sizes="100vw"
              loading="lazy"
            />
          </div>
        )}
        {(question.sharedPassage?.content || question.passage) && (
          <PassagePanel
            questionId={question.id}
            passageText={
              question.sharedPassage?.content || question.passage || ""
            }
            isMarkupEnabled={isMarkupEnabled}
            attemptId={attemptId}
            onHighlightsChange={(highlights) =>
              onPassageHighlightsChange(question.id, highlights)
            }
            className="mt-2 sm:mt-3 p-3 sm:p-4 mb-3 sm:mb-4 bg-white rounded-lg"
          />
        )}
      </div>
    </div>
  );
});
