import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { selectAllQuestions, updateOneQuestion } from "@/state/questions";
import { Button, Textarea } from "@mantine/core";

export function TaskApproverTable({ callSid }: { callSid?: string }) {
  const questions = useAppSelector(selectAllQuestions)?.filter(
    (question) => !callSid || question.callSid === callSid
  );

  const dispatch = useAppDispatch();

  return (
    <div>
      <h2>Tasks Approver App</h2>
      <table cellPadding="10" style={{ marginTop: "20px" }}>
        <thead>
          <tr>
            <th>Status</th>
            <th style={{ width: "250px" }}>Question</th>
            <th style={{ width: "400px" }}>Explanation</th>
            <th style={{ width: "400px" }}>Recommendation</th>
            <th style={{ width: "400px" }}>Answer</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((question) => (
            <tr key={`294-${question.id}`}>
              <td>{question.status}</td>
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
              </td>
              <td
                style={{ display: "flex", flexDirection: "column", gap: "5px" }}
              >
                <Button size="compact-xs">Approve</Button>

                <Button size="compact-xs" color="red">
                  Reject
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
