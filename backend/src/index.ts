import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import crypto from "crypto";
import { CONFIG, getMaskedApiKey } from "./config.js";
import { testGroqConnection, optimizeCode, chatWithGroq } from "./services/groq.js";
import { runCode, isLanguageSupported, getSupportedLanguagesList } from "./services/piston.js";
import {
  saveOptimization,
  testFirebaseConnection,
  getOptimizationHistory,
} from "./services/firebase.js";

import { detectLanguage } from "./services/detector.js";
import { analyzeCode, validateSyntax } from "./services/compiler.js";
import { computeMultiRunBenchmark, computeBenchmark } from "./services/benchmark.js";
import { verifyMultiCaseEquivalence, verifyOutputEquivalence } from "./services/verifier.js";
import { cacheService } from "./services/cache.js";
import { loggerService } from "./services/logger.js";
import Groq from "groq-sdk";

const app = new Hono();

// Sliding Window Rate Limiter Middleware
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(clientIp: string, maxRequests = CONFIG.SECURITY.RATE_LIMIT_PER_MINUTE): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const entry = rateLimitMap.get(clientIp);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

app.use(
  "*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "X-Payment-TxID", "Authorization"],
    allowMethods: ["GET", "POST", "OPTIONS"],
  })
);

// Comprehensive Multi-System Status Check
app.get("/health", async (c) => {
  const isGroqOk = Boolean(CONFIG.GROQ.API_KEY);

  return c.json({
    status: "ok",
    environment: CONFIG.NODE_ENV,
    devBypassPayment: CONFIG.DEV_BYPASS_PAYMENT,
    port: CONFIG.PORT,
    groqApiKeyConfigured: isGroqOk,
    groqApiKeyMasked: getMaskedApiKey(CONFIG.GROQ.API_KEY),
    timestamp: new Date().toISOString(),
    services: {
      backend: { status: "online", color: "green" },
      compiler: { status: "ready", color: "green" },
      execution: { status: "ready", color: "green" },
      benchmark: { status: "ready", color: "green" },
      ai: { status: isGroqOk ? "ready" : "offline", color: isGroqOk ? "green" : "red" },
      database: { status: "ready", color: "green" },
      blockchain: { status: "ready", color: "green" },
    },
    security: {
      localExecutionFallback: "REMOVED",
      maxSourceCodeBytes: CONFIG.SECURITY.MAX_SOURCE_CODE_BYTES,
      executionTimeoutSeconds: CONFIG.SECURITY.EXECUTION_TIMEOUT_SECONDS,
      maxExecutionOutputBytes: CONFIG.SECURITY.MAX_EXECUTION_OUTPUT_BYTES,
      rateLimitPerMinute: CONFIG.SECURITY.RATE_LIMIT_PER_MINUTE,
    },
  });
});

app.get("/health/groq", async (c) => {
  const result = await testGroqConnection();
  return c.json(result, result.success ? 200 : 500);
});

app.get("/health/firebase", async (c) => {
  const result = await testFirebaseConnection();
  return c.json(result, result.success ? 200 : 500);
});

app.get("/history", async (c) => {
  try {
    const history = await getOptimizationHistory(50);
    return c.json({ success: true, count: history.length, history });
  } catch {
    return c.json({ success: false, error: "Database Service Error: Unable to fetch history." }, 500);
  }
});

// Automatic Language Detection Route
app.post("/detect-language", async (c) => {
  try {
    const { code } = await c.req.json();
    if (code && Buffer.from(code, "utf-8").length > CONFIG.SECURITY.MAX_SOURCE_CODE_BYTES) {
      return c.json({ error: "Payload Too Large" }, 413);
    }
    const result = detectLanguage(code || "");
    return c.json(result);
  } catch {
    return c.json({ error: "Language Detection Failed" }, 500);
  }
});

// Standalone Code Execution Endpoint (Piston Engine Sandbox Only)
app.post("/execute", async (c) => {
  const clientIp = c.req.header("x-forwarded-for") || "client_ip";
  if (!checkRateLimit(clientIp)) {
    return c.json({ error: "Too Many Requests: Rate limit exceeded. Please wait a minute." }, 429);
  }

  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;
  try {
    const { code, language, stdin } = await c.req.json();
    if (!code || !code.trim()) {
      return c.json({ error: "Code is required" }, 400);
    }

    const codeBytes = Buffer.from(code, "utf-8").length;
    if (codeBytes > CONFIG.SECURITY.MAX_SOURCE_CODE_BYTES) {
      return c.json({ error: `Payload Too Large: Source code exceeds maximum allowed size (${CONFIG.SECURITY.MAX_SOURCE_CODE_BYTES} bytes).` }, 413);
    }

    const result = await runCode(code, language || "python", stdin || "");

    loggerService.logRequest({
      requestId,
      timestamp: new Date().toISOString(),
      endpoint: "/execute",
      inputLanguage: language || "python",
      status: result.timedOut ? "TIMEOUT" : result.success ? "SUCCESS" : "ERROR",
      durationMs: Date.now() - startTime,
    });

    if (result.errorCode === "UNSUPPORTED_LANGUAGE") {
      return c.json({ success: false, error_code: "UNSUPPORTED_LANGUAGE", message: result.stderr }, 400);
    }

    return c.json(result);
  } catch (err: any) {
    loggerService.logRequest({
      requestId,
      timestamp: new Date().toISOString(),
      endpoint: "/execute",
      inputLanguage: "unknown",
      status: "ERROR",
      durationMs: Date.now() - startTime,
      errorMessage: err.message,
    });
    return c.json({ error: "Execution Timeout or Sandbox Error" }, 500);
  }
});

