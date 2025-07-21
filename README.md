<h1 align="center">
Super Safe Superintelligence<br>
<sub>Twilio Solutions Team 2025 Hackathon</sub>
</h1>

https://github.com/user-attachments/assets/a6f62d24-0001-449c-a952-8fb3a8635c58

## Overview

This repository demonstrates an experimental voice AI agent built on Twilio ConversationRelay. The system explores novel patterns for maintaining agent control in realtime voice interactions.

The architecture implements a "conscious-subconscious" pattern, similar to [Talker-Reasoner](https://arxiv.org/abs/2410.08328). The primary LLM is solely focused on customer dialogue while background processes monitor and adjust its behavior through state updates.

The demo features three control layers:

### Recall

Recall is cross-agent, episodic memory. Human-annotated call transcripts are embedded in a vector store. During conversations, the system retrieves contextually similar historical calls and injects their feedback into the active LLM. This creates a learning loop without requiring model retraining or system prompt modifications.

### Governance Bot

A supervisory agent continuously monitors conversations against business procedures. It provides real-time coaching to guide the primary agent's actions and enforces programmatic workflows.

### Human in the Loop

The primary LLM can escalate questions to human operators when needed. Critical actions require explicit human approval, creating hard stops that prevent unauthorized behaviors.

## Getting Started

### Populate Root Env Variables

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

PINECONE_API_KEY=
PINECONE_INDEX_NAME=sample-data
```

### Run Setup

After you've populated the required env variables, run the setup script.

```bash
npm install
npm run setup
```

### Open Four (yes 4) Terminal Tabs

#### Terminal 1: server

```bash
npm run dev
```

The server should be running on `localhost:3001`

##### Populate Sample Data

After you start your server, open `localhost:3001/api/reset` in a browser. This will populate your demo with sample data.

_Note: You can reset your demo anytime by simply opening `localhost:3001/api/reset` in a browser._

#### Terminal 2: ngrok

```bash
npm run grok
```

#### Terminal 3: UI

```bash
cd ui
npm install
npm run dev
```

The UI will be running on `localhost:3002`.

_Note: It will crash if you haven't populated your demo w/data, see above_

#### Terminal 4: Flex-Plugin

```bash
cd flex-plugin
npm install
npm run dev
```

Flex should be running on `localhost:3000`
