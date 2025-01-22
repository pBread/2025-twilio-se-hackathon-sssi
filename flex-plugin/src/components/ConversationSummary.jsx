import { Box } from "@twilio-paste/box";
import { Card } from "@twilio-paste/card";
import { Column, Grid } from "@twilio-paste/core/grid";
import { Heading } from "@twilio-paste/heading";
import { Paragraph } from "@twilio-paste/paragraph";
import { withTaskContext } from "@twilio/flex-ui";

function ConversationSummary(props) {
  return (
    <div>
      <Box>
        <Card padding="space70">
          <Grid gutter="space20">
            <Column span={12}>
              <Heading as="h4" variant="heading40" marginBottom="space0">
                {"AI Assistant Summary"}
              </Heading>
            </Column>

            <Column span={12}>
              <Box
                display="flex"
                marginLeft="space60"
                justifyContent="space-between"
              >
                <Paragraph marginBottom="space0">
                  {props?.task?.attributes?.conversationSummary}
                </Paragraph>
              </Box>
            </Column>
          </Grid>
        </Card>
      </Box>
    </div>
  );
}

export default withTaskContext(ConversationSummary);