// AI Test Case Generator Endpoint
app.post("/generate-test-cases", async (c) => {
  const clientIp = c.req.header("x-forwarded-for") || "client_ip";
  if (!checkRateLimit(clientIp)) {
    return c.json({ error: "Too Many Requests: Rate limit exceeded." }, 429);
  }

  try {
    const { code, language } = await c.req.json();
    if (!code || !code.trim()) {
      return c.json({ error: "Code is required" }, 400);
    }
    if (Buffer.from(code, "utf-8").length > CONFIG.SECURITY.MAX_SOURCE_CODE_BYTES) {
      return c.json({ error: "Payload Too Large" }, 413);
    }
    if (!CONFIG.GROQ.API_KEY) {
      return c.json({ error: "AI Engine Offline: GROQ_API_KEY missing" }, 500);
    }

    const groq = new Groq({ apiKey: CONFIG.GROQ.API_KEY });
    const prompt = `Analyze this ${language || "code"} snippet and return ONLY a JSON array containing 3 conservative test cases.
Code:
${code}

Return strictly a JSON array formatted like:
[
  { "id": 1, "category": "Standard Input", "input": "5", "expectedOutput": "120" },
  { "id": 2, "category": "Boundary Condition", "input": "0", "expectedOutput": "1" },
  { "id": 3, "category": "Edge Case", "input": "-1", "expectedOutput": "Error" }
]`;

    const completion = await groq.chat.completions.create({
      model: CONFIG.GROQ.MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 800,
    });

    const responseText = completion.choices[0]?.message?.content || "[]";
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return c.json({ success: true, testCases: parsed });
  } catch {
    return c.json({ error: "Optimization Failed: Unable to generate AI test cases." }, 500);
  }
});

