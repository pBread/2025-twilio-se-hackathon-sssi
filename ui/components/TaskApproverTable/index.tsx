import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { selectAllQuestions, updateOneQuestion } from "@/state/questions";
import { Button, Text, Textarea } from "@mantine/core";
import { AIQuestion } from "@shared/entities";
import { IconCircleCheckFilled, IconXboxXFilled } from "@tabler/icons-react";
import { useState } from "react";

export function TaskApproverTable({ callSid }: { callSid?: string }) {
  const questions = useAppSelector(selectAllQuestions)?.filter(
    (question) => !callSid || question.callSid === callSid
  );

  const dispatch = useAppDispatch();

  const [loadId, setLoadId] = useState(null);

  const saveQuestion = async (question: AIQuestion) => {
    setLoadId(question.id);
    try {
      const res = await fetch(`/api/questions/${question.id}`, {
        method: "POST",
        body: JSON.stringify(question),
      }).then((res) => res.json());
      if (res.status === "success") return setLoadId(null);

      throw Error(res.error);
    } catch (error) {
      console.error("Error saving question", error);
      throw error;
    }
  };

  return (
    <div>
      <table cellPadding="10" style={{ marginTop: "20px", width: "100%" }}>
        <thead>
          <tr>
            <th style={{ width: "15vw" }}>Question</th>
            <th style={{ width: "20vw" }}>Explanation</th>
            <th style={{ width: "20vw" }}>Recommendation</th>
            <th style={{ width: "20vw" }}>Answer</th>
            <th>Actions</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((question) => (
            <tr key={`294-${question.id}`}>
              <td>{question.question}</td>
              <td>{question.explanation}</td>
              <td>{question.recommendation}</td>
              <td>
                <Textarea
                  autosize
                  value={question.answer}
                  onChange={(ev) =>
                    dispatch(
                      updateOneQuestion({
                        changes: { answer: ev.target.value },
                        id: question.id,
                      })
                    )
                  }
                />
              </td>{" "}
              <td>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "5px",
                  }}
                >
                  <Button
                    color="green"
                    variant={question.status !== "new" && "default"}
                    size="compact-xs"
                    onClick={() => {
                      saveQuestion({ ...question, status: "approved" });
                    }}
                  >
                    Approve
                  </Button>

                  <Button
                    color="red"
                    variant={question.status !== "new" && "default"}
                    size="compact-xs"
                    onClick={() => {
                      saveQuestion({ ...question, status: "rejected" });
                    }}
                  >
                    Reject
                  </Button>
                </div>
              </td>
              <td>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {question.status === "approved" && (
                    <IconCircleCheckFilled color="green" />
                  )}
                  {question.status === "rejected" && (
                    <IconXboxXFilled color="red" />
                  )}
                  {question.status === "new" && (
                    <Text size="sm">{question.status}</Text>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
