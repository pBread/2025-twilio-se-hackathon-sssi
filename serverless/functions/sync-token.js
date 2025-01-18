exports.handler = function (context, event, callback) {
  const token = createSyncToken(event.identity);

  return callback(null, token);
};

function createSyncToken(identity) {
  const AccessToken = Twilio.jwt.AccessToken;
  const SyncGrant = AccessToken.SyncGrant;

  const token = new AccessToken(
    ACCOUNT_SID,
    TWILIO_API_KEY,
    TWILIO_API_SECRET,
    { identity }
  );

  token.addGrant(
    new SyncGrant({ serviceSid: process.env.TWILIO_SYNC_SVC_SID })
  );

  return { identity, token: token.toJwt() };
}
