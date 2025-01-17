import { Box } from "@twilio-paste/box";
import { Column, Grid } from "@twilio-paste/grid";
import { Stack } from "@twilio-paste/stack";
import { useEffect, useRef, useState } from "react";

const iframeRoute = "/ai-questions";

export default function NoActiveTask(props) {
  const [iframeError, setIframeError] = useState(false);
  const [src, setSrc] = useState(`http://localhost:3001/${iframeRoute}`);

  return (
    <div style={{ margin: 20, width: "100%" }}>
      <Stack orientation="vertical" spacing={"space0"}>
        <Grid gutter="space30" marginTop="space100">
          <Column span={2}>&nbsp;</Column>
          <Column span={6}>
            <Box
              display="flex"
              justifyContent="center"
              width="200%"
              height="1200px"
            >
              {!iframeError && (
                <IFrame
                  onError={() => setIframeError(true)}
                  onLoad={() => setIframeError(false)}
                  src={src}
                  style={{ border: "none" }}
                />
              )}
              {iframeError && (
                <div>
                  <b>Error Loading IFrame</b>
                </div>
              )}
            </Box>
          </Column>
          <Column span={3}>&nbsp;</Column>
        </Grid>
      </Stack>
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
        console.debug("IFrame error", e);
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
