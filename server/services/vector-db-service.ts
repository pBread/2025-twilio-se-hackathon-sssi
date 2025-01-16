import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";
import log from "../logger";
import { OPENAI_API_KEY, PINCONE_API_KEY } from "../env";

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const EMBEDDING_MODEL = "text-embedding-3-large";
const NS = "conversations";

const pc = new Pinecone({ apiKey: PINCONE_API_KEY });

async function initializeIndex(attempt = 0) {}
