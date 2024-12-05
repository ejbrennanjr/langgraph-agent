// config.ts
import * as dotenv from "dotenv";

dotenv.config();

export const FINANCIAL_DATASETS_API_KEY =
  process.env.FINANCIAL_DATASETS_API_KEY;
export const LANGCHAIN_API_KEY = process.env.LANGCHAIN_API_KEY;
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
export const SHORTCUT_API_KEY = process.env.SHORTCUT_API_KEY;
export const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
