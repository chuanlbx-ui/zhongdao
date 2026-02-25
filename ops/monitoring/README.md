# Monitoring Scripts

This folder contains lightweight log utilities used during deployment verification and incident handling.

## Files

- `log-monitor.js`: stream and monitor service logs.
- `log-analyzer.js`: summarize error and performance signals from logs.
- `log-search.js`: search by keyword, level, and time window.

## Usage examples

```bash
node ops/monitoring/log-monitor.js
node ops/monitoring/log-analyzer.js --service api --last 60m
node ops/monitoring/log-search.js --keyword ERROR --service api
```

## Notes

- Set `LOG_DIR` if logs are not under `./logs`.
- These scripts do not require production credentials.