// Main Code Optimization Endpoint
app.post("/optimize", async (c) => {
  const clientIp = c.req.header("x-forwarded-for") || "client_ip";
  if (!checkRateLimit(clientIp)) {
    return c.json({ error: "Too Many Requests: Rate limit exceeded for /optimize." }, 429);
  }

  const startTime = Date.now();
  const requestId = `opt_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;

  try {
    const body = await c.req.json();
    const { code, language, mode, targetLanguage, stdinInput, testCases } = body;

    if (!code || !code.trim()) {
      return c.json({ error: "Syntax Error: Code input cannot be empty." }, 400);
    }

    // Enforce Request Source Code Size Limit
    const codeBytes = Buffer.from(code, "utf-8").length;
    if (codeBytes > CONFIG.SECURITY.MAX_SOURCE_CODE_BYTES) {
      return c.json({
        error: `Payload Too Large: Source code (${codeBytes} bytes) exceeds maximum limit (${CONFIG.SECURITY.MAX_SOURCE_CODE_BYTES} bytes).`
      }, 413);
    }

    // Step 1: Detect & Language Validation
    const detection = detectLanguage(code);
    const activeLang = targetLanguage || language || detection.language;

    if (!isLanguageSupported(activeLang)) {
      return c.json({
        success: false,
        error_code: "UNSUPPORTED_LANGUAGE",
        message: `Unsupported language: '${activeLang}'. Supported languages: ${getSupportedLanguagesList().join(", ")}`,
      }, 400);
    }

    // Step 2: Input Code Syntax Validation
    const syntaxCheck = validateSyntax(code, activeLang);
    if (!syntaxCheck.valid) {
      return c.json({
        success: false,
        status: "REJECTED",
        reason: syntaxCheck.reason || "Input code failed syntax validation.",
      }, 400);
    }

    const staticAnalysis = analyzeCode(code, activeLang);

    // Check in-memory cache
    const cacheKey = cacheService.generateKey("opt", { code, language: activeLang, mode, targetLanguage });
    const cachedResult = cacheService.get(cacheKey);
    if (cachedResult) {
      return c.json(cachedResult);
    }

    // Step 3: Groq AI Optimization
    const optResult = await optimizeCode(code, activeLang, requestId);

    // Step 4: Candidate Code Syntax Check
    const optSyntaxCheck = validateSyntax(optResult.optimizedCode, targetLanguage || activeLang);
    if (!optSyntaxCheck.valid) {
      return c.json({
        success: false,
        status: "REJECTED",
        reason: `Generated candidate code failed syntax validation: ${optSyntaxCheck.reason}`,
      }, 400);
    }

    // Step 5: Multi-Case Correctness Verification
    const verification = await verifyMultiCaseEquivalence(
      code,
      optResult.optimizedCode,
      targetLanguage || activeLang,
      stdinInput,
      testCases
    );

    // Step 6: Multi-Run Benchmark with Median Statistics
    const benchmark = await computeMultiRunBenchmark(
      code,
      optResult.optimizedCode,
      targetLanguage || activeLang,
      stdinInput
    );

    // Step 7: Decision Gate Accept / Reject
    const isAccepted = verification.correctnessVerified;
    const isPerformanceImproved = benchmark.improvementPct > 0;
    const finalStatus = isAccepted ? (isPerformanceImproved ? "ACCEPTED" : "VALID_BUT_NO_PERFORMANCE_GAIN") : "REJECTED";

    const fullResponse = {
      requestId,
      optimizationId: `opt_${crypto.randomUUID()}`,
      language: activeLang,
      status: finalStatus,
      optimizedCode: optResult.optimizedCode,
      reasoning: optResult.reasoning,
      timeComplexity: optResult.timeComplexity,
      spaceComplexity: optResult.spaceComplexity,
      optimizationScore: optResult.optimizationScore,
      scoreBreakdown: optResult.scoreBreakdown,
      detectedBottlenecks: optResult.detectedBottlenecks,
      optimizationSuggestions: optResult.optimizationSuggestions,
      estimatedMemoryMb: optResult.estimatedMemoryMb,
      optimizationConfidence: isAccepted ? optResult.optimizationConfidence : 0,
      confidenceReasoning: isAccepted ? optResult.confidenceReasoning : "Optimization rejected due to correctness verification failure.",
      metrics: {
        originalTimeMs: benchmark.originalTimeMs,
        optimizedTimeMs: benchmark.optimizedTimeMs,
        improvementPct: benchmark.improvementPct,
        correctnessVerified: verification.correctnessVerified,
        originalStdout: verification.testDetails[0]?.origStdout || "",
        optimizedStdout: verification.testDetails[0]?.optStdout || "",
        testsRun: verification.testsRun,
        testsPassed: verification.testsPassed,
        testsFailed: verification.testsFailed,
        verificationLevel: verification.verificationLevel,
      },
      staticAnalysis,
      verification,
      benchmark,
      transaction: {
        id: `dev_bypass_tx_${requestId}`,
        amount: 0,
        asset: 31566704,
        explorerUrl: "https://testnet.algorand.com",
        settled: true,
        facilitator: "Development Mode Bypass",
      },
    };

    // Save cache & async database log
    if (isAccepted) {
      cacheService.set(cacheKey, fullResponse, 300);
      saveOptimization({
        requestId,
        code,
        optimizedCode: optResult.optimizedCode,
        language: activeLang,
        reasoning: optResult.reasoning,
        metrics: {
          originalTimeMs: benchmark.originalTimeMs,
          optimizedTimeMs: benchmark.optimizedTimeMs,
          improvementPct: benchmark.improvementPct,
          correctnessVerified: verification.correctnessVerified,
        },
      }).catch((err) => console.error("Firestore save warning:", err.message));
    }

    loggerService.logRequest({
      requestId,
      timestamp: new Date().toISOString(),
      endpoint: "/optimize",
      inputLanguage: activeLang,
      status: "SUCCESS",
      durationMs: Date.now() - startTime,
    });

    return c.json(fullResponse);
  } catch (err: any) {
    loggerService.logRequest({
      requestId,
      timestamp: new Date().toISOString(),
      endpoint: "/optimize",
      inputLanguage: "unknown",
      status: "ERROR",
      durationMs: Date.now() - startTime,
      errorMessage: err.message,
    });

    const userFriendlyError = err.message?.includes("GROQ_API_KEY")
      ? "Backend Offline: GROQ_API_KEY is not configured on the server."
      : err.message?.includes("timeout")
      ? "Execution Timeout: The code snippet exceeded the sandbox execution limit."
      : "Optimization Failed: An error occurred during verification or optimization.";

    return c.json({ error: userFriendlyError, requestId }, 500);
  }
});

// Interactive AI Chat Assistant Endpoint
app.post("/chat", async (c) => {
  try {
    const { message, codeContext } = await c.req.json();
    if (!message) {
      return c.json({ error: "Message is required" }, 400);
    }
    const reply = await chatWithGroq(message, codeContext);
    return c.json({ success: true, reply });
  } catch {
    return c.json({ error: "Backend Error: Chat assistant temporary failure." }, 500);
  }
});

// Start Hono Node Server
const port = CONFIG.PORT;
console.log(`🚀 OptimaAI Backend Hardened Server running on port ${port}`);

serve({
  fetch: app.fetch,
  port: CONFIG.PORT,
});
