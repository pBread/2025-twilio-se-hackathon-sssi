# Twilio SE Hackathon 2025

# Getting Started

## Populating Env Variables

Populate these environment variables...

```bash
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=

# your ngrok domain
HOSTNAME=

# your personal phone number
DEVELOPERS_PHONE_NUMBER=

OPENAI_API_KEY=

PINCONE_API_KEY=
# any string will do
PINECONE_INDEX_NAME=
```

Then run this script...

```bash

```

## To Do

### Build Script

- Copy env variables to NextJS
- Create entirely new Sync Service

### Sync Service

- Add select or create a Sync Service to the demo UI

### Update Table to Show Multiple Invocation Requests

- Right now, the Turns table doesn't show multiple parralel tool requests. It should.

### Add Summarization

- Update the call with a period summarization.

### integrate the segment interaction history

- Pull the previous conversations of this user and provide them to the bot.

### Fix the selectors issue by including the fetch state in a reselect selector

### Fix UI SyncClient subscriber issue

- the syncClient becomes undefined when the connection status is not connected. It's probably like "connecting" or something.

### Update dummy data dates

- add a make date function to ensure the database is constantly up to date
