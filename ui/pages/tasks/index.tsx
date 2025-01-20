import { TaskApproverTable } from "@/components/TaskApproverTable";
import { Paper } from "@mantine/core";

export default function TaskContainer() {
  return (
    <div>
      <h2>AI Approver App</h2>
      <Paper className="paper">
        <TaskApproverTable />
      </Paper>
    </div>
  );
}
