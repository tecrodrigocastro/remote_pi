import type { Metadata } from "next";
import Link from "next/link";
import {
  DocsShell,
  DocsSection,
  DocsSubsection,
  InlineCode,
  DocsTable,
} from "@/components/docs-shell";
import { CodeBlock } from "@/components/code-block";

export const metadata: Metadata = {
  title: "Docs",
  description:
    "How to install Remote Pi, pair a mobile device, run an agent network, and self-host the relay.",
};

const GITHUB_URL = "https://github.com/jacobaraujo7/remote_pi";
const PI_URL = "https://github.com/earendil-works/pi";
const RELAY_README_URL =
  "https://github.com/jacobaraujo7/remote_pi/blob/main/relay/README.md";
const ISSUES_URL = "https://github.com/jacobaraujo7/remote_pi/issues";

export default function DocsPage() {
  return (
    <DocsShell
      title="Remote Pi docs"
      lastUpdated="2026-05-24"
      sidebar={<DocsToc />}
      intro={
        <p>
          Extend the{" "}
          <a className="text-accent underline" href={PI_URL} target="_blank" rel="noopener noreferrer">
            Pi coding agent
          </a>{" "}
          with two superpowers: agents that talk to each other on the same
          machine, and a mobile app that drives Pi from your phone.{" "}
          <InlineCode>/remote-pi</InlineCode> is a single slash command that
          wires both at once — run it once and you&apos;re done.
        </p>
      }
    >
      <DocsSection id="quick-start" title="Quick start">
        <p>Install the extension (one-time):</p>
        <CodeBlock code="pi install npm:remote-pi" label="On your Pi" language="bash" />
        <p>Then in any Pi terminal:</p>
        <CodeBlock code="/remote-pi" label="In Pi" language="text" />
        <p>
          The first run shows a short interactive wizard (agent name, default
          session, whether to auto-start the relay). On every following run,{" "}
          <InlineCode>/remote-pi</InlineCode> joins the local agent session and
          starts the relay automatically — no extra typing.
        </p>

        <DocsSubsection id="agent-network-30s" title="Try the agent network in 30 seconds">
          <p>
            Open <strong className="text-fg">two</strong> Pi terminals in the
            same directory and run <InlineCode>/remote-pi</InlineCode> in each.
            Both join the same session. Now just talk to the LLM — it has the
            tools.
          </p>
          <p>
            In terminal A (say it ended up named <InlineCode>agent-A</InlineCode>):
          </p>
          <CodeBlock
            code="Who else is connected in our agent session? List them."
            label="agent-A · prompt"
            language="text"
          />
          <p>
            The LLM calls <InlineCode>agent_send</InlineCode> to{" "}
            <InlineCode>broker</InlineCode> with{" "}
            <InlineCode>{`{ type: "list_peers" }`}</InlineCode> and replies with
            the names it sees.
          </p>
          <p>Then, still in terminal A:</p>
          <CodeBlock
            code="Send a ping to agent-B and wait for a reply."
            label="agent-A · prompt"
            language="text"
          />
          <p>
            Pi calls{" "}
            <InlineCode>{`agent_request({ to: "agent-B", body: { type: "ping" } })`}</InlineCode>.
            The message arrives in terminal B as a user-facing turn — terminal
            B&apos;s LLM answers, and the reply lands back in terminal A. Two
            agents, one prompt each, full round trip.
          </p>
          <p className="text-sm">
            (Replace <InlineCode>agent-B</InlineCode> with whatever name
            terminal B reports for itself — the wizard&apos;s default is the
            directory name plus a <InlineCode>#N</InlineCode> suffix on
            collision.)
          </p>
        </DocsSubsection>
      </DocsSection>

      <DocsSection id="what-it-does" title="What it does">
        <p>
          Remote Pi adds two independent layers on top of Pi. You can use
          either, or both.
        </p>

        <DocsSubsection id="agent-network-layer" title="1) Agent network (local, same machine)">
          <p>
            Several Pi instances running side-by-side in different terminals can
            discover each other and exchange messages. Each instance is a peer
            in a named <em>session</em> and gets two tools the LLM can call
            directly:
          </p>
          <ul className="ml-6 list-disc space-y-2">
            <li><InlineCode>agent_send</InlineCode> — fire-and-forget message to another agent</li>
            <li><InlineCode>agent_request</InlineCode> — send and await a reply (correlated by message id)</li>
          </ul>
          <p>
            This is purely local: the agents talk over a Unix domain socket at{" "}
            <InlineCode>~/.pi/remote/sessions/&lt;session-name&gt;/broker.sock</InlineCode>.
            No network involved. Useful for splitting work across roles
            (<InlineCode>backend</InlineCode>, <InlineCode>frontend</InlineCode>,{" "}
            <InlineCode>tests</InlineCode>, <InlineCode>orchestrator</InlineCode>, …)
            and letting them coordinate.
          </p>
          <p>
            The first agent to enter a session becomes the{" "}
            <em>leader</em> (hosts the broker); the rest are{" "}
            <em>followers</em>. If the leader exits, a follower automatically
            takes over — the failover is invisible to the LLMs.
          </p>
        </DocsSubsection>

        <DocsSubsection id="mobile-app-layer" title="2) Mobile app (over the relay)">
          <p>
            The companion mobile app lets you send prompts to Pi and read its
            responses from your phone. The phone and the Pi process find each
            other through a <strong className="text-fg">relay</strong>: a small
            WebSocket server that ferries messages between them. Pairing is
            one-time and per device, via QR code.
          </p>
          <p>
            <strong className="text-fg">Trust model (current MVP).</strong>{" "}
            Connections to the relay are TLS 1.3. Devices authenticate each
            other with Ed25519 challenge-response at pairing time, so paired
            peers can verify identity cryptographically.{" "}
            <strong className="text-fg">
              Application-layer end-to-end encryption of message payloads is
              not active in the current MVP
            </strong>{" "}
            — payloads travel base64-encoded over TLS, and the relay operator
            could in principle access plaintext in memory while forwarding. The
            public relay (operated by Flutterando) does not log, persist, or
            inspect payloads. If you need cryptographic confidentiality from
            the relay operator, run your own relay — see{" "}
            <a href="#relay" className="text-accent underline">
              The relay
            </a>{" "}
            below for a self-host guide. Restoring per-message E2E encryption
            is on the roadmap.
          </p>
          <p>App downloads:</p>
          <ul className="ml-6 list-disc space-y-2">
            <li>
              <strong className="text-fg">Google Play</strong> — <em>coming soon</em>
            </li>
            <li>
              <strong className="text-fg">App Store</strong> — <em>coming soon</em>
            </li>
            <li>
              <strong className="text-fg">Android APK</strong> — direct download from the{" "}
              <a className="text-accent underline" href={`${GITHUB_URL}/releases`} target="_blank" rel="noopener noreferrer">
                GitHub Releases page
              </a>
              .
            </li>
          </ul>
          <p>
            Until the public stores have the app, follow{" "}
            <a className="text-accent underline" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              the repo
            </a>{" "}
            for build/beta info.
          </p>
        </DocsSubsection>
      </DocsSection>

      <DocsSection id="install" title="Install">
        <p>
          Requirements: Node 20+ and Pi (the host coding agent).
        </p>
        <CodeBlock code="pi install npm:remote-pi" label="Install" language="bash" />
        <p>
          The extension self-registers the <InlineCode>/remote-pi</InlineCode>{" "}
          slash command and deploys an agent skill that teaches the LLM how to
          use <InlineCode>agent_send</InlineCode> /{" "}
          <InlineCode>agent_request</InlineCode>.
        </p>
        <p>To verify:</p>
        <CodeBlock code="/remote-pi config" label="In Pi" language="text" />
        <p>
          It should print the effective relay URL and where it came from
          (<InlineCode>env</InlineCode> / <InlineCode>config</InlineCode> /{" "}
          <InlineCode>default</InlineCode>).
        </p>
        <p>
          <strong className="text-fg">Planning to use daemon mode?</strong>{" "}
          Also install the package globally via npm — that puts the{" "}
          <InlineCode>remote-pi</InlineCode> and{" "}
          <InlineCode>pi-supervisord</InlineCode> binaries on your PATH. The
          two installs are independent and can coexist:
        </p>
        <CodeBlock
          code="npm install -g remote-pi"
          label="Optional · for daemon mode"
          language="bash"
        />
        <p>
          <InlineCode>pi install npm:remote-pi</InlineCode> exposes the
          extension to the Pi runtime. <InlineCode>npm install -g remote-pi</InlineCode>{" "}
          additionally drops two CLI binaries on your PATH that the daemon
          flow needs. See{" "}
          <a href="#daemon-mode" className="text-accent underline">
            Daemon mode
          </a>{" "}
          for the rest.
        </p>
      </DocsSection>

      <DocsSection id="using-remote-pi" title="Using /remote-pi">
        <p>The bare command is the everyday entry point:</p>
        <CodeBlock code="/remote-pi" label="In Pi" language="text" />
        <p>
          Behavior depends on whether there&apos;s a local config for this
          directory:
        </p>
        <DocsTable
          headers={["State", "What happens"]}
          rows={[
            [
              <>First run (no <InlineCode>.pi/remote-pi/config.json</InlineCode>)</>,
              "Interactive wizard → saves config → joins agent session → starts relay (if you opted in)",
            ],
            [
              "Returning user, auto-start enabled",
              "Joins agent session + starts relay automatically, then prints status",
            ],
            [
              "Returning user, auto-start disabled",
              "Prints status only; join/relay must be run manually",
            ],
          ]}
        />
        <p>The wizard asks three questions:</p>
        <ol className="ml-6 list-decimal space-y-2">
          <li>
            <strong className="text-fg">Agent name</strong> — how other agents
            will address you in <InlineCode>agent_send</InlineCode> /{" "}
            <InlineCode>agent_request</InlineCode>. Defaults to the directory
            name.
          </li>
          <li>
            <strong className="text-fg">Default session</strong> — the name of
            the agent-network room for this directory. Multiple terminals in
            the same directory join the same session.
          </li>
          <li>
            <strong className="text-fg">Auto-start relay (for mobile app access)?</strong>{" "}
            — <InlineCode>Yes</InlineCode> if you want{" "}
            <InlineCode>/remote-pi</InlineCode> to also connect to the relay so
            the mobile app can reach this Pi. <InlineCode>No</InlineCode> for
            local-only use (agent network without mobile access).
          </li>
        </ol>
        <p>
          Re-run the wizard later with <InlineCode>/remote-pi setup</InlineCode>.
        </p>
      </DocsSection>

      <DocsSection id="pairing" title="Pairing a mobile device">
        <p>
          Once the relay is up (<InlineCode>/remote-pi relay status</InlineCode>{" "}
          shows <InlineCode>started</InlineCode> or <InlineCode>paired</InlineCode>):
        </p>
        <CodeBlock code="/remote-pi pair" label="In Pi" language="text" />
        <p>
          A QR code is printed in the terminal. Scan it with the Remote Pi
          mobile app. Pairing is{" "}
          <strong className="text-fg">per machine</strong> — once a device is
          paired, every Pi process on this machine accepts it (it lives in{" "}
          <InlineCode>~/.pi/remote/peers.json</InlineCode>).
        </p>
        <p>To list paired devices:</p>
        <CodeBlock code="/remote-pi devices" label="In Pi" language="text" />
        <p>To remove one:</p>
        <CodeBlock code="/remote-pi revoke <shortid>" label="In Pi" language="text" />
        <p>
          The shortid is the first 8 chars shown by{" "}
          <InlineCode>devices</InlineCode>.
        </p>
      </DocsSection>

      <DocsSection id="relay" title="The relay">
        <p>
          The relay is the only network-touching piece of Remote Pi. It does{" "}
          <strong className="text-fg">not</strong> read messages — payloads are
          end-to-end encrypted between the Pi and the paired device — but it
          sees connection metadata: which keypair is online, which room/cwd
          identifiers exist, message timing, sizes.
        </p>
        <p>You have two options.</p>

        <DocsSubsection id="community-relay" title="Option A — Use the community relay">
          <p>
            <InlineCode>https://relay-rp1.jacobmoura.work</InlineCode> (default).
            Zero setup. Good for trying things out or for casual use.
            (Internally the extension uses the WebSocket form{" "}
            <InlineCode>wss://…</InlineCode> — both schemes point at the same
            endpoint.)
          </p>
          <p>Caveats:</p>
          <ul className="ml-6 list-disc space-y-2">
            <li>Shared infrastructure — availability is best-effort.</li>
            <li>
              The operator could observe connection metadata as described above.
            </li>
            <li>
              TLS + per-message encryption is the only protection;{" "}
              <strong className="text-fg">there is no IP allow-listing or VPN gating</strong>.
            </li>
          </ul>
        </DocsSubsection>

        <DocsSubsection id="self-host" title="Option B — Self-host (recommended for privacy)">
          <p>
            Run the relay yourself in Docker and put it behind a VPN like{" "}
            <a className="text-accent underline" href="https://tailscale.com" target="_blank" rel="noopener noreferrer">Tailscale</a>,{" "}
            <a className="text-accent underline" href="https://www.wireguard.com" target="_blank" rel="noopener noreferrer">WireGuard</a>,
            or your own VPC. Because the relay&apos;s network-level protection
            is just TLS + keypair authentication, layering a VPN on top means{" "}
            <strong className="text-fg">only your devices</strong> can even
            reach the WebSocket port — defense in depth.
          </p>
          <p>
            Quick Docker outline (see the{" "}
            <a className="text-accent underline" href={`${RELAY_README_URL}#self-hosted-relay-recommended-for-privacy`} target="_blank" rel="noopener noreferrer">
              relay README
            </a>{" "}
            for the full setup, environment variables, and reverse-proxy
            guidance):
          </p>
          <CodeBlock
            code={`docker run -d \\
  --name remote-pi-relay \\
  -p 3000:3000 \\
  --restart unless-stopped \\
  ghcr.io/jacobaraujo7/remote-pi-relay:latest`}
            label="On your relay host"
            language="bash"
          />
          <p>
            Bind the container to your VPN interface, terminate TLS in a reverse
            proxy, and point both your Pi and your phone at the resulting{" "}
            <InlineCode>wss://…</InlineCode> URL.
          </p>
        </DocsSubsection>

        <DocsSubsection id="point-pi" title="Pointing Pi at your own relay">
          <p>Once your relay is reachable, tell the extension:</p>
          <CodeBlock
            code="/remote-pi relay url wss://relay.yourdomain.tld"
            label="In Pi"
            language="text"
          />
          <p>
            You can also paste an <InlineCode>https://</InlineCode> URL — many
            hosts (Coolify, Fly, Render, Vercel-style PaaS) only expose HTTPS
            endpoints in their dashboards, but WebSocket Secure (
            <InlineCode>wss://</InlineCode>) runs over the same TLS connection
            on the same port. The extension auto-rewrites{" "}
            <InlineCode>https://</InlineCode> → <InlineCode>wss://</InlineCode>{" "}
            and <InlineCode>http://</InlineCode> →{" "}
            <InlineCode>ws://</InlineCode> so you can use whatever URL your
            provider gives you.
          </p>
          <p>
            This writes <InlineCode>~/.pi/remote/config.json</InlineCode> with{" "}
            <InlineCode>{`{ "relay": "..." }`}</InlineCode>. Resolution order
            (highest precedence first):
          </p>
          <ol className="ml-6 list-decimal space-y-2">
            <li>
              <InlineCode>REMOTE_PI_RELAY</InlineCode> environment variable (CI
              / one-off overrides)
            </li>
            <li><InlineCode>~/.pi/remote/config.json</InlineCode></li>
            <li>
              The built-in default (
              <InlineCode>https://relay-rp1.jacobmoura.work</InlineCode>, used
              as <InlineCode>wss://…</InlineCode>)
            </li>
          </ol>
          <p>Verify the active URL and its source with:</p>
          <CodeBlock code="/remote-pi config" label="In Pi" language="text" />
          <p>
            If you change the URL while connected, run{" "}
            <InlineCode>/remote-pi relay stop</InlineCode> then{" "}
            <InlineCode>/remote-pi relay start</InlineCode> (or{" "}
            <InlineCode>/remote-pi relay</InlineCode> to toggle).
          </p>
          <p>
            The mobile app has its own relay-URL setting in its preferences
            pane — keep both pointing at the same relay.
          </p>
        </DocsSubsection>
      </DocsSection>

      <DocsSection id="agent-network" title="Agent network: deeper look">
        <p>
          Each session is one Unix-domain-socket broker plus N peers. The
          broker multiplexes messages by <InlineCode>to</InlineCode> name and
          broadcasts system events (<InlineCode>peer_joined</InlineCode>,{" "}
          <InlineCode>peer_left</InlineCode>).
        </p>
        <p>Inside the LLM, the agent skill registers two tools:</p>
        <CodeBlock
          label="Tools available to the LLM"
          language="jsonc"
          code={`// Fire-and-forget
agent_send({
  to: "backend",      // peer name (or array for multicast)
  body: { task: "add /healthz endpoint" },
  re: "<id>"          // optional — set when replying to a previous request
})

// Send + await reply (default 30s timeout)
agent_request({
  to: "backend",
  body: { question: "is the migration applied?" }
})`}
        />
        <p>
          The wire format is a 5-field envelope{" "}
          <InlineCode>{`{ from, to, id, re, body }`}</InlineCode> serialized as
          one JSON line per message. The leader&apos;s broker writes an{" "}
          <InlineCode>audit.jsonl</InlineCode> log at{" "}
          <InlineCode>~/.pi/remote/sessions/&lt;name&gt;/audit.jsonl</InlineCode>{" "}
          for postmortem inspection.
        </p>
        <p>Useful commands:</p>
        <DocsTable
          headers={["Command", "What it does"]}
          rows={[
            [
              <InlineCode key="cmd">/remote-pi join [name]</InlineCode>,
              <>Join (or create) a session — only needed manually if <InlineCode>auto_start_relay=false</InlineCode></>,
            ],
            [<InlineCode key="cmd">/remote-pi leave</InlineCode>, "Leave the current session"],
            [<InlineCode key="cmd">/remote-pi sessions</InlineCode>, "List local sessions and which are live"],
            [<InlineCode key="cmd">/remote-pi rename &lt;new&gt;</InlineCode>, "Rename this agent in the current session"],
          ]}
        />
        <p>
          Name collisions inside a session get a numeric suffix automatically
          (<InlineCode>backend</InlineCode>, <InlineCode>backend#2</InlineCode>,{" "}
          <InlineCode>backend#3</InlineCode>). The broker assigns it and
          returns the real name to the peer.
        </p>
      </DocsSection>

      <DocsSection id="daemon-mode" title="Daemon mode">
        <p>
          When you want a Pi to keep running in the background — responding to
          mobile prompts at 3am, processing cron jobs, monitoring a folder
          while you&apos;re not at the keyboard — promote it to a{" "}
          <strong className="text-fg">daemon</strong> managed by a single
          OS-level supervisor. systemd on Linux, launchd on macOS; one
          supervisor process per machine, N background Pis underneath.
        </p>

        <DocsSubsection id="daemon-prereq" title="One-time setup">
          <p>
            Install the package globally so <InlineCode>remote-pi</InlineCode>{" "}
            and <InlineCode>pi-supervisord</InlineCode> are on your PATH.{" "}
            <InlineCode>pi install npm:remote-pi</InlineCode> alone makes the
            Pi extension available but does <strong className="text-fg">not</strong>{" "}
            expose the CLI binaries — both installs are independent and can
            coexist.
          </p>
          <CodeBlock
            code={`# Put the CLI on your PATH.
npm install -g remote-pi

# Install the supervisor as a user-level system service.
# Linux: systemd --user, macOS: launchd LaunchAgent.
# Both auto-start at login and survive reboots.
remote-pi install`}
            label="One-time setup"
            language="bash"
          />
          <p>
            <InlineCode>remote-pi install</InlineCode>:
          </p>
          <ul className="ml-6 list-disc space-y-2">
            <li>
              Writes{" "}
              <InlineCode>~/.config/systemd/user/remote-pi-supervisord.service</InlineCode>{" "}
              (Linux) or{" "}
              <InlineCode>~/Library/LaunchAgents/dev.remotepi.supervisord.plist</InlineCode>{" "}
              (macOS).
            </li>
            <li>
              Activates via{" "}
              <InlineCode>systemctl --user enable --now</InlineCode> or{" "}
              <InlineCode>launchctl bootstrap</InlineCode>.
            </li>
            <li>
              The supervisor starts immediately and re-starts on every login.
            </li>
          </ul>
        </DocsSubsection>

        <DocsSubsection id="daemon-per-folder" title="Per-folder workflow">
          <p>For each agent you want to keep alive 24/7:</p>
          <CodeBlock
            code={`# 1. Configure the agent interactively first (one time).
cd ~/Movies
pi                                 # /remote-pi → setup wizard, /remote-pi pair, etc

# 2. Promote to a daemon. The id is derived from the cwd
#    (sha256(realpath)[:8]), stable across machines.
remote-pi create ~/Movies --name "Video Editor"
# → Daemon registered: id=4e39152d name="Video Editor" cwd=/Users/x/Movies

# 3. Start it (supervisor spawns 'pi --mode rpc' for this folder).
remote-pi daemon start`}
            label="Per-folder flow"
            language="bash"
          />
          <p>
            The agent receives prompts as if a user typed them; its response
            flows back through the relay/mesh you configured during interactive
            setup — the mobile app sees it live, other agents on the same
            machine see it via the local UDS mesh.
          </p>
        </DocsSubsection>

        <DocsSubsection id="daemon-fleet" title="Fleet operations">
          <p>Once daemons are registered:</p>
          <CodeBlock
            code={`remote-pi daemons                  # list daemons + state
remote-pi daemon status            # uptime, pid, restart count
remote-pi daemon send 4e39152d "Cut the first 30 seconds of latest clip"
remote-pi daemon stop              # stop all
remote-pi daemon restart           # restart all`}
            label="Fleet commands"
            language="bash"
          />
          <p>
            All commands also work as Pi slash commands (interactive){" "}
            <strong className="text-fg">and</strong> as shell-level{" "}
            <InlineCode>remote-pi &lt;subcommand&gt;</InlineCode> when installed
            globally.
          </p>
        </DocsSubsection>

        <DocsSubsection id="daemon-remove" title="Removing or uninstalling">
          <CodeBlock
            code={`remote-pi remove <id>              # unregister one daemon (config preserved)
remote-pi uninstall                # remove the supervisor service (registry kept)`}
            label="Cleanup"
            language="bash"
          />
          <p>
            <InlineCode>uninstall</InlineCode> is reversible — re-running{" "}
            <InlineCode>install</InlineCode> later brings every registered
            daemon back. To wipe the registry entirely:
          </p>
          <CodeBlock
            code="rm ~/.pi/remote/daemons.json"
            label="Nuke the registry"
            language="bash"
          />
        </DocsSubsection>

        <DocsSubsection id="daemon-logs" title="Where to find logs">
          <DocsTable
            headers={["Platform", "Command"]}
            rows={[
              [
                "Linux",
                <InlineCode key="l">
                  journalctl --user -u remote-pi-supervisord -f
                </InlineCode>,
              ],
              [
                "macOS",
                <InlineCode key="m">
                  tail -f ~/.pi/remote/supervisord.log
                </InlineCode>,
              ],
            ]}
          />
          <p>
            Each spawned daemon&apos;s stderr is forwarded into the
            supervisor&apos;s log with a <InlineCode>[&lt;cwd&gt;]</InlineCode>{" "}
            prefix, so a single stream shows every agent.
          </p>
        </DocsSubsection>

        <DocsSubsection id="daemon-caveats" title="Caveats">
          <ul className="ml-6 list-disc space-y-2">
            <li>
              <strong className="text-fg">Tool approval is not gated.</strong>{" "}
              Daemons inherit the same Pi config the interactive run uses —
              Bash, Edit, Write, etc. all execute without prompting. Configure
              Pi&apos;s tool permissions to taste{" "}
              <em>before</em> promoting a folder to daemon. A tool-approval
              gate ships in a follow-up plan.
            </li>
            <li>
              <strong className="text-fg">Pairing is still interactive.</strong>{" "}
              Daemons don&apos;t show a QR themselves; the keypair and paired
              devices come from the prior interactive <InlineCode>pi</InlineCode>{" "}
              session in the same folder.
            </li>
            <li>
              <strong className="text-fg">Single supervisor.</strong> If{" "}
              <InlineCode>pi-supervisord</InlineCode> crashes, every daemon
              goes down with it. systemd/launchd restarts it within seconds and
              the children come back automatically.
            </li>
            <li>
              <strong className="text-fg">One daemon per cwd.</strong> The
              by-path id derivation rejects a second daemon in the same folder
              at <InlineCode>create</InlineCode> time.
            </li>
          </ul>
        </DocsSubsection>
      </DocsSection>

      <DocsSection id="commands" title="Command reference">
        <p>
          Every command works as a Pi slash command (interactive) and as a
          shell-level <InlineCode>remote-pi &lt;subcommand&gt;</InlineCode>{" "}
          when the package is installed globally (
          <InlineCode>npm install -g remote-pi</InlineCode>).
        </p>

        <DocsSubsection
          id="commands-local"
          title="Local session — one Pi, one terminal"
        >
          <DocsTable
            headers={["Command", "Description"]}
            rows={[
              [
                <InlineCode key="c">/remote-pi</InlineCode>,
                "Connect (join local mesh + start relay), or run setup on first use",
              ],
              [
                <InlineCode key="c">/remote-pi setup</InlineCode>,
                "Run the setup wizard and update local config",
              ],
              [
                <InlineCode key="c">/remote-pi status</InlineCode>,
                "Show local mesh + relay status",
              ],
              [
                <InlineCode key="c">/remote-pi stop</InlineCode>,
                <>Stop everything for <em>this</em> terminal (mesh + relay)</>,
              ],
              [
                <InlineCode key="c">/remote-pi pair</InlineCode>,
                "Show QR + copy-paste pairing URI for a new mobile device",
              ],
              [
                <InlineCode key="c">/remote-pi devices</InlineCode>,
                "List paired mobile devices (online/offline per device)",
              ],
              [
                <InlineCode key="c">/remote-pi revoke &lt;shortid&gt;</InlineCode>,
                "Revoke a paired device by its shortid",
              ],
              [
                <InlineCode key="c">/remote-pi set-relay &lt;url&gt;</InlineCode>,
                "Persist a new relay URL (http:// or https://)",
              ],
            ]}
          />
        </DocsSubsection>

        <DocsSubsection
          id="commands-daemon"
          title="Daemon fleet — one supervisor, N background Pis"
        >
          <p className="text-sm">
            See <a href="#daemon-mode" className="text-accent underline">Daemon mode</a> for the full flow.
          </p>
          <DocsTable
            headers={["Command", "Description"]}
            rows={[
              [
                <InlineCode key="c">/remote-pi create &lt;cwd&gt; [--name X]</InlineCode>,
                "Register a folder as a daemon",
              ],
              [
                <InlineCode key="c">/remote-pi remove &lt;id&gt;</InlineCode>,
                "Unregister a daemon (local config preserved)",
              ],
              [
                <InlineCode key="c">/remote-pi daemons</InlineCode>,
                "List registered daemons + state",
              ],
              [
                <InlineCode key="c">/remote-pi daemon start</InlineCode>,
                "Start every registered daemon",
              ],
              [
                <InlineCode key="c">/remote-pi daemon stop</InlineCode>,
                <>
                  Stop every running daemon (<InlineCode>/remote-pi stop</InlineCode>{" "}
                  stops only the local terminal)
                </>,
              ],
              [
                <InlineCode key="c">/remote-pi daemon restart</InlineCode>,
                "Stop + start all daemons",
              ],
              [
                <InlineCode key="c">/remote-pi daemon status</InlineCode>,
                "Detailed runtime status (pid, uptime, restart count)",
              ],
              [
                <InlineCode key="c">/remote-pi daemon send &lt;id&gt; &quot;&lt;text&gt;&quot;</InlineCode>,
                "Send a prompt to a specific daemon",
              ],
              [
                <InlineCode key="c">/remote-pi install</InlineCode>,
                <>
                  Install <InlineCode>pi-supervisord</InlineCode> as a system service
                </>,
              ],
              [
                <InlineCode key="c">/remote-pi uninstall</InlineCode>,
                "Remove the system service (registry preserved)",
              ],
            ]}
          />
        </DocsSubsection>
        <p>The footer in the Pi TUI reflects state live:</p>
        <ul className="ml-6 list-disc space-y-2">
          <li>
            <InlineCode>📡 &lt;session&gt; (N)</InlineCode> — current agent
            session and peer count
          </li>
          <li>
            <InlineCode>🟢 relay</InlineCode> — relay connected, at least one
            device paired
          </li>
          <li>
            <InlineCode>🟡 relay waiting for pairing</InlineCode> — relay
            connected, no device paired yet
          </li>
          <li>
            <InlineCode>📱 &lt;shortid&gt;</InlineCode> — a mobile device is
            actively connected right now
          </li>
        </ul>
        <p>
          The window title becomes{" "}
          <InlineCode>&lt;agent-name&gt; · &lt;session&gt; · relay</InlineCode>{" "}
          so you can tell your terminals apart at a glance.
        </p>
      </DocsSection>

      <DocsSection id="config" title="Configuration files">
        <DocsTable
          headers={["Path", "Scope", "What's in it"]}
          rows={[
            [
              <InlineCode key="p">&lt;cwd&gt;/.pi/remote-pi/config.json</InlineCode>,
              "Per-directory",
              <>
                <InlineCode>agent_name</InlineCode>,{" "}
                <InlineCode>session_name</InlineCode>,{" "}
                <InlineCode>auto_start_relay</InlineCode>
              </>,
            ],
            [
              <InlineCode key="p">~/.pi/remote/config.json</InlineCode>,
              "Per-user",
              <><InlineCode>relay</InlineCode> URL</>,
            ],
            [
              <InlineCode key="p">~/.pi/remote/peers.json</InlineCode>,
              "Per-machine",
              "Paired mobile devices",
            ],
            [
              <InlineCode key="p">~/.pi/remote/daemons.json</InlineCode>,
              "Per-machine",
              <>Daemon registry (list of <InlineCode>{`{ cwd }`}</InlineCode> entries)</>,
            ],
            [
              <InlineCode key="p">~/.pi/remote/sessions/&lt;name&gt;/</InlineCode>,
              "Per-session",
              <>Broker socket + <InlineCode>audit.jsonl</InlineCode></>,
            ],
            [
              <InlineCode key="p">~/.pi/remote/skills/agent-network/SKILL.md</InlineCode>,
              "Per-user",
              "Agent skill the LLM reads",
            ],
          ]}
        />
        <p>Override the relay for a single run without persisting:</p>
        <CodeBlock
          code="REMOTE_PI_RELAY=wss://staging.example.tld pi"
          label="Shell"
          language="bash"
        />
      </DocsSection>

      <DocsSection id="troubleshooting" title="Troubleshooting">
        <DocsSubsection id="footer-stuck" title="Footer says 🟡 relay waiting for pairing even though I paired a device">
          <p>
            The icon reflects whether <em>any</em> device has been paired on
            this machine, not whether one is connected right now. If you really
            have a paired device in <InlineCode>/remote-pi devices</InlineCode>,
            restart Pi — the cache may be stale (fixed in current release;
            report a bug if it recurs).
          </p>
        </DocsSubsection>
        <DocsSubsection id="timeout-mobile" title="Mobile app times out connecting">
          <p>
            Verify the same relay URL is configured on both sides. If you
            self-host behind a VPN, your phone must also be on the VPN
            (Tailscale on iOS/Android works fine).
          </p>
        </DocsSubsection>
        <DocsSubsection id="timeout-request" title="agent_request keeps timing out">
          <p>
            Default timeout is 30 s. For tasks that legitimately take longer,
            the receiver should reply with <InlineCode>agent_send</InlineCode>{" "}
            including <InlineCode>re: &quot;&lt;original-id&gt;&quot;</InlineCode>{" "}
            so the requester can correlate. The skill explains this to the LLM
            automatically.
          </p>
        </DocsSubsection>
        <DocsSubsection id="multi-terminal" title="Multiple terminals in the same directory">
          <p>
            Supported. They share the same agent-network session (UDS broker)
            and the relay handles each Pi process independently. If the relay
            refuses with <InlineCode>RoomAlreadyOpenError</InlineCode>, stop the
            other terminal first.
          </p>
        </DocsSubsection>
      </DocsSection>

      <DocsSection id="links" title="Links">
        <ul className="ml-6 list-disc space-y-2">
          <li>
            Homepage:{" "}
            <Link href="/" className="text-accent underline">
              remote-pi.jacobmoura.work
            </Link>
          </li>
          <li>
            Source:{" "}
            <a className="text-accent underline" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              github.com/jacobaraujo7/remote_pi
            </a>
          </li>
          <li>
            Pi coding agent:{" "}
            <a className="text-accent underline" href={PI_URL} target="_blank" rel="noopener noreferrer">
              github.com/earendil-works/pi
            </a>
          </li>
          <li>
            Relay (self-hosting guide):{" "}
            <a className="text-accent underline" href={RELAY_README_URL} target="_blank" rel="noopener noreferrer">
              relay/README.md
            </a>
          </li>
          <li>
            Issues / bugs:{" "}
            <a className="text-accent underline" href={ISSUES_URL} target="_blank" rel="noopener noreferrer">
              github.com/jacobaraujo7/remote_pi/issues
            </a>
          </li>
        </ul>
        <p className="text-sm">License: MIT.</p>
      </DocsSection>
    </DocsShell>
  );
}

function DocsToc() {
  return (
    <nav aria-label="Table of contents" className="text-sm">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
        On this page
      </p>
      <ul className="flex flex-col gap-0.5">
        <TocItem href="#quick-start" label="Quick start">
          <TocItem href="#agent-network-30s" label="Agent network in 30s" sub />
        </TocItem>
        <TocItem href="#what-it-does" label="What it does">
          <TocItem href="#agent-network-layer" label="Agent network layer" sub />
          <TocItem href="#mobile-app-layer" label="Mobile app layer" sub />
        </TocItem>
        <TocItem href="#install" label="Install" />
        <TocItem href="#using-remote-pi" label={<>Using <InlineCode>/remote-pi</InlineCode></>} />
        <TocItem href="#pairing" label="Pairing a mobile device" />
        <TocItem href="#relay" label="The relay">
          <TocItem href="#community-relay" label="Community relay" sub />
          <TocItem href="#self-host" label="Self-host" sub />
          <TocItem href="#point-pi" label="Point Pi at your relay" sub />
        </TocItem>
        <TocItem href="#agent-network" label="Agent network deep dive" />
        <TocItem href="#daemon-mode" label="Daemon mode">
          <TocItem href="#daemon-prereq" label="One-time setup" sub />
          <TocItem href="#daemon-per-folder" label="Per-folder workflow" sub />
          <TocItem href="#daemon-fleet" label="Fleet operations" sub />
          <TocItem href="#daemon-remove" label="Remove / uninstall" sub />
          <TocItem href="#daemon-logs" label="Logs" sub />
          <TocItem href="#daemon-caveats" label="Caveats" sub />
        </TocItem>
        <TocItem href="#commands" label="Command reference">
          <TocItem href="#commands-local" label="Local session" sub />
          <TocItem href="#commands-daemon" label="Daemon fleet" sub />
        </TocItem>
        <TocItem href="#config" label="Configuration files" />
        <TocItem href="#troubleshooting" label="Troubleshooting">
          <TocItem href="#footer-stuck" label="Stuck on pairing" sub />
          <TocItem href="#timeout-mobile" label="Mobile times out" sub />
          <TocItem href="#timeout-request" label="agent_request timeout" sub />
          <TocItem href="#multi-terminal" label="Multiple terminals" sub />
        </TocItem>
        <TocItem href="#links" label="Links" />
      </ul>
    </nav>
  );
}

function TocItem({
  href,
  label,
  sub,
  children,
}: {
  href: string;
  label: React.ReactNode;
  sub?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <li>
      <a
        href={href}
        className={
          sub
            ? "block rounded py-1 pl-3 text-[13px] text-muted transition-colors hover:text-fg"
            : "block rounded py-1 font-medium text-fg transition-colors hover:text-accent"
        }
      >
        {label}
      </a>
      {children ? (
        <ul className="ml-2 border-l border-border-soft/70 pl-1">{children}</ul>
      ) : null}
    </li>
  );
}
