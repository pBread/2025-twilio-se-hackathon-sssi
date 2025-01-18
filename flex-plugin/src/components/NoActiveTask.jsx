import { TaskApprover } from "./TaskApprover";

export default function NoActiveTask(props) {
  return (
    <div style={{ padding: "20px", height: "900px", width: "100%" }}>
      <TaskApprover />
    </div>
  );
}
