import type { Problem, Subject } from "./types";

const randInt = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
const toOct = (n: number) =>
  [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
const maskFromPrefix = (p: number) => (p === 0 ? 0 : (0xffffffff << (32 - p)) >>> 0);

type SubnetDifficulty = "easy" | "med" | "hard";

type SubnetScenario = {
  p: number;
  mask: number;
  net: number;
  bc: number;
  hostBits: number;
  size: number;
  ip: number;
  ipStr: string;
  usable: number;
  classification: "network" | "broadcast" | "host";
};

const DIFF_RANGE: Record<SubnetDifficulty, [number, number]> = {
  easy: [24, 30],
  med: [16, 30],
  hard: [8, 30],
};

function randomScenario(diff: SubnetDifficulty): SubnetScenario {
  const [pMin, pMax] = DIFF_RANGE[diff];
  const p = randInt(pMin, pMax);
  const pick = randInt(0, 2);
  let base: number;
  if (pick === 0) base = (10 << 24) | (randInt(0, 255) << 16) | (randInt(0, 255) << 8) | randInt(0, 255);
  else if (pick === 1)
    base = (172 << 24) | (randInt(16, 31) << 16) | (randInt(0, 255) << 8) | randInt(0, 255);
  else base = (192 << 24) | (168 << 16) | (randInt(0, 255) << 8) | randInt(0, 255);
  base = base >>> 0;

  const mask = maskFromPrefix(p);
  const net = (base & mask) >>> 0;
  const hostBits = 32 - p;
  const size = Math.pow(2, hostBits);
  const bc = (net + size - 1) >>> 0;
  const usable = size - 2;

  let ip: number;
  const r = Math.random();
  if (r < 0.15) ip = net;
  else if (r < 0.3) ip = bc;
  else ip = (net + randInt(0, Math.max(0, size - 1))) >>> 0;

  const classification = ip === net ? "network" : ip === bc ? "broadcast" : "host";

  return { p, mask, net, bc, hostBits, size, ip, ipStr: toOct(ip), usable, classification };
}

function subnetSteps(sc: SubnetScenario): string {
  const octIdx = Math.min(3, Math.floor(sc.p / 8));
  const maskOcts = toOct(sc.mask).split(".").map(Number);
  const intMaskVal = maskOcts[octIdx];
  const block = intMaskVal === 255 ? 1 : 256 - intMaskVal;
  const ipOcts = sc.ipStr.split(".").map(Number);
  const roundedDown = Math.floor(ipOcts[octIdx] / block) * block;

  const lines = [
    `Mask for /${sc.p} = ${toOct(sc.mask)}.`,
    `Interesting octet = octet ${octIdx + 1} (mask value ${intMaskVal}). Block size = 256 − ${intMaskVal} = ${block}.`,
    `Round ${ipOcts[octIdx]} down to a multiple of ${block} → ${roundedDown}. Network = ${toOct(sc.net)}.`,
    `Broadcast = next network − 1 = ${toOct(sc.bc)}. Usable hosts = 2^${sc.hostBits} − 2 = ${sc.usable}.`,
    `Given ${sc.ipStr} is the ${sc.classification === "host" ? "an interior (usable host)" : sc.classification} address.`,
  ];
  return lines.map((l) => `<div>${l}</div>`).join("");
}

function subnetPrompt(sc: SubnetScenario, ask: string): string {
  return `Given <b>${sc.ipStr} / ${sc.p}</b>, find the <b>${ask}</b>.`;
}

const subnetTopic = (
  id: string,
  name: string,
  diff: SubnetDifficulty,
  ask: string,
  build: (sc: SubnetScenario) => { ans: number | string; unit: Problem["unit"]; hint: string },
) => ({
  id,
  name,
  generate: (): Problem => {
    const sc = randomScenario(diff);
    const { ans, unit, hint } = build(sc);
    return {
      id,
      name,
      prompt: subnetPrompt(sc, ask),
      ans,
      unit,
      hint,
      sol: subnetSteps(sc),
    };
  },
});

const SUBNET_TOPICS = [
  subnetTopic("subnet_network_easy", "Subnetting: find network (/24–/30)", "easy", "network address", (sc) => ({
    ans: toOct(sc.net),
    unit: "text",
    hint: "Round the interesting octet down to a multiple of the block size.",
  })),
  subnetTopic("subnet_broadcast_easy", "Subnetting: find broadcast (/24–/30)", "easy", "broadcast address", (sc) => ({
    ans: toOct(sc.bc),
    unit: "text",
    hint: "Broadcast = next network address − 1.",
  })),
  subnetTopic("subnet_usable_easy", "Subnetting: count usable hosts (/24–/30)", "easy", "number of usable hosts", (sc) => ({
    ans: sc.usable,
    unit: "count",
    hint: "Usable = 2^(host bits) − 2.",
  })),
  subnetTopic("subnet_classify_easy", "Subnetting: classify the address (/24–/30)", "easy", "address type — answer exactly \"network\", \"broadcast\", or \"host\"", (sc) => ({
    ans: sc.classification,
    unit: "text",
    hint: "Compare the address to the network and broadcast values you'd compute for this block.",
  })),
  subnetTopic("subnet_network_med", "Subnetting: find network (/16–/30)", "med", "network address", (sc) => ({
    ans: toOct(sc.net),
    unit: "text",
    hint: "Round the interesting octet down to a multiple of the block size.",
  })),
  subnetTopic("subnet_broadcast_med", "Subnetting: find broadcast (/16–/30)", "med", "broadcast address", (sc) => ({
    ans: toOct(sc.bc),
    unit: "text",
    hint: "Broadcast = next network address − 1.",
  })),
  subnetTopic("subnet_usable_hard", "Subnetting: count usable hosts (/8–/30)", "hard", "number of usable hosts", (sc) => ({
    ans: sc.usable,
    unit: "count",
    hint: "Usable = 2^(host bits) − 2.",
  })),
  subnetTopic("subnet_classify_hard", "Subnetting: classify the address (/8–/30)", "hard", "address type — answer exactly \"network\", \"broadcast\", or \"host\"", (sc) => ({
    ans: sc.classification,
    unit: "text",
    hint: "Compare the address to the network and broadcast values for this block.",
  })),
];

const TERMS: { t: string; d: string; w: number }[] = [
  { t: "1G", d: "First-generation analog cellular — voice only.", w: 1 },
  { t: "2G (GSM / CDMA)", d: "Digital voice generation that introduced SMS. GSM and CDMA are the technologies; SMS is a service.", w: 1 },
  { t: "3G (UMTS / HSPA)", d: "Expanded wireless to mobile data / broadband beyond voice.", w: 1 },
  { t: "4G (LTE)", d: "All-IP mobile broadband.", w: 1 },
  { t: "5G NR", d: "Fifth-gen New Radio: eMBB, ultra-reliable low-latency (URLLC), massive IoT.", w: 1 },
  { t: "6G", d: "Research generation: AI-native, terahertz bands, >1 Tbps, integrated sensing.", w: 1 },
  { t: "Coverage planning", d: "Determines the geographic area a system can serve — where service is available.", w: 1 },
  { t: "Capacity planning", d: "Determines how many users can be served simultaneously — traffic load and congestion.", w: 1 },
  { t: "Frequency planning", d: "Channel assignment and frequency reuse to minimize interference.", w: 1 },
  { t: "Availability", d: "Services remain reachable whenever required; achieved with redundant links, failover, distributed elements.", w: 1 },
  { t: "Maintainability", d: "Ability to monitor, diagnose, and repair components efficiently — modular design, centralized management.", w: 1 },
  { t: "Reliability", d: "Continues operating through equipment failures and adverse weather (redundancy, fault tolerance).", w: 1 },
  { t: "Scalability", d: "Accommodates future growth without full system replacement.", w: 1 },
  { t: "Line of sight (LOS)", d: "Clear optical path between antennas; required for microwave links.", w: 2 },
  { t: "Fresnel zone", d: "Elliptical region around the LOS path; keep ≥60% of the first zone clear to avoid diffraction loss.", w: 2 },
  { t: "Effective earth radius", d: "Adjusted earth radius (k≈4/3) that lets the radio horizon extend beyond the visual horizon.", w: 2 },
  { t: "Radio horizon", d: "Distance to the radio horizon; uses the 4.12·√h form (h in metres).", w: 2 },
  { t: "FSPL", d: "Free-space path loss (dB) = 32.44 + 20log(d_km) + 20log(f_MHz).", w: 2 },
  { t: "RSL", d: "Received signal level, expressed in dBm — not dBi.", w: 2 },
  { t: "Fade margin", d: "RSL minus receiver threshold; the safety cushion against fading.", w: 2 },
  { t: "Diversity", d: "Space, frequency, or polarization redundancy used to combat multipath fading.", w: 2 },
  { t: "Adaptive modulation", d: "Changes modulation scheme dynamically to keep the link alive as conditions vary.", w: 2 },
  { t: "Atmospheric ducting", d: "Atmospheric layering that bends signals, causing over-reach or fading.", w: 2 },
  { t: "Front-to-back ratio", d: "Ratio of main-lobe to back-lobe gain; higher means less rearward interference.", w: 2 },
  { t: "IP", d: "Internet Protocol — packet addressing and forwarding across interconnected networks.", w: 3 },
  { t: "IPv4", d: "32-bit Internet Protocol written in dotted-decimal form.", w: 3 },
  { t: "IPv6", d: "128-bit Internet Protocol written mainly in hexadecimal.", w: 3 },
  { t: "CIDR", d: "Classless Inter-Domain Routing — variable-length prefixes for allocation and route aggregation.", w: 3 },
  { t: "VLSM", d: "Variable Length Subnet Masking — different prefix lengths within one plan to fit different host needs.", w: 3 },
  { t: "Subnet mask", d: "32-bit value whose leading 1 bits mark the network prefix.", w: 3 },
  { t: "Prefix length", d: "Number of leading network bits, written after a slash (e.g. /27).", w: 3 },
  { t: "Network address", d: "First address in a subnet, with all normal host bits set to 0.", w: 3 },
  { t: "Broadcast address", d: "All-ones host value at the end of a normal IPv4 subnet.", w: 3 },
  { t: "Usable host range", d: "Addresses normally assignable between the network and broadcast boundaries.", w: 3 },
  { t: "Octet", d: "A group of eight bits; IPv4 has four of them.", w: 3 },
  { t: "Host bit", d: "A bit to the right of the prefix boundary.", w: 3 },
  { t: "Route aggregation", d: "Representing multiple component prefixes with a valid shorter summary prefix (supernetting).", w: 3 },
  { t: "ARP", d: "Address Resolution Protocol — maps an IPv4 address to a local link (MAC) address.", w: 3 },
  { t: "DHCP", d: "Dynamic Host Configuration Protocol — automatically supplies clients with IP configuration.", w: 3 },
  { t: "DNS", d: "Domain Name System — maps names like example.com to IP addresses.", w: 3 },
  { t: "NAT", d: "Network Address Translation — lets private IPv4 hosts share public addressing.", w: 3 },
  { t: "ICMP", d: "Internet Control Message Protocol — carries IP control/error messages; ping uses ICMP echo.", w: 3 },
  { t: "TCP", d: "Transmission Control Protocol — reliable, ordered byte stream between applications.", w: 3 },
  { t: "UDP", d: "User Datagram Protocol — low-overhead datagrams with no built-in delivery guarantee.", w: 3 },
  { t: "RFC 1918", d: "Defines private IPv4 space: 10/8, 172.16.0.0/12, 192.168.0.0/16.", w: 3 },
  { t: "APIPA", d: "Link-local self-assignment (169.254.0.0/16) used when no DHCP is available.", w: 3 },
  { t: "Loopback", d: "Tests the local IP stack; 127.0.0.1 in the reserved 127.0.0.0/8 block.", w: 3 },
  { t: "LAN", d: "Local Area Network — a limited local area such as a room, building, or campus segment.", w: 4 },
  { t: "WAN", d: "Wide Area Network — connects networks over a broad geographic area.", w: 4 },
  { t: "VLAN", d: "Virtual LAN — a logical Layer-2 broadcast domain, commonly with its own IP subnet.", w: 4 },
  { t: "MAC", d: "Media Access Control — the local link address used by Ethernet and Wi-Fi interfaces.", w: 4 },
  { t: "Trunk (802.1Q)", d: "A port carrying multiple VLANs between switches, using 802.1Q tags.", w: 4 },
  { t: "Native VLAN", d: "The single VLAN left untagged on a trunk link.", w: 4 },
  { t: "Static routing", d: "Manually configured routes — precise and low-overhead, but doesn't adapt to failures.", w: 4 },
  { t: "Dynamic routing", d: "Routes learned via protocols (RIP/OSPF/EIGRP) — adapts automatically at higher overhead.", w: 4 },
  { t: "Administrative Distance", d: "Trust ranking that decides which route source to believe; lower is preferred.", w: 4 },
  { t: "Metric", d: "Value a single protocol uses to pick the best path (hop count, cost, bandwidth).", w: 4 },
  { t: "STP", d: "Spanning Tree Protocol — blocks switching loops while keeping a backup path ready.", w: 4 },
  { t: "FHRP (HSRP/VRRP)", d: "First-hop redundancy — routers share a virtual gateway IP so hosts survive a router failure.", w: 4 },
  { t: "AP", d: "Access Point — connects wireless clients to a wired or wireless network.", w: 4 },
  { t: "NIC", d: "Network Interface Controller — hardware or virtual interface connecting a device to a network.", w: 4 },
];

const slug = (s: string) =>
  "term_" + s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

const VOCAB_TOPICS = TERMS.map((term) => {
  const id = slug(term.t);
  return {
    id,
    name: term.t,
    mode: "reveal" as const,
    generate: (): Problem => ({
      id,
      name: term.t,
      prompt: `Define: <b>${term.t}</b> <span style="opacity:.6">(Week ${term.w})</span>`,
      ans: term.d,
      unit: "text",
      hint: "Try to say it out loud before revealing.",
      sol: term.d,
    }),
  };
});

const FORMULA_SHEET_HTML = `
<h4>Powers of two</h4>
<p>2 · 4 · 8 · 16 · 32 · 64 · 128 · 256 · 512 · 1024</p>
<h4>Mask octet values</h4>
<p>0 · 128 · 192 · 224 · 240 · 248 · 252 · 254 · 255</p>
<h4>Subnetting</h4>
<table>
  <tbody>
    <tr><td>Block size</td><td><code>256 − mask value</code> in the interesting octet</td></tr>
    <tr><td>Broadcast</td><td><code>next network − 1</code></td></tr>
    <tr><td>Usable hosts</td><td><code>2^(host bits) − 2</code></td></tr>
    <tr><td>Private space</td><td><code>10/8 · 172.16–172.31 (/12) · 192.168/16</code></td></tr>
    <tr><td>VLSM order</td><td>sort requirements descending → assign largest first → no overlap</td></tr>
  </tbody>
</table>
<h4>Microwave link budget</h4>
<table>
  <tbody>
    <tr><td>RSL (dBm)</td><td><code>(Tx + gains) − losses</code></td></tr>
    <tr><td>FSPL (dB)</td><td><code>32.44 + 20log(d_km) + 20log(f_MHz)</code></td></tr>
    <tr><td>Radio horizon</td><td><code>4.12·√h</code> (h in metres)</td></tr>
    <tr><td>Power</td><td><code>1 W = 30 dBm</code></td></tr>
  </tbody>
</table>
`.trim();

export const eceTe2: Subject = {
  id: "ece-te2",
  title: "ECE TE2 · Advanced Communications Systems and Design",
  description: "Term flashcards (Weeks 1–4) plus a subnetting math drill.",
  topics: [...SUBNET_TOPICS, ...VOCAB_TOPICS],
  terms: TERMS.map((t) => ({ id: slug(t.t), term: t.t, def: t.d, week: t.w })),
  formulaSheetHtml: FORMULA_SHEET_HTML,
};
