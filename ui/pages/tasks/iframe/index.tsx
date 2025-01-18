import { TaskApproverTable } from "@/components/TaskApproverTable";

export default function TaskContainer() {
  return (
    <>
      <TaskApproverTable />
      <style jsx global>{`
        body {
          background-color: white !important;
        }
      `}</style>
    </>
  );
}
