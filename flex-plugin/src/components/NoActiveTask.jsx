import { Box } from "@twilio-paste/box";
import { Column, Grid } from "@twilio-paste/grid";
import { Stack } from "@twilio-paste/stack";
import { useEffect, useRef, useState } from "react";

const iframeRoute = "/tasks/";

export default function NoActiveTask(props) {
  const [iframeError, setIframeError] = useState(false);
  const [src, setSrc] = useState(`http://localhost:3002/tasks/iframe`);

  return (
    <div style={{ padding: "20px", height: "900px", width: "100%" }}>
      <IFrame
        onError={() => setIframeError(true)}
        onLoad={() => setIframeError(false)}
        src={src}
        style={{ border: "none" }}
      />
    </div>
  );
}

function IFrame({ onError, onLoad, src }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    const checkIframe = () => {
      try {
        const iframeDoc =
          iframeRef.current.contentDocument ||
          iframeRef.current.contentWindow.document;
        onLoad();
      } catch (e) {
        onError();
      }
    };

    const timeoutId = setTimeout(checkIframe, 1000);
    return () => clearTimeout(timeoutId);
  }, [src, onError, onLoad]);

  return (
    <iframe
      ref={iframeRef}
      height="100%"
      src={src}
      style={{ border: "none" }}
      width="100%"
    />
  );
}
