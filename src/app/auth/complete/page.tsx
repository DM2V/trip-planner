import { CompleteSessionFromHash } from "./CompleteSessionFromHash";

// Reached only when /auth/callback found no session to establish server-side, which means the
// tokens are in the URL fragment instead of a ?code= query. A fragment never reaches the server,
// so picking it up has to happen in the browser.
export default function AuthCompletePage() {
  return <CompleteSessionFromHash />;
}
