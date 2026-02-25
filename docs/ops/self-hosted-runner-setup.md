# Self-hosted Runner Setup (1Panel / Internal Network)

Use this guide when your deployment server is in an internal network (for example `172.16.x.x`).

## 1) Why this is needed

- GitHub-hosted runners cannot directly connect to private LAN IPs.
- Self-hosted runner solves this by running on your server and pulling jobs from GitHub.

## 2) Add runner in GitHub

1. Open repository -> `Settings` -> `Actions` -> `Runners`.
2. Click `New self-hosted runner`.
3. Select Linux x64.
4. Copy the provided download/config commands.

## 3) Install runner on server

Example commands on server:

```bash
mkdir -p /opt/actions-runner && cd /opt/actions-runner
# Use exact URL and token from GitHub UI:
# curl -o actions-runner-linux-x64-<version>.tar.gz -L <download-url>
# tar xzf ./actions-runner-linux-x64-<version>.tar.gz
# ./config.sh --url https://github.com/chuanlbx-ui/zhongdao --token <token> --labels zhongdao-deploy
sudo ./svc.sh install
sudo ./svc.sh start
```

## 4) Verify labels

Runner labels must include:

- `self-hosted`
- `linux`
- `zhongdao-deploy`

## 5) Server prerequisites

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin
sudo systemctl enable docker
sudo systemctl start docker
```

## 6) Required repo secret

- `DEPLOY_PATH` (example: `/opt/zhongdao`)

Create server local env files:

- `${DEPLOY_PATH}/config/env/.env.staging`
- `${DEPLOY_PATH}/config/env/.env.prod`

These files are never committed to Git.
