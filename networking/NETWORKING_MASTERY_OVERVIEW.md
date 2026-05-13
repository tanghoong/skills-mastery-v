# Networking Mastery — Complete Overview

A practical, ground-up curriculum covering how the internet actually works — from physical signals to application-layer protocols — with real-world tools, hands-on calculations, and a capstone home-lab/sysadmin project.

> **Target audience:** Developers and sysadmins who want to stop treating networking as a black box. No prior networking background required; comfort with a terminal is assumed.

---

## Full 30-Chapter Curriculum

### Phase 1 — Foundations & the OSI Model (Ch. 1–5)

| Chapter | File | Topics |
|---------|------|--------|
| 1 | [chapter_01_osi_tcpip_models.md](chapter_01_osi_tcpip_models.md) | 7 OSI layers vs 4-layer TCP/IP stack, PDU names per layer (frame, packet, segment, datagram), encapsulation/decapsulation, why the model matters for troubleshooting |
| 2 | [chapter_02_binary_hex_math.md](chapter_02_binary_hex_math.md) | Decimal ↔ binary ↔ hex conversion by hand, bitwise AND/OR/XOR/NOT, bit masking, why subnetting is just binary arithmetic |
| 3 | [chapter_03_physical_layer.md](chapter_03_physical_layer.md) | Copper vs fibre vs wireless media, bandwidth vs throughput vs latency, attenuation, signal-to-noise ratio, RJ-45 pinouts (T568A/B), SFP modules |
| 4 | [chapter_04_data_link_layer.md](chapter_04_data_link_layer.md) | MAC addresses, Ethernet frames (preamble, FCS), ARP request/reply flow, VLAN tagging (802.1Q), Spanning Tree Protocol (STP) overview |
| 5 | [chapter_05_switches_layer2.md](chapter_05_switches_layer2.md) | CAM table mechanics, flooding vs forwarding vs filtering, port mirroring, managed vs unmanaged switches, trunk vs access ports |

### Phase 2 — IP Addressing & Subnetting (Ch. 6–10)

| Chapter | File | Topics |
|---------|------|--------|
| 6 | [chapter_06_ipv4_addressing.md](chapter_06_ipv4_addressing.md) | Class A/B/C, public vs private ranges (RFC 1918), loopback `127.0.0.1`, APIPA `169.254.x.x`, broadcast addresses |
| 7 | [chapter_07_subnetting.md](chapter_07_subnetting.md) | CIDR notation, calculating network address, broadcast, host range, usable hosts (`2^n − 2`), borrowing bits, VLSM (Variable Length Subnet Masking) |
| 8 | [chapter_08_subnetting_tools.md](chapter_08_subnetting_tools.md) | 20 practice problems end-to-end, `ipcalc`, `sipcalc`, Python `ipaddress` module, reading `ip addr` / `ifconfig` output |
| 9 | [chapter_09_ipv6_addressing.md](chapter_09_ipv6_addressing.md) | 128-bit hex notation, shortening rules (`::`), global unicast, link-local `fe80::`, loopback `::1`, multicast vs broadcast, SLAAC vs DHCPv6, dual-stack |
| 10 | [chapter_10_nat_pat.md](chapter_10_nat_pat.md) | Why NAT exists, static vs dynamic NAT, Port Address Translation (PAT/NAPT), NAT traversal problems (VoIP, P2P), STUN/TURN/ICE basics |

### Phase 3 — Routing & Layer-3 (Ch. 11–14)

| Chapter | File | Topics |
|---------|------|--------|
| 11 | [chapter_11_routing_fundamentals.md](chapter_11_routing_fundamentals.md) | Routing tables, longest prefix match, administrative distance, static routes, default routes (`0.0.0.0/0`), reading `ip route` / `netstat -r` |
| 12 | [chapter_12_dynamic_routing.md](chapter_12_dynamic_routing.md) | Distance-vector (RIP) vs link-state (OSPF) vs path-vector (BGP), AS numbers, convergence, split horizon, route summarisation |
| 13 | [chapter_13_bgp_internet.md](chapter_13_bgp_internet.md) | How ISPs peer, iBGP vs eBGP, BGP attributes (AS-PATH, MED, LOCAL_PREF), anycast routing, BGP hijacking, looking-glass servers |
| 14 | [chapter_14_icmp_ping_traceroute.md](chapter_14_icmp_ping_traceroute.md) | ICMP message types (echo, unreachable, TTL exceeded), how `ping` works, `traceroute`/`tracert` mechanics, MTU discovery, path MTU issues |

### Phase 4 — Transport Layer & Protocols (Ch. 15–17)

