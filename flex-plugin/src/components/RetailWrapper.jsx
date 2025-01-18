import { withTaskContext } from "@twilio/flex-ui";
import NoActiveTask from "./NoActiveTask.jsx";
import RetailView from "./RetailView.jsx";
import { ContextProvider } from "@twilio/flex-ui";
import { createContext } from "react";
import { ContextProvider } from "react";

function RetailWrapper({ conf, task }) {
  return (
    <div style={{ margin: 20, width: "75%" }}>
      {task ? <RetailView conf={conf} /> : <NoActiveTask />}
    </div>
  );
}

export default withTaskContext(RetailWrapper);
