// Script to convert all talk & training YAML (MDX frontmatter) from "calendar" folder to JSON

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Directory containing calendar MDX files
const calendarDir = path.join(__dirname, '..', 'src', 'data', 'gigs');

// Output path
const outputPath = path.join(__dirname, '..', 'public', 'data', 'gigs.json');

// Helper: Recursively get all .mdx files in directory
function getMdxFiles(dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getMdxFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
      results.push(fullPath);
    }
  }
  return results;
}

// Read, parse, collect data
function collectGigs() {
  const files = getMdxFiles(calendarDir);

  // We'll gather all events with their nested sessions
  let allEvents = [];

  for (const filePath of files) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(fileContent);

    // Each file represents a "conference" or "event"
    // Attach the file source for traceability
    const event = {
      file: path.relative(calendarDir, filePath),
      ...data,
    };

    // Keep talks nested within the event
    allEvents.push(event);
  }

  return allEvents;
}

// Main process
function main() {
  const events = collectGigs();
  // Sort events by date.start (if available)
  events.sort((a, b) => {
    const aStart = a.date?.start;
    const bStart = b.date?.start;
    if (!aStart) return 1;
    if (!bStart) return -1;
    return aStart.localeCompare(bStart);
  });

  // Ensure the output directory exists
  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(events, null, 2), 'utf8');
  console.log(`Exported ${events.length} gigs to ${outputPath}`);
}

main();
