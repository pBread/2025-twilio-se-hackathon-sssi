import { TaskApproverTable } from "@/components/TaskApproverTable";
import { Paper } from "@mantine/core";

const paperStyle = { padding: "6px" };

export default function TaskContainer() {
  return (
    <div>
      <h2>AI Approver App</h2>
      <Paper style={{ ...paperStyle }}>
        <TaskApproverTable />
      </Paper>
    </div>
  );
}
