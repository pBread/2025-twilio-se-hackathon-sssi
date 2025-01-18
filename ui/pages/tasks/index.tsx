import { TaskApproverTable } from "@/components/TaskApproverTable";
import { Paper } from "@mantine/core";

const paperStyle = { padding: "6px" };

export default function TaskContainer() {
  return (
    <div>
      <Paper style={{ ...paperStyle }}>
        <TaskApproverTable />
      </Paper>
    </div>
  );
}
