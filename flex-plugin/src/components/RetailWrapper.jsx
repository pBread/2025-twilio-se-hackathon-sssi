import { withTaskContext } from "@twilio/flex-ui";
import NoActiveTask from "./NoActiveTask.jsx";
import RetailView from "./RetailView.jsx";

const RetailWrapper = ({ conf, task }) => (
  <div style={{ margin: 20, width: "75%" }}>
    {task ? <RetailView conf={conf} /> : <NoActiveTask />}
  </div>
);

export default withTaskContext(RetailWrapper);
