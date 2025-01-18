exports.handler = function (context, event, callback) {
  try {
    const token = createSyncToken(event.identity);

    // Create a custom Twilio Response
    const response = new Twilio.Response();
    // Set the CORS headers to allow Flex to make an error-free HTTP request
    // to this Function
    response.appendHeader("Access-Control-Allow-Origin", "*");
    response.appendHeader("Access-Control-Allow-Methods", "OPTIONS, POST, GET");
    response.appendHeader("Access-Control-Allow-Headers", "Content-Type");

    response.appendHeader("Content-Type", "application/json");
    response.setBody(token);

    console.log("token", token);

    return callback(null, response);
  } catch (error) {
    console.error(error);
    callback(error);
  }
};

function createSyncToken(identity) {
  const AccessToken = Twilio.jwt.AccessToken;
  const SyncGrant = AccessToken.SyncGrant;

  const token = new AccessToken(
    process.env.ACCOUNT_SID,
    process.env.TWILIO_API_KEY,
    process.env.TWILIO_API_SECRET,
    { identity }
  );

  token.addGrant(
    new SyncGrant({ serviceSid: process.env.TWILIO_SYNC_SVC_SID })
  );

  return { identity, token: token.toJwt() };
}
