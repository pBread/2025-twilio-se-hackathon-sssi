import React from "react";
import { withTaskContext } from "@twilio/flex-ui";

const Container = (props) => (
  <div style={{ margin: 20, width: "75%" }}>
    {props.task ? <div> </div> : <div> </div>}
  </div>
);

export default withTaskContext(Container);
