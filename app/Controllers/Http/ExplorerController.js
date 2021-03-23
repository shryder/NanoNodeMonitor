'use strict'

const Config = use('Config');
const ALLOW_EXPLORER = Config.get('nano.ALLOW_EXPLORER');
const RPC = use('NodeRPC');

const HISTORY_AMOUNT_PER_PAGE = 10;

class ExplorerController {
	constructor(){
		if(!ALLOW_EXPLORER) {
			return "Explorer is not allowed on this node";
		}
	}

	async getAccount({ request, view, params }) {
		const page = parseInt(request.input('page', 1));
		if(isNaN(page)) {
			return "Invalid page provided";
		}

		const history = await RPC.get({
			action: "account_history",
			account: params.account,
			offset: (page - 1) * HISTORY_AMOUNT_PER_PAGE,
			count: HISTORY_AMOUNT_PER_PAGE,
			raw: true
		});

		console.log(history);
		
		const account_info = await RPC.get({
			action: "account_info",
			account: params.account,
			representative: true,
			weight: true,
			pending: true
		});

		console.log("account_info", account_info);

		return view.render('account', { history, account_info })
	}

	async getBlock({ request, view, params }) {
		const block_info = await RPC.get({
			action: "block_info",
			json_block: true,
			hash: params.block
		});

		return view.render('block', { block_info: JSON.stringify(block_info, null, "\t"), block_hash: params.block });
	}

	async search({ request, response }) {
		const query = request.input('query', '');

		if (/^(xrb|nano)_[a-z0-9]{60}$/.test(query)) {
			return response.route('account', { account: query });
		} else if (/^[A-Z0-9]{64}$/.test(query)) {
			return response.route('block', { block: query });
		} else {
			return "Invalid query format";
		}
	}
}

module.exports = ExplorerController
