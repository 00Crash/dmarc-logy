# Doporučený postup produkčního nasazení DMARC

Cíl je bezpečně dojít od monitoringu `p=none` k přísnější politice `quarantine` a následně `reject`, aniž by se zablokovala legitimní pošta.

## 1. Příprava před zapnutím DMARC

Ověřte:

- SPF záznam domény obsahuje všechny legitimní odesílací služby.
- DKIM je zapnutý pro hlavní mailserver i externí služby.
- Externí služby posílající za doménu používají správný `Header From` nebo mají správně nastavený alignment.
- Existuje mailbox pro příjem aggregate reportů: `dmarc@ekostavbylouny.info`.

## 2. Startovací DMARC záznam

Pro začátek použijte pouze monitoring:

```text
_dmarc.ekostavbylouny.info. TXT "v=DMARC1; p=none; rua=mailto:dmarc@ekostavbylouny.info; fo=1"
```

Pokud analyzujete i další doménu, například `ekostavbylouny.cz`, vytvořte obdobný záznam:

```text
_dmarc.ekostavbylouny.cz. TXT "v=DMARC1; p=none; rua=mailto:dmarc@ekostavbylouny.info; fo=1"
```

Pokud reporty pro jednu doménu chodí na mailbox v jiné doméně, může být potřeba autorizace externího reportovacího cíle přes `_report._dmarc` záznam.

## 3. Fáze monitoringu `p=none`

Doporučená délka: minimálně 2 až 4 týdny běžného provozu.

V aplikaci sledujte:

- Zdroje odesílání
- Header From domény
- SPF pass/fail
- DKIM pass/fail
- DMARC pass/fail
- Doporučení
- Neznámé a podezřelé zdroje

Klasifikujte zdroje:

- `známý` - legitimní služba
- `neznámý` - zatím neprověřeno
- `podezřelý` - pravděpodobný spoofing nebo cizí zdroj
- `vyžaduje opravu` - legitimní služba s chybou SPF/DKIM/DMARC
- `ignorovaný` - zdroj, který nechcete řešit

## 4. Opravy před zpřísněním

Před přechodem na `quarantine` opravte hlavně:

- známé zdroje s DMARC fail
- známé zdroje s SPF fail
- známé zdroje s DKIM fail
- marketingové nástroje
- e-shop a transakční e-maily
- účetní a fakturační systémy
- webové formuláře
- CRM a helpdesk

## 5. Přechod na `quarantine`

Doporučený postup je začít opatrně přes procenta:

```text
_dmarc.ekostavbylouny.info. TXT "v=DMARC1; p=quarantine; pct=25; rua=mailto:dmarc@ekostavbylouny.info; fo=1"
```

Po několika dnech bez problému:

```text
pct=50
```

Potom:

```text
pct=100
```

## 6. Přechod na `reject`

Na `reject` přecházejte až tehdy, když:

- všechny známé zdroje procházejí DMARC,
- v doporučeních nezůstávají kritické známé zdroje,
- nové neznámé zdroje vypadají jako spoofing,
- provoz je stabilní alespoň několik týdnů.

Opatrný přechod:

```text
_dmarc.ekostavbylouny.info. TXT "v=DMARC1; p=reject; pct=25; rua=mailto:dmarc@ekostavbylouny.info; fo=1"
```

Potom postupně:

```text
pct=50
pct=100
```

Finální stav:

```text
_dmarc.ekostavbylouny.info. TXT "v=DMARC1; p=reject; rua=mailto:dmarc@ekostavbylouny.info; fo=1"
```

## 7. Po produkčním zpřísnění

Nadále pravidelně sledujte:

- nové zdroje
- pokles DMARC pass rate
- náhlý nárůst failů
- změny u externích dodavatelů
- SPF lookup limit
- expiraci DKIM klíčů

Doporučení: kontrola minimálně jednou týdně, při změnách poštovní infrastruktury vždy okamžitě.
