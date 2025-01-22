import StarIcon from "@mui/icons-material/Star";
import { Avatar } from "@twilio-paste/avatar";
import { Box } from "@twilio-paste/box";
import { Button } from "@twilio-paste/button";
import { Card } from "@twilio-paste/card";
import { Column, Grid } from "@twilio-paste/core/grid";
import { Flex as PasteFlex } from "@twilio-paste/flex";
import { Heading } from "@twilio-paste/heading";
import { EmailIcon } from "@twilio-paste/icons/cjs/EmailIcon";
import { CallIcon } from "@twilio-paste/icons/esm/CallIcon";
import { CopyIcon } from "@twilio-paste/icons/esm/CopyIcon";
import { ListItem, UnorderedList } from "@twilio-paste/list";
import { Paragraph } from "@twilio-paste/paragraph";
import { Separator } from "@twilio-paste/separator";
import { Stack } from "@twilio-paste/stack";
import { Text } from "@twilio-paste/text";
import { Tooltip } from "@twilio-paste/tooltip";
import { withTaskContext } from "@twilio/flex-ui";

function ContactCard(props) {
  if (!props) return <div>Loading</div>;

  return (
    <div>
      <Box>
        <Card padding="space70">
          <Grid gutter="space20">
            <Column span={2}>
              <Avatar
                size="sizeIcon100"
                name={props.task?.attributes?.customerData?.name}
              />
            </Column>

            <Column span={10}>
              <Box
                display="flex"
                marginLeft="space60"
                justifyContent="space-between"
              >
                <Heading as="h2" variant="heading30" marginBottom="space0">
                  {props?.task?.attributes?.customerData?.firstName}{" "}
                  {props?.task?.attributes?.customerData?.lastName}
                </Heading>
                <Box>
                  <Tooltip text="Copy Segment ID.">
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={(e) =>
                        console.warn("Copying Segment Id doesn't work!")
                      }
                    >
                      <CopyIcon decorative />
                    </Button>
                  </Tooltip>
                </Box>
              </Box>
              <UnorderedList marginBottom="space0" listStyleType="">
                <ListItem>
                  <PasteFlex vAlignContent="center">
                    <StarIcon
                      sx={{
                        color: "#FFD700",
                        width: "1.25rem",
                        height: "1.25rem",
                      }}
                    />
                    <Text as={"div"} marginLeft="space60">
                      {props?.task?.attributes?.customerData?.loyaltyTier}
                    </Text>
                  </PasteFlex>
                </ListItem>
                <ListItem>
                  <PasteFlex>
                    <EmailIcon decorative />
                    <Text as={"div"} marginLeft="space30">
                      {props?.task?.attributes?.customerData?.email}
                    </Text>
                  </PasteFlex>
                </ListItem>

                <ListItem>
                  <PasteFlex>
                    <CallIcon decorative />
                    <Text as={"div"} marginLeft="space30">
                      {props?.task?.attributes?.customerData?.phoneNumber}
                    </Text>
                  </PasteFlex>
                </ListItem>
              </UnorderedList>
            </Column>
            <Column span={12}>
              <Separator orientation={"horizontal"} verticalSpacing="space40" />
              <Stack orientation={"vertical"} spacing={"space20"}>
                <Heading as={"h2"} variant={"heading40"} marginBottom="space0">
                  Customer Location
                </Heading>
                <Paragraph marginBottom="space0">
                  {props.task.attributes.from_city},{" "}
                  {props.task.attributes.caller_state}{" "}
                  {props.task.attributes.caller_zip}{" "}
                </Paragraph>
              </Stack>
            </Column>
          </Grid>
        </Card>
      </Box>
    </div>
  );
}

export default withTaskContext(ContactCard);
