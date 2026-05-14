# Chapter 1 — OSI & TCP/IP Models

> Every networking problem you'll ever debug maps to a specific layer — knowing the model tells you exactly where to look.

## Overview

The OSI (Open Systems Interconnection) model and the TCP/IP model are conceptual frameworks that describe how data travels from one computer to another across a network. Understanding them isn't academic busywork — they are the mental map every engineer uses to isolate faults, read documentation, and understand where tools like `ping`, `tcpdump`, and `curl` operate.

---

## Section 1 — The 7-Layer OSI Model

The OSI model was standardised by ISO in 1984 and divides network communication into seven distinct layers. Each layer has a specific job and communicates only with the layers directly above and below it.

```
┌─────────────────────────────────┐
│  7 — Application                │  HTTP, DNS, SMTP, FTP
├─────────────────────────────────┤
│  6 — Presentation               │  TLS/SSL, encoding, compression
├─────────────────────────────────┤
│  5 — Session                    │  session establishment, NetBIOS
├─────────────────────────────────┤
│  4 — Transport                  │  TCP, UDP — end-to-end delivery
├─────────────────────────────────┤
│  3 — Network                    │  IP, ICMP, routing
├─────────────────────────────────┤
│  2 — Data Link                  │  Ethernet, Wi-Fi, MAC addresses
├─────────────────────────────────┤
│  1 — Physical                   │  cables, radio waves, voltage
└─────────────────────────────────┘
```

### Layer-by-layer breakdown

| Layer | Name | PDU Name | Key Protocols | What it does |
|-------|------|----------|---------------|--------------|
| 7 | Application | Data | HTTP, DNS, SMTP | User-facing services — the data you actually care about |
| 6 | Presentation | Data | TLS, JPEG, ASCII | Translation, encryption, compression |
| 5 | Session | Data | NetBIOS, RPC | Establishes, maintains, and tears down sessions |
| 4 | Transport | Segment (TCP) / Datagram (UDP) | TCP, UDP | End-to-end delivery, ports, reliability |
| 3 | Network | Packet | IP, ICMP, OSPF | Logical addressing (IP), routing between networks |
| 2 | Data Link | Frame | Ethernet, 802.11 | Physical addressing (MAC), same-network delivery |
| 1 | Physical | Bit | — | Raw transmission of bits: copper, fibre, radio |

**PDU** = Protocol Data Unit. Each layer wraps the data from the layer above in its own header (and sometimes trailer), giving the unit a specific name at each layer.

---

## Section 2 — The 4-Layer TCP/IP Model

The TCP/IP model (also called the Internet model) is what the internet actually runs on. It collapses OSI's 7 layers into 4:

```
┌─────────────────────────────────┐
│  4 — Application                │  OSI 5+6+7  (HTTP, DNS, TLS)
├─────────────────────────────────┤
│  3 — Transport                  │  OSI 4      (TCP, UDP)
├─────────────────────────────────┤
│  2 — Internet                   │  OSI 3      (IP, ICMP)
├─────────────────────────────────┤
│  1 — Network Access             │  OSI 1+2    (Ethernet, Wi-Fi)
└─────────────────────────────────┘
```

In practice, engineers use a hybrid mental model — OSI layers 1–4 for troubleshooting, TCP/IP for describing how protocols actually stack.

---

## Section 3 — Encapsulation & Decapsulation

When you send an HTTP request, data travels **down** the stack on the sender and **up** the stack on the receiver. Each layer adds its own header as data moves down (encapsulation) and strips it off as data moves up (decapsulation).

```
Sender                              Receiver
──────                              ────────
[HTTP data]              L7         [HTTP data]
[TCP header | HTTP data] L4    →    [TCP header | HTTP data]
[IP header | TCP | data] L3         [IP header | TCP | data]
[Eth header | IP | TCP | data | FCS] L2  →  stripped at each layer
[bits on wire]           L1
```

Real example — what happens when you type `curl https://example.com`:

1. **L7** — curl constructs an HTTP GET request
2. **L6** — TLS encrypts the payload
3. **L4** — TCP wraps it in a segment with source/dest port
4. **L3** — IP wraps the segment in a packet with source/dest IP
5. **L2** — Ethernet wraps the packet in a frame with source/dest MAC
6. **L1** — Frame converted to electrical signals (or radio waves) on the wire

The receiving server does the reverse: strips the Ethernet frame, reads the IP packet, reads the TCP segment, decrypts TLS, hands HTTP data to the web server process.

---

## Section 4 — Why This Matters for Troubleshooting

The OSI model gives you a **systematic place to start** when something is broken. Work bottom-up:

| Layer | Question to ask | Tool |
|-------|----------------|------|
| 1 | Is the cable plugged in? Link light on? | `ip link`, check switch port |
| 2 | Am I getting ARP replies? Correct VLAN? | `arp -n`, `ip neigh` |
| 3 | Can I ping the gateway? Is the route correct? | `ping`, `ip route` |
| 4 | Is the port open? Is TCP connecting? | `nc`, `ss -tulnp` |
| 7 | Is the application returning the right response? | `curl -v`, browser DevTools |

A server that won't load in a browser could be broken at layer 1 (unplugged), layer 3 (wrong IP route), layer 4 (firewall blocking port 443), or layer 7 (app crash). The model prevents you from guessing randomly.

---

## Key Concepts Summary

- OSI has 7 layers; TCP/IP has 4 — TCP/IP is what the internet actually uses
- Each layer has a PDU name: **bit → frame → packet → segment → data**
- Encapsulation = adding headers going down the stack; decapsulation = stripping them going up
- The model is a **troubleshooting tool** — always ask "which layer is broken?"
- Layers 1–4 are infrastructure; layers 5–7 are application concerns

---

## Common Pitfalls

1. **Confusing OSI layer numbers with TCP/IP layer numbers** — "Layer 4" means Transport in OSI, but Internet in TCP/IP. Context matters; most engineers mean OSI when they say "layer N".
2. **Thinking presentation/session layers are irrelevant** — TLS lives at L6, which is why a TLS error is distinct from an HTTP error.
3. **Skipping layers when debugging** — always work bottom-up. Don't troubleshoot DNS before confirming you can ping the DNS server's IP.
4. **Assuming the model is prescriptive** — it's descriptive. Real protocols don't always fit neatly (QUIC operates at L4 but handles L7 concerns).

---

## Lab / Try It Now

```bash
# See all interfaces and their link state (Layer 1/2)
ip link show

# Check your IP address and subnet (Layer 3)
ip addr show

# Ping the gateway — confirms L1 through L3
ip route show default   # find gateway IP first
ping -c 4 <gateway-ip>

# Watch encapsulation in action — capture a DNS query
sudo tcpdump -i any -n port 53 &
dig example.com
```

---

## Further Reading

- RFC 1122 — *Requirements for Internet Hosts* (defines the TCP/IP model formally)
- Tanenbaum, *Computer Networks* 5th ed., Chapter 1 — thorough OSI treatment
- Cloudflare Learning: "What is the OSI Model?" — concise visual reference
