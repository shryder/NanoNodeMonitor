'use strict'

const Config = use('Config');
const NodeRPC = use('NodeRPC');

const si = require('systeminformation');
const NanoCurrency = require('nanocurrency');
const osu = require('node-os-utils')
const qrcode = require('yaqrcode');

const COINGECKO_API = "https://api.coingecko.com/api/v3/coins/nano?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false";

const RPC_URL = Config.get('nano.RPC_URL');
const VPS_COUNTRY = Config.get('nano.VPS_COUNTRY');

const ALLOW_PUBLIC_RPC_ACCESS = Config.get('nano.ALLOW_PUBLIC_RPC_ACCESS');
const PUBLIC_RPC_URL = Config.get('nano.PUBLIC_RPC_URL');
const API_ALLOWED_COMMANDS = Config.get('nano.API_ALLOWED_COMMANDS');

const ALLOW_PUBLIC_WS_ACCESS = Config.get('nano.ALLOW_PUBLIC_WS_ACCESS');
const PUBLIC_WS_URL = Config.get('nano.PUBLIC_WS_URL');

const ALLOW_EXPLORER = Config.get('nano.ALLOW_EXPLORER');
const axios = require('axios');

class MainController {
	async getNanoPrice(){
		let response = await axios.get(COINGECKO_API);

		return response.data.market_data.current_price.usd;
	}

	convertFromRaw(raw) {
		return parseFloat(NanoCurrency.convert(raw, { from: "raw", to: "NANO" })).toFixed(2);
	}

	prettifyNumber(number) {
		return parseInt(number).toLocaleString();
	}

	async getNodeInfo(){
		const account_address = Config.get('nano.account_address');
		const telemetry = await NodeRPC.get({ action: "telemetry" });
		const block_count_info = await NodeRPC.get({ action: "block_count" });
		const node_info = await NodeRPC.get({ action: "version" });
		const account_info = await NodeRPC.get({
			action: "account_info",
			account: account_address,
			representative: "true",
			weight: "true",
			pending: "true"
		});

		const frontier_count = await NodeRPC.get({
			action: "frontier_count"
		});

		const uptime = await NodeRPC.get({
			action: "uptime"
		});

		const cpu_usage = await osu.cpu.usage();
		const cpu_info = await si.cpu();
		const mem_info = await osu.mem.info();

		const used_memory = mem_info.usedMemMb.toLocaleString();
		const total_memory = mem_info.totalMemMb.toLocaleString();

		const NANO_USD_PRICE = await this.getNanoPrice();

		const data = {
			allow_explorer: ALLOW_EXPLORER,
			account_address: account_address,
			public_rpc: {
				enabled: ALLOW_PUBLIC_RPC_ACCESS,
				url: PUBLIC_RPC_URL,
				allowed_commands: API_ALLOWED_COMMANDS
			},
			public_websockets: {
				enabled: ALLOW_PUBLIC_WS_ACCESS,
				url: PUBLIC_WS_URL
			},
			node: {
				version: node_info.node_vendor,
				database: node_info.store_vendor,
				node_uptime: `${(uptime.seconds / 3600).toFixed(2).toLocaleString()} hours`,
				peers: telemetry.peer_count
			},
			blocks: {
				current_block: this.prettifyNumber(block_count_info.count),
				cemented_block: this.prettifyNumber(block_count_info.cemented),
				unchecked_blocks: this.prettifyNumber(block_count_info.unchecked),
				account_count: this.prettifyNumber(frontier_count.count)
			},
			account: {
				balance: this.convertFromRaw(account_info.balance) + " NANO",
				balance_usd: "$ " + this.prettifyNumber(this.convertFromRaw(account_info.balance) * NANO_USD_PRICE),

				voting_weight: `${this.prettifyNumber(this.convertFromRaw(account_info.weight))} NANO`,
				voting_weight_usd: "$ " + this.prettifyNumber(this.convertFromRaw(account_info.weight) * NANO_USD_PRICE),

				pending: this.convertFromRaw(account_info.pending) + " NANO",
				pending_usd: "$ " + this.prettifyNumber(this.convertFromRaw(account_info.pending) * NANO_USD_PRICE),

				representative: account_info.representative,
			},
			system: {
				location: VPS_COUNTRY,
				memory_used: `${used_memory} / ${total_memory} MB`,
				cpu: cpu_info.brand,
				cpu_usage: `${cpu_usage}%`
			},
			qrcode: qrcode(`nano:${account_address}`)
		}

		return data;
	}

	async index({ view }){
		try {
			let data = await this.getNodeInfo();
			return view.render('index', data);
		} catch(e) {
			console.error(e);
			return "Something wrong happened, this NANO node might be down right now."
		}
	}
}

module.exports = MainController
