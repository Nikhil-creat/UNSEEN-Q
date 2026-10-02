"""Reads Tetragon JSON events on stdin and forwards compact flow records to NATS subject telemetry.flows."""
import sys, json, asyncio, nats

async def main():
    nc = await nats.connect("nats://nats:4222")
    for line in sys.stdin:
        e = json.loads(line).get("process_kprobe")
        if e: await nc.publish("telemetry.flows", json.dumps({"bin": e["process"]["binary"], "sock": e["args"][0]["sock_arg"]}).encode())
asyncio.run(main())
