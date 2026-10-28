#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
npm ci --cache /tmp/peoplehub-npm
node --input-type=module <<'JS'
import fs from 'node:fs';import {randomBytes} from 'node:crypto';import dotenv from 'dotenv';
const path='.env';let text=fs.existsSync(path)?fs.readFileSync(path,'utf8'):'';
const config=dotenv.parse(text);
if(text&&!text.endsWith('\n'))text+='\n';
if(!config.DATABASE_URL){const password=randomBytes(24).toString('hex');text+='\nDATABASE_URL=postgres://peoplehub:'+password+'@127.0.0.1:5432/peoplehub\nPOSTGRES_PASSWORD='+password+'\nDEMO_MODE=true\n';}
else if(!config.POSTGRES_PASSWORD){text+='\nPOSTGRES_PASSWORD='+new URL(config.DATABASE_URL).password+'\n';}
if(!config.HEALTH_DATA_KEY)text+='HEALTH_DATA_KEY='+randomBytes(32).toString('hex')+'\n';
if(!config.SEED_PASSWORD)text+='SEED_PASSWORD='+randomBytes(24).toString('hex')+'\n';
fs.writeFileSync(path,text,{mode:0o600});fs.chmodSync(path,0o600);
JS
if docker inspect peoplehub-db >/dev/null 2>&1; then
  docker start peoplehub-db >/dev/null
else
  docker compose up -d --wait db
fi
for attempt in {1..30}; do
  if docker exec peoplehub-db pg_isready -U peoplehub >/dev/null; then break; fi
  if [[ "$attempt" == 30 ]]; then echo 'PostgreSQL did not become ready.' >&2; exit 1; fi
  sleep 1
done
npm run build
printf '%s\n' 'Setup complete. Start the API with npm run server, then Vite with npm run dev in another terminal.'
