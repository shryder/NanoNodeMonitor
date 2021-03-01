'use strict'

const Config = use('Config');
const RPC_URL = Config.get('nano.RPC_URL');
const VPS_COUNTRY = Config.get('nano.VPS_COUNTRY');
const si = require('systeminformation');
const NanoCurrency = require('nanocurrency');
const osu = require('node-os-utils')
const qrcode = require('yaqrcode');

const axios = require('axios').create({
	baseURL: RPC_URL
});

function secondsToDhms(seconds) {
	seconds = Number(seconds);
	var d = Math.floor(seconds / (3600*24));
	var h = Math.floor(seconds % (3600*24) / 3600);
	var m = Math.floor(seconds % 3600 / 60);
	var s = Math.floor(seconds % 60);

	var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
	var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
	var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
	var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
	return dDisplay + hDisplay + mDisplay + sDisplay;
}

class MainController {
	async sendRPC(data) {
		let response = await axios.post('/', data);
		return response.data;
	}

	convertFromRaw(raw) {
		return parseInt(NanoCurrency.convert(raw, { from: "raw", to: "NANO" })).toLocaleString(0) + " NANO";
	}

	prettifyNumber(number) {
		return parseInt(number).toLocaleString();
	}

	async getNodeInfo(){
		const account_address = Config.get('nano.account_address');
		const telemetry = await this.sendRPC({ action: "telemetry" });
		const node_info = await this.sendRPC({ action: "version" });
		const account_info = await this.sendRPC({
			action: "account_info",
			account: account_address,
			representative: "true",
			weight: "true",
			pending: "true"
		});

		const uptime = await this.sendRPC({
			action: "uptime"
		});

		const cpu_usage = await osu.cpu.usage();
		const cpu_info = await si.cpu();
		const mem_info = await osu.mem.info();

		const used_memory = mem_info.usedMemMb.toLocaleString();
		const total_memory = mem_info.totalMemMb.toLocaleString();

		const data = {
			account_address: account_address,
			node: {
				version: node_info.node_vendor,
				database: node_info.store_vendor,
				node_uptime: `${(uptime.seconds / 3600).toLocaleString()} hours`,
				peers: telemetry.peer_count
			},
			blocks: {
				current_block: this.prettifyNumber(telemetry.block_count),
				cemented_block: this.prettifyNumber(telemetry.cemented_count),
				unchecked_blocks: this.prettifyNumber(telemetry.unchecked_count),
				account_count: this.prettifyNumber(telemetry.account_count)
			},
			account: {
				balance: this.convertFromRaw(account_info.balance),
				pending: this.convertFromRaw(account_info.pending),
				representative: account_info.representative,
				voting_weight: `${this.prettifyNumber(this.convertFromRaw(account_info.weight))} NANO`
			}
,			system: {
				location: VPS_COUNTRY,
				memory_used: `${used_memory}/${total_memory} MB`,
				cpu: cpu_info.brand,
				cpu_usage: `${cpu_usage}%`
			},
			qrcode: qrcode(`nano:${account_address}`)
		}

		return data;
	}

	async index({ view }){
		let data = await this.getNodeInfo();

		return view.render('index', data);
	}
}

module.exports = MainController
