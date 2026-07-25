const { execSync } = require("child_process");

console.log("[Setup Docling] Checking Python environment for Docling installation...");

try {
  // Check if docling Python module or CLI exists
  try {
    execSync("python3 -c 'import docling'", { stdio: "ignore" });
    console.log("[Setup Docling] Docling Python module is already installed.");
    process.exit(0);
  } catch {
    try {
      execSync("which docling", { stdio: "ignore" });
      console.log("[Setup Docling] Docling CLI is already installed.");
      process.exit(0);
    } catch {
      // Proceed with pip installation
    }
  }

  console.log("[Setup Docling] Docling not found. Installing via pip...");
  execSync(
    "python3 -m pip install --no-cache-dir docling || pip3 install docling || pip install docling",
    { stdio: "inherit" }
  );
  console.log("[Setup Docling] Docling installed successfully!");
} catch (error) {
  console.warn("[Setup Docling] Warning: Could not install docling automatically:", error.message);
  console.warn("[Setup Docling] Continuing build. Runtime will fallback gracefully if Docling is unavailable.");
}
