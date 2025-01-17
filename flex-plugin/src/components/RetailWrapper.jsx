import { withTaskContext } from "@twilio/flex-ui";
import NoActiveTask from "./NoActiveTask";
import RetailView from "./RetailView";

const RetailWrapper = (props) => (
  <div style={{ margin: 20, width: "75%" }}>
    {props.task ? <RetailView {...props} /> : <NoActiveTask />}
  </div>
);

export default withTaskContext(RetailWrapper);
