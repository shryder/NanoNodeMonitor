'use strict'

const Config = use('Config');
const RPC_URL = Config.get('nano.RPC_URL');
const VPS_COUNTRY = Config.get('nano.VPS_COUNTRY');
const si = require('systeminformation');
const NanoCurrency = require('nanocurrency');
const OS = require('os');
const osu = require('node-os-utils')

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
		let response = await axios.get('/', data);
		return response.data;
	}

	convertFromRaw(raw) {
		return NanoCurrency.convert(raw, { from: "raw", to: "NANO" }) + " NANO";
	}

	async getNodeInfo(){
		const account_address = Config.get('nano.account_address');
		const telemetry = (await this.sendRPC({ action: "telemetry" })).data;
		const node_info = (await this.sendRPC({ action: "version" })).data;
		const account_info = (await this.sendRPC({
					action: "account_info",
					account: account_address
				})).data;
		const cpu_usage = await osu.cpu.usage();
		const cpu_name = await si.cpu().brand;

		const data = {
			account_address: account_address,
			node: {
				version: node_info.vendor,
				database: node_info.store_vendor,
				node_uptime: secondsToDhms(telemetry.uptime),
				peers: telemetry.peer_count
			},
			blocks: {
				current_block: telemetry.block_count,
				cemented_block: telemetry.cemented_count,
				unchecked_blocks: telemetry.unchecked_count,
				sync_status: "100%"
			},
			account: {
				balance: this.convertFromRaw(account_info.balance),
				pending: this.convertFromRaw(account_info.pending),
				representative: account_info.representative,
				voting_weight: this.convertFromRaw(account_info.weight)
			},
			system: {
				location: VPS_COUNTRY,
				memory_used: `${os.totalmem() - os.freemem()}/${os.totalmem()}`,
				cpu: cpu_name,
				cpu_usage: `${cpu_usage}%`
			}
		}

		return data;
	}

	async index({ view }){
		let data = await this.getNodeInfo();

		return view.render('index', data);
	}
}

module.exports = MainController
