
import "dotenv/config";
import { createInterface } from "node:readline";
import { stdin, stdout } from "node:process";
import { prisma } from "../src/lib/prisma.js";
import { hashPassword } from "../src/lib/password.js";

function ask(question: string): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// Read the password without displaying it in the terminal.
function askHiddenPassword(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
      reject(new Error("Run this script in a normal VS Code terminal."));
      return;
    }

    stdout.write("Admin password (input hidden): ");
    stdin.setRawMode(true);
    stdin.resume();

    let password = "";

    const cleanup = () => {
      stdin.removeListener("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write("\n");
    };

    const onData = (chunk: Buffer) => {
      for (const char of chunk.toString("utf8")) {
        if (char === "\u0003") {
          cleanup();
          reject(new Error("Cancelled."));
          return;
        }

        if (char === "\r" || char === "\n") {
          cleanup();
          resolve(password);
          return;
        }

        if (char === "\u007f" || char === "\b") {
          password = password.slice(0, -1);
          continue;
        }

        if (char >= " " && char !== "\u007f") {
          password += char;
        }
      }
    };

    stdin.on("data", onData);
  });
}

async function main() {
  const email = (await ask("Admin email: ")).toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address.");
  }

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    throw new Error(
      "This email already exists. No account was created or changed.",
    );
  }

  const password = await askHiddenPassword();

  if (password.length < 12) {
    throw new Error("Use a password with at least 12 characters.");
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: "ADMIN",
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  console.log("Admin account created successfully:");
  console.log(user);
}

main()
  .catch((error: unknown) => {
    console.error(
      "Could not create Admin account:",
      error instanceof Error ? error.message : "Unknown error",
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
