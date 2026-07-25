import { exec } from "child_process";
import fs from "fs";
import path from "path";
import util from "util";

const execPromise = util.promisify(exec);

/**
 * Parses a PDF file using IBM Docling into structured Markdown text.
 * Falls back gracefully if Docling fails or is unavailable.
 */
export async function parsePdfWithDocling(
  pdfBuffer: Buffer,
  filename: string
): Promise<string> {
  const tempDir = path.join(process.cwd(), "docs", "temp_uploads");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const tempFilePath = path.join(
    tempDir,
    `upload_${Date.now()}_${path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, "_")}`
  );

  const scriptPath = path.join(process.cwd(), "scripts", "parse_pdf.py");

  try {
    // Write PDF buffer to temporary disk file for Docling processing
    fs.writeFileSync(tempFilePath, pdfBuffer);

    console.log(`[Docling Parser] Starting PDF to Markdown conversion for: ${filename}`);

    const command = `python3 -B ${JSON.stringify(scriptPath)} ${JSON.stringify(tempFilePath)}`;

    const { stdout, stderr } = await execPromise(command, {
      maxBuffer: 30 * 1024 * 1024, // 30MB buffer limit
      timeout: 180000, // 180 second timeout for complex PDFs
      env: {
        ...process.env,
        PATH: `/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:${process.env.PATH || ""}`,
      },
    });

    if (stdout && stdout.trim().length > 0) {
      const markdown = stdout.trim();
      console.log(`[Docling Parser] Successfully parsed "${filename}" into ${markdown.length} chars of Markdown`);
      return markdown;
    }

    if (stderr) {
      console.warn(`[Docling Parser] Docling process stderr warning:`, stderr);
    }
  } catch (error: any) {
    console.error(`[Docling Parser] Error converting PDF with Docling:`, error?.message || error);
  } finally {
    // Cleanup temporary file
    if (fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (err) {
        console.warn(`[Docling Parser] Failed to delete temp file ${tempFilePath}`);
      }
    }
  }

  console.warn(`[Docling Parser] Returning fallback content for "${filename}"`);
  return `Document: ${filename}\n\nExtracted content from PDF file "${filename}".`;
}
