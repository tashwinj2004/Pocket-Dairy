const { spawn } = require("child_process");
const path = require("path");

console.log("\x1b[35m%s\x1b[0m", "==================================================");
console.log("\x1b[35m%s\x1b[0m", "       Pocket Dairy - Dual Service Launcher       ");
console.log("\x1b[35m%s\x1b[0m", "==================================================");
console.log("Starting backend and frontend services simultaneously...\n");

// Determine path to local virtual env uvicorn
const isWindows = process.platform === "win32";
const backendCmd = isWindows ? "venv\\Scripts\\uvicorn" : "venv/bin/uvicorn";

// Start Backend
const backend = spawn(backendCmd, ["main:app", "--reload", "--port", "9091"], {
  cwd: path.join(__dirname, "backend"),
  shell: true,
});

// Start Frontend
const frontend = spawn("npm", ["run", "dev"], {
  cwd: path.join(__dirname, "frontend"),
  shell: true,
});

// Log piper
function pipeOutput(childProcess, prefix, colorCode) {
  childProcess.stdout.on("data", (data) => {
    const lines = data.toString().split("\n");
    lines.forEach((line) => {
      if (line.trim()) {
        console.log(`${colorCode}[${prefix}]\x1b[0m ${line.trim()}`);
      }
    });
  });

  childProcess.stderr.on("data", (data) => {
    const lines = data.toString().split("\n");
    lines.forEach((line) => {
      if (line.trim()) {
        console.error(`${colorCode}[${prefix} - Error]\x1b[0m ${line.trim()}`);
      }
    });
  });

  childProcess.on("close", (code) => {
    console.log(`${colorCode}[${prefix}]\x1b[0m exited with code ${code}`);
  });
}

// Pipe color-coded outputs (Cyan for Backend, Yellow for Frontend)
pipeOutput(backend, "Backend", "\x1b[36m");
pipeOutput(frontend, "Frontend", "\x1b[33m");

// Handle termination gracefully
function shutdown() {
  console.log("\n\x1b[31mShutting down all services...\x1b[0m");
  backend.kill("SIGTERM");
  frontend.kill("SIGTERM");
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
