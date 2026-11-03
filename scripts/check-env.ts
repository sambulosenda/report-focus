import { envProblems } from "../src/lib/env-check";

// Fly runs this on a throwaway machine before each deploy (release_command in fly.toml). A failure stops the deploy
// and the running site keeps serving.
const problems = envProblems(process.env);
if (problems.length) {
  console.error(`Missing or invalid settings:\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
console.log("Settings OK.");