| Chapter | File | Topics |
|---------|------|--------|
| 15 | [chapter_15_tcp.md](chapter_15_tcp.md) | 3-way handshake, sequence/ack numbers, sliding window, congestion control (slow start, AIMD), connection teardown, TIME_WAIT, TCP flags (SYN, ACK, FIN, RST) |
| 16 | [chapter_16_udp_quic.md](chapter_16_udp_quic.md) | Connectionless delivery, when UDP wins (DNS, DHCP, video streaming, gaming), QUIC (HTTP/3) overview, SCTP mention |
| 17 | [chapter_17_ports_sockets_firewalls.md](chapter_17_ports_sockets_firewalls.md) | Well-known ports 0–1023, registered 1024–49151, ephemeral range, socket = IP + port + protocol, `netstat -tulnp`, `ss -tulnp`, `lsof -i`, iptables/nftables basics |

### Phase 5 — DNS Deep Dive (Ch. 18–20)

| Chapter | File | Topics |
|---------|------|--------|
| 18 | [chapter_18_dns_how_it_works.md](chapter_18_dns_how_it_works.md) | Recursive vs authoritative resolvers, root servers, TLD servers, iterative vs recursive queries, caching & TTL, negative caching (NXDOMAIN), `dig`, `nslookup`, `host` |
| 19 | [chapter_19_dns_record_types.md](chapter_19_dns_record_types.md) | A, AAAA, CNAME, MX (priority), NS, SOA (serial, refresh, retry, expire), TXT (SPF, DKIM, DMARC), PTR (reverse DNS), SRV, CAA; writing zone files by hand |
| 20 | [chapter_20_dns_security_advanced.md](chapter_20_dns_security_advanced.md) | DNSSEC (chain of trust, DS/DNSKEY/RRSIG records), DNS-over-HTTPS (DoH), DNS-over-TLS (DoT), split-horizon DNS, DNS rebinding attacks, wildcard records, CNAME flattening (ALIAS/ANAME) |

### Phase 6 — Domain & Web Infrastructure (Ch. 21–22)

| Chapter | File | Topics |
|---------|------|--------|
| 21 | [chapter_21_domains_registrars.md](chapter_21_domains_registrars.md) | TLDs vs ccTLDs vs new gTLDs, registrar vs registry vs IANA, WHOIS/RDAP lookups, domain transfer (EPP auth code), nameserver delegation, glue records, domain hijacking prevention (registrar lock) |
| 22 | [chapter_22_cdn_loadbalancer_proxy.md](chapter_22_cdn_loadbalancer_proxy.md) | How a CDN routes requests (anycast + PoP), origin vs edge, cache invalidation, Cloudflare/Fastly architecture, L4 vs L7 load balancing, health checks, Nginx/HAProxy as reverse proxy |

### Phase 7 — WiFi & Wireless Networking (Ch. 23–25)

| Chapter | File | Topics |
|---------|------|--------|
| 23 | [chapter_23_wifi_fundamentals.md](chapter_23_wifi_fundamentals.md) | 802.11 standards (a/b/g/n/ac/ax/be), 2.4 GHz vs 5 GHz vs 6 GHz bands, channels & channel width (20/40/80/160 MHz), SSID, BSSID, beacon frames, association flow |
| 24 | [chapter_24_wifi_channels_planning.md](chapter_24_wifi_channels_planning.md) | Non-overlapping channels (2.4 GHz: 1/6/11; 5 GHz: UNII bands), co-channel vs adjacent-channel interference, RSSI, SNR, dBm explained, site survey tools (`iwconfig`, `iw`, `wavemon`, NetSpot, WiFi Analyzer), channel planning a multi-AP network |
| 25 | [chapter_25_wifi_security.md](chapter_25_wifi_security.md) | WEP (broken, why), WPA2-Personal (PBKDF2 + CCMP), WPA2-Enterprise (802.1X + RADIUS + EAP variants), WPA3 (SAE, OWE), PMKID attacks, deauth frames, rogue AP detection, 802.11r fast roaming |

### Phase 8 — Application-Layer Protocols (Ch. 26–27)

| Chapter | File | Topics |
|---------|------|--------|
| 26 | [chapter_26_http.md](chapter_26_http.md) | Request/response structure, headers, status codes, persistent connections, multiplexing (HTTP/2), HOL blocking, QUIC/UDP (HTTP/3), `curl -v`, `httpie`, browser DevTools network tab |
| 27 | [chapter_27_tls_https.md](chapter_27_tls_https.md) | Symmetric vs asymmetric crypto, TLS 1.2 vs TLS 1.3 handshake, certificates (X.509, SAN, wildcard), CA chain of trust, Let's Encrypt / ACME, HSTS, certificate transparency, `openssl s_client`, `sslyze` |

### Phase 9 — Network Services & Operations (Ch. 28–29)

