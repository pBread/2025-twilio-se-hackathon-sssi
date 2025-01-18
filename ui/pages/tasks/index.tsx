import { useAppSelector } from "@/state/hooks";
import { selectAllQuestions } from "@/state/questions";

export default function TaskContainer() {
  const questions = useAppSelector(selectAllQuestions);

  return (
    <div>
      <h2>Tasks Approver App</h2>
      <table cellPadding="10" style={{ marginTop: "20px" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Question</th>
            <th>Explanation</th>
            <th>Recommendation</th>
            <th>Status</th>
            <th>Answer</th>
            <th>Actions</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((question) => (
            <tr key={`294-${question.id}`}>
              <td>{question.id}</td>
              <td>{question.question}</td>
              <td>{question.explanation}</td>
              <td>{question.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
