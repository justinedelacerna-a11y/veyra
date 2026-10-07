/**
 * Generates a Veyra favicon ICO by creating a minimal 32x32 PNG
 * using only Node.js built-ins + canvas (if available) or writing
 * a raw PNG using the pngjs approach.
 * 
 * Simpler approach: use sharp or canvas if available, otherwise
 * we write the SVG as the favicon directly (browsers support SVG favicons).
 */
import { execSync } from "child_process"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, "..")

// Check if sharp is available
try {
  execSync("node -e \"require('sharp')\"", { stdio: "pipe" })
  console.log("sharp is available, generating PNG favicon...")

  const svgSource = fs.readFileSync(path.join(projectRoot, "src/app/icon.svg"))

  // Use sharp via inline node
  const script = `
    const sharp = require('sharp');
    const fs = require('fs');
    sharp(Buffer.from(\`${svgSource.toString().replace(/`/g, "\\`")}\`))
      .resize(180, 180)
      .png()
      .toFile('${path.join(projectRoot, "src/app/apple-icon.png").replace(/\\/g, "\\\\")}')
      .then(() => {
        return sharp(Buffer.from(\`${svgSource.toString().replace(/`/g, "\\`")}\`))
          .resize(32, 32)
          .png()
          .toFile('${path.join(projectRoot, "public/favicon-32.png").replace(/\\/g, "\\\\")}');
      })
      .then(() => console.log('Done'))
      .catch(e => { console.error(e); process.exit(1); });
  `
  execSync(`node -e "${script.replace(/"/g, '\\"').replace(/\n/g, " ")}"`)
  console.log("PNG icons generated successfully.")
} catch {
  console.log("sharp not available — SVG favicon will be used directly by modern browsers.")
  console.log("The icon.svg in src/app/ is picked up automatically by Next.js 13+.")
  console.log("For apple-icon, copying a placeholder...")

  // Create a simple apple-icon note
  console.log("Note: apple-icon.png not generated (no sharp). SVG favicon active for tab icon.")
}
