import { createEntityAdapter, createSlice } from "@reduxjs/toolkit";
import { AIQuestion } from "@shared/entities";
import type { RootState } from "./store";
import { useAppSelector } from "./hooks";

const SLICE_NAME = "questions";

const adapter = createEntityAdapter<AIQuestion>({
  sortComparer: (a, b) => {
    let aa: string;
    let bb: string;

    try {
      aa = new Date(a?.createdAt)?.toISOString();
      bb = new Date(b?.createdAt)?.toISOString();
      return bb.localeCompare(aa);
    } catch (error) {
      return 0;
    }
  },
});

export const questionsSlice = createSlice({
  name: SLICE_NAME,
  initialState: adapter.getInitialState(),
  reducers: {
    addManyQuestions: adapter.addMany,
    addOneQuestion: adapter.addOne,
    removeAllQuestions: adapter.removeAll,
    removeManyQuestions: adapter.removeMany,
    removeOneQuestion: adapter.removeOne,
    setAllQuestions: adapter.setAll,
    setManyQuestions: adapter.setMany,
    setOneQuestion: adapter.setOne,
    updateManyQuestions: adapter.updateMany,
    updateOneQuestion: adapter.updateOne,
    upsertManyQuestions: adapter.upsertMany,
    upsertOneQuestion: adapter.upsertOne,
  },
});

/****************************************************
 Selectors
****************************************************/
function getSlice(state: RootState) {
  return state[SLICE_NAME];
}

export const {
  selectAll: selectAllQuestions,
  selectById: selectQuestionById,
  selectIds: selectQuestionIds,
  selectEntities: selectQuestionEntities,
  selectTotal: selectQuestionTotal,
} = adapter.getSelectors(getSlice);

export function getCallQuestions(state: RootState, callSid: string) {
  return selectAllQuestions(state).filter(
    (question) => question.callSid === callSid
  );
}

export function useCallQuestions(callSid: string) {
  const questions = useAppSelector(selectAllQuestions);
  return questions.filter((question) => question.callSid === callSid);
}

/****************************************************
 Actions
****************************************************/
export const {
  addManyQuestions,
  addOneQuestion,
  removeAllQuestions,
  removeManyQuestions,
  removeOneQuestion,
  setAllQuestions,
  setManyQuestions,
  setOneQuestion,
  updateManyQuestions,
  updateOneQuestion,
  upsertManyQuestions,
  upsertOneQuestion,
} = questionsSlice.actions;
