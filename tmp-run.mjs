task-runner(steps...) {
  run({"command": "bun run build", "process_type": "SYNC", "timeout_seconds": 200})
  run({"command": `$ bunx mjs ./scripts/copy-static.mjs`, "process_type": "SYNC", "timeout_seconds": 200})
  run({"command": `node scripts/publish-guard.mjs`, "process_type": "SYNC", "timeout_seconds": 200})
  run({"command": `./hizli-test.mjs --tam`, "process_type": "SYNC", "timeout_seconds": 200})
}
