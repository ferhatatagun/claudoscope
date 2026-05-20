import type { RequestState, UsageStats } from "./types";
import { uid } from "./storage";

/**
 * A deliberately long support document. Prompt caching only engages above a
 * minimum prompt size (~1024 tokens for Sonnet/Opus), so this is sized well
 * past that — otherwise the "caching demo" would never actually cache.
 */
const KNOWLEDGE_BASE = `# Aurora Robotics — Internal Support Knowledge Base (v4)

## Company
Aurora Robotics builds autonomous warehouse robots. Founded in 2019, with its
headquarters in Rotterdam and engineering hubs in Istanbul and Lisbon. Three
product lines are currently in market, serving roughly 240 customer sites
across logistics, grocery, and light manufacturing. Support operates in English,
Dutch, Turkish, and Portuguese, 24 hours a day.

## Products

### PICK-1 — mobile picking arm
A six-axis picking arm on a mobile base. Payload 6 kg, reach 1.1 m, repeatability
0.2 mm, battery life roughly 9 hours of mixed-duty use. Firmware channel: stable.
Known issue: the gripper needs a recalibration cycle every 400 picks; the robot
will pause and prompt for this automatically. Recalibration takes about 40
seconds and does not require an engineer.

### HAUL-2 — autonomous pallet mover
A low-profile pallet mover. Payload 1,200 kg, top speed 1.8 m/s, turning radius
0 (it rotates in place). Battery life roughly 11 hours. Firmware channel: stable.
Known issue: the LIDAR housing can fog in cold-storage zones below 2°C, which
makes the unit slow down or stop. The fix is a heated LIDAR collar, shipped free
to any cold-storage site on request.

### SORT-3 — conveyor sortation unit
A modular conveyor sortation unit. Throughput 2,400 parcels per hour per lane,
up to six lanes. Firmware channel: beta. Known issue: barcode misreads on
highly reflective poly mailers; enabling "polarized scan mode" in the lane
settings resolves it in almost all cases.

## Warranty
Every unit ships with a 24-month limited warranty. Battery packs carry a
separate 12-month warranty because they are a wear item. The warranty is void
if firmware is sideloaded outside the official over-the-air (OTA) channel, or
if the chassis is opened by anyone who is not an Aurora-certified technician.
The extended plan, AuroraCare+, adds another 24 months of coverage and a
guaranteed 4-hour on-site response window.

## Support tiers
- Tier 1: customer portal and email. Response within 1 business day. Handles
  how-to questions, configuration help, and shipping of self-service parts.
- Tier 2: phone support plus remote diagnostics over the fleet gateway.
  Response within 4 hours. Handles connectivity faults, calibration problems,
  and anything Tier 1 cannot resolve in two exchanges.
- Tier 3 (AuroraCare+ only): an on-site engineer within 4 hours, available
  24/7. Reserved for safety incidents, hardware failures, and line-down events.

## Common resolutions

### "Robot will not dock"
Check the charging contacts on both the robot and the dock for dust or debris,
then re-run the docking calibration from Settings > Maintenance > Dock. If it
fails twice in a row, escalate to Tier 2 — a misaligned dock plate usually needs
remote diagnostics to confirm.

### "Emergency stop keeps tripping"
Inspect the bumper skirt for debris or a bent skirt rail. A bent rail is by far
the most common root cause; it presses the contact switch even when nothing is
in the robot's path. Replacement rails ship same-day and clip on without tools.

### "Fleet manager shows unit offline"
First confirm the site gateway is running firmware 3.4 or newer — older gateway
firmware drops units off the mesh intermittently. Then power-cycle the gateway:
unplug it, wait ten seconds, plug it back in. Do not reset the robot itself.
Units rejoin the mesh automatically within about 90 seconds.

### "Battery drains faster than expected"
Battery capacity is a wear item and drops gradually. If a pack holds less than
70% of rated runtime, it qualifies for warranty replacement within the first
12 months. Check the pack health figure in Settings > Power before escalating.

### "Robot moves slowly or hesitates"
On HAUL-2 units in cold storage, this is almost always LIDAR fogging — request
the heated LIDAR collar. On other units, check for a dirty floor marker or a
worn navigation tag along the affected route.

## Escalation policy
Any safety incident — meaning any physical contact between a robot and a person,
however minor — is always Tier 3 and must be logged within 1 hour, no exceptions.
Fire, smoke, or a visibly swollen battery triggers an immediate field recall of
the affected serial range and a notification to the regional safety lead.

## Tone and writing style
Be concise, calm, and specific. Always cite the exact menu path when there is
one. Never invent a serial number, a firmware version, or a part number. If the
answer is not in this document, say so plainly and route the customer to a
human engineer rather than guessing.`;

export interface Preset {
  id: string;
  name: string;
  hint: string;
  build: () => RequestState;
}

export const PRESETS: Preset[] = [
  {
    id: "hello",
    name: "Quick hello",
    hint: "Minimal request — a single short message.",
    build: () => ({
      model: "claude-sonnet-4-5-20250929",
      system: "You are a concise, friendly assistant.",
      cacheSystem: false,
      messages: [
        { id: uid(), role: "user", content: "Explain prompt caching like I'm five, in 2 sentences." },
      ],
      maxTokens: 256,
      temperature: 1,
    }),
  },
  {
    id: "cache",
    name: "Caching demo",
    hint: "Long cached system prompt. Run it twice — watch the cache write turn into a cache read.",
    build: () => ({
      model: "claude-sonnet-4-5-20250929",
      system: KNOWLEDGE_BASE,
      cacheSystem: true,
      messages: [
        {
          id: uid(),
          role: "user",
          content:
            "A customer says their HAUL-2 keeps showing 'unit offline' in the fleet manager. Walk them through the fix.",
        },
      ],
      maxTokens: 512,
      temperature: 1,
    }),
  },
];

export const DEFAULT_REQUEST: RequestState = PRESETS[1].build();

/**
 * Canned data for the "preview with sample" button — so a visitor without an
 * API key still sees the X-Ray fully alive. Clearly labelled as sample in the
 * UI; these numbers are illustrative, not from a live call.
 */
export interface SampleData {
  output: string;
  usage: UsageStats;
  prevUsage: UsageStats;
  prevModel: string;
  latencyMs: number;
  ttfbMs: number;
  stopReason: string;
}

export const SAMPLE: SampleData = {
  output: `Here's the fix for a HAUL-2 showing as "unit offline" in the fleet manager — in almost every case it's the site gateway, not the robot itself.

1. Check the gateway firmware. In the fleet manager, confirm the site gateway is on firmware 3.4 or newer. Anything older drops units off the mesh intermittently.

2. Power-cycle the gateway. Unplug it, wait ten seconds, and plug it back in. Don't reset the HAUL-2 itself — that won't help here and just adds downtime.

3. Wait about 90 seconds. Units rejoin the mesh automatically, so the HAUL-2 should flip back to online on its own with no action needed on the robot.

If it's still offline after that, escalate to Tier 2 for remote diagnostics. But in the large majority of cases, the gateway power-cycle clears it.`,
  usage: {
    input_tokens: 38,
    output_tokens: 174,
    cache_read_input_tokens: 2148,
    cache_creation_input_tokens: 0,
  },
  prevUsage: {
    input_tokens: 38,
    output_tokens: 169,
    cache_read_input_tokens: 0,
    cache_creation_input_tokens: 2148,
  },
  prevModel: "claude-sonnet-4-5-20250929",
  latencyMs: 2980,
  ttfbMs: 446,
  stopReason: "end_turn",
};
