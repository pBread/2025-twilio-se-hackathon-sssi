import { withTaskContext } from "@twilio/flex-ui";
import NoActiveTask from "./NoActiveTask.jsx";
import RetailView from "./RetailView.jsx";

const RetailWrapper = (props) => (
  <div style={{ margin: 20, width: "75%" }}>
    {props.task ? <RetailView /> : <NoActiveTask />}
  </div>
);

export default withTaskContext(RetailWrapper);
