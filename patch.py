import pathlib
p = pathlib.Path("index.js")
t = p.read_text()
t = t.replace("printQRInTerminal: true", "printQRInTerminal: false")
lines = t.splitlines()
for i,l in enumerate(lines):
    if "creds.update" in l:
        indent = l[:len(l)-len(l.lstrip())]
        code = [
            indent + "if (!state.creds.registered) {",
            indent + "    setTimeout(async () => {",
            indent + "        try {",
            indent + "            const code = await sock.requestPairingCode('256792852385')",
            indent + "            console.log('PAIRING CODE:', code)",
            indent + "        } catch(e){ console.log('PAIR ERROR', e.message) }",
            indent + "    }, 3000)",
            indent + "}",
        ]
        lines[i:i] = code
        break
p.write_text("\n".join(lines)+"\n")
print("done")
