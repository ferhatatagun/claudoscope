import type { RequestState } from "./types";
import { uid } from "./storage";

/** A long-enough document to cross the cache minimum (~1024 tokens) so a
 *  cache write, then a cache read, is actually observable on a second run. */
const KNOWLEDGE_BASE = `# Aurora Robotics — Internal Support Knowledge Base (v4)

## Company
Aurora Robotics builds autonomous warehouse robots. Founded 2019, HQ in Rotterdam,
with engineering hubs in Istanbul and Lisbon. Three product lines are in market.

## Products
1. PICK-1 — a mobile picking arm. Payload 6 kg, reach 1.1 m, battery 9 hours.
   Firmware channel: stable. Known issue: gripper recalibration needed every 400 cycles.
2. HAUL-2 — an autonomous pallet mover. Payload 1,200 kg, top speed 1.8 m/s.
   Firmware channel: stable. Known issue: LIDAR fogging in cold-storage zones below 2°C.
3. SORT-3 — a conveyor sortation unit. Throughput 2,400 parcels/hour.
   Firmware channel: beta. Known issue: barcode misreads on reflective poly mailers.

## Warranty
All units ship with a 24-month limited warranty. Battery packs carry a separate
12-month warranty. Warranty is void if firmware is sideloaded outside the OTA channel.
Extended warranty (AuroraCare+) adds 24 months and 4-hour on-site response.

## Support tiers
- Tier 1: portal + email, response within 1 business day.
- Tier 2: phone + remote diagnostics, response within 4 hours.
- Tier 3 (AuroraCare+): on-site engineer within 4 hours, 24/7.

## Common resolutions
- "Robot will not dock": check charging contacts, then re-run the docking calibration
  from Settings > Maintenance > Dock. Escalate to Tier 2 if it fails twice.
- "Estop keeps tripping": inspect the bumper skirt for debris; a bent skirt rail is
  the most frequent root cause. Replacement rails ship same-day.
- "Fleet manager shows unit offline": confirm the site gateway has firmware >= 3.4,
  then power-cycle the gateway. Units rejoin the mesh automatically within 90 seconds.

## Escalation policy
Safety incidents (any contact with a person) are always Tier 3 and must be logged
within 1 hour. Fire, smoke, or battery swelling triggers an immediate field recall
of the affected serial range.

## Tone
Be concise, calm, and specific. Always cite the exact menu path. Never invent a
serial number or a firmware version. If the answer is not in this document, say so
and route the customer to a human engineer.`;

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
