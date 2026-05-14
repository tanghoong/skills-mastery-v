# Chapter 2 — Binary & Hex Math

> Subnetting is just binary arithmetic in disguise — once you can convert and apply bitwise ops by hand, the rest of networking clicks.

## Overview

Every IP address, subnet mask, and MAC address is, at its core, a number in binary or hexadecimal. This chapter builds the arithmetic foundation you need for everything that follows: subnetting, understanding ARP, reading packet captures, and writing firewall rules. No calculator required for the core skills.

---

## Section 1 — Number Systems

### Decimal (Base 10)
The system you grew up with. Each position is a power of 10.

```
  1 3 7
  │ │ └── 7 × 10⁰ =   7
  │ └──── 3 × 10¹ =  30
  └────── 1 × 10² = 100
                    ───
                    137
```

### Binary (Base 2)
Each position is a power of 2. Only digits 0 and 1.

```
  1 0 0 0 1 0 0 1
  │           │ └── 1 × 2⁰ =   1
  │           └──── 0 × 2¹ =   0
  │         ...
  └────────────── 1 × 2⁷ = 128
```

8-bit powers of 2 — memorise these:

| Bit position | 7 | 6 | 5 | 4 | 3 | 2 | 1 | 0 |
|-------------|---|---|---|---|---|---|---|---|
| Value | 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |

### Hexadecimal (Base 16)
Digits 0–9 then A–F (A=10, B=11, C=12, D=13, E=14, F=15). Each hex digit represents exactly 4 binary bits.

| Hex | Decimal | Binary |
|-----|---------|--------|
| 0 | 0 | 0000 |
| 9 | 9 | 1001 |
| A | 10 | 1010 |
| F | 15 | 1111 |

---

## Section 2 — Converting Between Bases

### Decimal → Binary (repeated division by 2)

Convert 192 to binary:
```
192 ÷ 2 = 96  remainder 0
 96 ÷ 2 = 48  remainder 0
 48 ÷ 2 = 24  remainder 0
 24 ÷ 2 = 12  remainder 0
 12 ÷ 2 =  6  remainder 0
  6 ÷ 2 =  3  remainder 0
  3 ÷ 2 =  1  remainder 1
  1 ÷ 2 =  0  remainder 1

Read remainders bottom-up: 11000000 = 192
```

Shortcut: use the power-of-2 table and subtract greedily.

Convert 172:
- 172 ≥ 128? Yes → bit 7 = 1, remainder = 44
- 44 ≥ 64? No → bit 6 = 0
- 44 ≥ 32? Yes → bit 5 = 1, remainder = 12
- 12 ≥ 16? No → bit 4 = 0
- 12 ≥ 8? Yes → bit 3 = 1, remainder = 4
- 4 ≥ 4? Yes → bit 2 = 1, remainder = 0
- 0 ≥ 2? No → bit 1 = 0
- 0 ≥ 1? No → bit 0 = 0

Result: **10101100** = 172 ✓

### Binary → Decimal (sum the powers)

`11000000` → 128 + 64 = **192**
`00001010` → 8 + 2 = **10**

### Hex → Binary (one nibble at a time)

`C0` → `C` = 1100, `0` = 0000 → **11000000**
`A8` → `A` = 1010, `8` = 1000 → **10101000**

### Binary → Hex (group into nibbles from right)

`11000000` → `1100` `0000` → `C` `0` → **C0**

### Decimal → Hex

192 = 12×16 + 0 → **C0**
168 = 10×16 + 8 → **A8**

---

## Section 3 — Bitwise Operations

### AND
Output is 1 only when **both** inputs are 1. Used to calculate network addresses from IP + subnet mask.

```
  11000000.10101000.00000001.01100100   (192.168.1.100)
AND
  11111111.11111111.11111111.00000000   (255.255.255.0)
= 11000000.10101000.00000001.00000000   (192.168.1.0) ← network address
```

### OR
Output is 1 when **either** input is 1. Used to calculate broadcast addresses.

```
  11000000.10101000.00000001.00000000   (network 192.168.1.0)
OR
  00000000.00000000.00000000.11111111   (inverted mask)
= 11000000.10101000.00000001.11111111   (192.168.1.255) ← broadcast
```

### XOR (exclusive OR)
Output is 1 when inputs **differ**. Used in checksums, crypto, and some routing protocols.

```
  1010 XOR 1100 = 0110
```

### NOT (bitwise complement)
Flips all bits. Used to invert subnet masks.

```
NOT 11111111.11111111.11111111.00000000
  = 00000000.00000000.00000000.11111111
```

---

## Section 4 — Bit Masking in Practice

A **subnet mask** is a 32-bit number where the network portion is all 1s and the host portion is all 0s.

`/24` = 24 ones followed by 8 zeros = `255.255.255.0` = `11111111.11111111.11111111.00000000`

To find the network address of any IP:
1. Write the IP in binary
2. Write the mask in binary
3. AND them together

This is what every router, OS, and firewall does internally for every packet.

```
IP:   10.0.5.73  = 00001010.00000000.00000101.01001001
Mask: /24        = 11111111.11111111.11111111.00000000
AND              = 00001010.00000000.00000101.00000000 = 10.0.5.0
```

---

## Key Concepts Summary

- Binary uses base 2 (digits 0–1); hex uses base 16 (digits 0–9, A–F)
- One hex digit = 4 binary bits (a "nibble")
- Memorise: 128, 64, 32, 16, 8, 4, 2, 1 — the 8-bit power-of-2 table
- **AND** → network address; **OR with inverted mask** → broadcast address
- Subnet masks are just a run of 1s followed by 0s in binary
- Every subnet calculation your OS does is a bitwise AND

---

## Common Pitfalls

1. **Forgetting leading zeros** — binary octets are always 8 bits. `10` is `00000010`, not `10`.
2. **Converting hex digit-by-digit instead of nibble-by-nibble** — each hex char maps to exactly 4 bits.
3. **Using decimal arithmetic for subnetting** — always convert to binary first; shortcuts fail on edge cases.
4. **Confusing XOR and OR** — XOR is 0 when both inputs match; OR is 1.

---

## Lab / Try It Now

```bash
# Python as a binary/hex calculator
python3 -c "print(bin(192))"       # '0b11000000'
python3 -c "print(hex(192))"       # '0xc0'
python3 -c "print(int('11000000', 2))"  # 192

# Bitwise AND to find network address
python3 -c "print(192 & 255, 168 & 255, 1 & 255, 100 & 0)"  # 192 168 1 0

# ipcalc validates your manual work
ipcalc 192.168.1.100/24
```

---

## Further Reading

- *Computer Organization and Design* (Patterson & Hennessy) — Chapter 1 for binary foundations
- Python docs: `bin()`, `hex()`, `int()`, and the `&`, `|`, `^`, `~` operators
- Practice tool: `ipcalc` man page — shows all binary representations side by side