| Chapter | File | Topics |
|---------|------|--------|
| 28 | [chapter_28_dhcp_ntp_services.md](chapter_28_dhcp_ntp_services.md) | DORA flow (Discover/Offer/Request/Ack), DHCP relay agents, static leases, NTP stratum levels, `timedatectl`, PTP (IEEE 1588), SNMP basics, syslog |
| 29 | [chapter_29_troubleshooting_toolkit.md](chapter_29_troubleshooting_toolkit.md) | Methodology (OSI bottom-up), `ping`, `traceroute`, `mtr`, `dig`, `ss`, `tcpdump`, Wireshark (filters, follow TCP stream, dissectors), `nmap` basics, bandwidth testing with `iperf3`, packet loss vs latency vs jitter |

### Phase 10 — Capstone Project (Ch. 30)

| Chapter | File | Topics |
|---------|------|--------|
| 30 | [chapter_30_capstone_homelab.md](chapter_30_capstone_homelab.md) | Build a fully documented home network: subnet your LAN into VLANs (IoT / trusted / DMZ), configure a Pi-hole DNS resolver with DNSSEC, deploy a WireGuard VPN, set up Nginx reverse proxy + Let's Encrypt, write a network diagram (draw.io), produce a runbook with every `ip`/`dig`/`tcpdump` command used |

---

## Calculation Reference

| Topic | Formula |
|-------|---------|
| Usable hosts per subnet | `2^(32 − prefix) − 2` |
| Network address | Host IP `AND` subnet mask (bitwise) |
| Broadcast address | Network address `OR` inverted mask (bitwise) |
| Number of subnets from borrowed bits | `2^n` |
| dBm to milliwatts | `mW = 10^(dBm / 10)` |
| milliwatts to dBm | `dBm = 10 × log₁₀(mW)` |
| Free-space path loss (dB) | `FSPL = 20·log₁₀(d) + 20·log₁₀(f) + 92.4` — d in km, f in GHz |
| Link budget | `Tx power (dBm) − cable loss + antenna gain − FSPL ≥ receiver sensitivity` |
| WiFi theoretical throughput | `MCS index rate × spatial streams × channel width factor` |
| RTT from ping | `RTT = 2 × one-way latency` |

---

## Core Toolbox

| Tool | Layer / Use |
|------|------------|
| `ping` / `mtr` | ICMP reachability, latency, hop-by-hop packet loss |
| `traceroute` / `tracert` | Path discovery via TTL exceeded messages |
| `dig` / `nslookup` / `host` | DNS queries, record inspection, resolver tracing |
| `ip addr` / `ip route` | Linux interface and routing table management |
| `ss` / `netstat` | Socket state, listening ports |
| `lsof -i` | Per-process open network connections |
| `tcpdump` | Live packet capture with BPF filter syntax |
| Wireshark | GUI capture + deep protocol dissection |
| `nmap` | Port scan, OS detection, NSE script engine |
| `iperf3` | TCP/UDP throughput and bandwidth measurement |
| `openssl s_client` | TLS handshake inspection, certificate chain |
| `sslyze` | TLS configuration audit |
| `ipcalc` / `sipcalc` | Subnet arithmetic — network, broadcast, host range |
| Python `ipaddress` | Scriptable subnet calculations |
| `wavemon` / NetSpot / WiFi Analyzer | WiFi signal strength and channel survey |
| `curl -v` / `httpie` | HTTP/S request debugging with headers |
| Pi-hole + Unbound | Local DNS resolver with DNSSEC validation |
| WireGuard | Modern VPN (Layer 3 tunnel, minimal config) |
| draw.io | Network diagram documentation |

---

## Phase Summary

| Phase | Chapters | Focus |
|-------|----------|-------|
| 1 — Foundations | 1–5 | OSI model, binary math, Ethernet, switching |
| 2 — IP & Subnetting | 6–10 | IPv4/IPv6 addressing, CIDR, NAT |
| 3 — Routing | 11–14 | Static/dynamic routing, BGP, ICMP |
| 4 — Transport | 15–17 | TCP, UDP, ports, firewalls |
| 5 — DNS | 18–20 | Resolution, record types, DNSSEC, DoH/DoT |
| 6 — Web Infrastructure | 21–22 | Domains, registrars, CDN, load balancing |
| 7 — WiFi | 23–25 | 802.11 standards, channels, security |
| 8 — Application Layer | 26–27 | HTTP/1–3, TLS/HTTPS |
| 9 — Network Ops | 28–29 | DHCP/NTP, full troubleshooting toolkit |
| 10 — Capstone | 30 | Home lab: VLANs, DNS resolver, VPN, reverse proxy |

---

## Prerequisites

- Comfort with a terminal (Linux/macOS preferred; WSL2 works on Windows)
- Basic understanding of what an IP address is (no deeper knowledge assumed)
- Node.js / Python optional — used only in tool chapters for scripting subnet calculations

## Recommended Hardware for the Capstone

- Any Linux machine or VM (Raspberry Pi 4 works great)
- A managed switch with VLAN support (TP-Link TL-SG108E ~$30 is sufficient)
- A wireless router or AP with OpenWrt support (optional but ideal)
