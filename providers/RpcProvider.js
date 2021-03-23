'use strict'

const { ServiceProvider } = require('@adonisjs/fold')
const NanoCurrency = require('nanocurrency');

class RpcProvider extends ServiceProvider {
  /**
   * Register namespaces to the IoC container
   *
   * @method register
   *
   * @return {void}
   */
   register () {
		this.app.singleton('NodeRPC', (app) => {
			const Config = this.app.use('Adonis/Src/Config');
			const rpcInstance = new NodeRPC({
				RPC_URL: Config.get('nano.RPC_URL')
			});

			return rpcInstance
		});

		const View = use('View');
		View.global('fromRaw', function(raw) {
			if(isNaN(raw)) return "N/A";
			return parseFloat(NanoCurrency.convert(raw, { from: "raw", to: "NANO" })).toFixed(6);
		});
   }
}

class NodeRPC {
	constructor({ RPC_URL }){
		this.axios = require('axios').create({ baseURL: RPC_URL });
	}

	async get(data) {
		let response = await this.axios.post('/', data, {
			headers: {
				Authorization: 'Basic ' + Buffer.from('shryder:Ue@F#11mMiAsLPF2k67').toString('base64')
			}
		});

		return response.data;
	}
}

module.exports = RpcProvider
