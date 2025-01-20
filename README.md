# Twilio SE Hackathon 2025

# Getting Started

## Populate Root Env Variables

Populate all of the required variables in the root `.env` file. The setup script will automatically populate the remaining.

```bash
# Your ngrok or server URL, e.g. 123.ngrok.app or myserver.fly.dev
HOSTNAME=

# Twilio credentials can be found here: https://www.twilio.com/user/account
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=

# Flex Workflow SID
FLEX_WORKFLOW_SID=

# this is your (you the developer) personal phone number. it is used in the mock-database.
# must be E164 format, i.e. +12223330001
DEVELOPERS_PHONE_NUMBER=
# This will be the phone number you can call into and the AI will use to send SMS messages, if applicable
# must be E164 format, i.e. +12223330001
TWILIO_DEFAULT_NUMBER=

OPENAI_API_KEY=

PINCONE_API_KEY=
PINECONE_INDEX_NAME=sample-data
```

## Run Setup

After you've populated the required env variables, run the setup script.

```bash
npm run setup
```

## Deploy Serverless Function

```bash
twilio login
# The Account SID for your Twilio Account or Subaccount: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# Your Twilio Auth Token for your Twilio Account or Subaccount: [hidden]
# Shorthand identifier for your profile: my-dev-account

twilio profiles:use my-dev-account

cd serverless
twilio serverless:deploy

```

Once it's deployed, take the base url of the service and add it to the root env file as `TWILIO_FN_BASE_URL`.

## Run Setup Again

Run the setup script again after you deploy your service and add `TWILIO_FN_BASE_URL` to the root env file.

## To Do

### Build Script

### Update Table to Show Multiple Invocation Requests

- Right now, the Turns table doesn't show multiple parralel tool requests. It should.

### integrate the segment interaction history

- Pull the previous conversations of this user and provide them to the bot.

### Fix the selectors issue by including the fetch state in a reselect selector

### Update dummy data dates

- add a make date function to ensure the database is constantly up to date
