/**
 * POST /api/academy/lessons/[id]/exercise
 *
 * Submits a code exercise for a lesson. Runs a lightweight JS sandbox
 * (vm.runInNewContext) to evaluate the code and return output.
 *
 * Auth: requires userId or memberId
 *
 * Request body:
 * {
 *   userId?: string
 *   memberId?: string
 *   code: string           // submitted code
 *   language?: string      // "javascript" (default) | "typescript" | "python"
 * }
 *
 * Response:
 * {
 *   data: {
 *     id: string
 *     output: string       // captured stdout / error message
 *     passed: boolean      // true if output contains "✅" or no error
 *     language: string
 *     createdAt: string
 *   }
 * }
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError, badRequest, notFound, ok } from "@/lib/api/response";

// Simple sandbox: captures console.log output + error messages
function runSandbox(code: string, language: string): { output: string; passed: boolean } {
  if (language === "python") {
    return {
      output: "⚠️ Python sandbox not yet implemented. Try JavaScript!",
      passed: false,
    };
  }

  const logs: string[] = [];

  try {
    // vm is a built-in Node.js module — safe for controlled code execution
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const vm = require("vm") as typeof import("vm");

    const sandbox = {
      console: {
        log: (...args: unknown[]) => logs.push(args.map(String).join(" ")),
        error: (...args: unknown[]) => logs.push("[ERROR] " + args.map(String).join(" ")),
        warn: (...args: unknown[]) => logs.push("[WARN] " + args.map(String).join(" ")),
      },
    };

    // Allow 2 seconds max execution via context timeout (not ScriptOptions)
    const script = new vm.Script(code);
    script.runInNewContext(sandbox, { timeout: 2000 });

    const output = logs.length > 0 ? logs.join("\n") : "// No output";
    const passed = output.includes("✅") || (logs.length > 0 && !output.includes("[ERROR]"));
    return { output, passed };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const output = `💥 Runtime Error:\n${message}`;
    return { output, passed: false };
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: lessonId } = await params;
    const body = await req.json();
    const { userId, memberId, code, language = "javascript" } = body;

    if (!userId && !memberId) {
      return badRequest("userId or memberId is required");
    }
    if (!code || typeof code !== "string") {
      return badRequest("code is required and must be a string");
    }
    if (code.length > 50_000) {
      return badRequest("code exceeds maximum length of 50,000 characters");
    }

    // Validate lesson exists
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) return notFound("Lesson not found");

    // Run sandbox
    const { output, passed } = runSandbox(code, language);

    // Persist submission
    const exercise = await prisma.lessonExercise.create({
      data: {
        lessonId,
        userId: userId ?? null,
        memberId: memberId ?? null,
        code,
        language,
        output,
        passed,
      },
    });

    return ok({
      id: exercise.id,
      output: exercise.output,
      passed: exercise.passed,
      language: exercise.language,
      createdAt: exercise.createdAt.toISOString(),
    });
  } catch (error) {
    return handleError(error);
  }
}
