'use strict'

const Config = use('Config');
const ALLOW_EXPLORER = Config.get('nano.ALLOW_EXPLORER');
const RPC = use('NodeRPC');

const HISTORY_AMOUNT_PER_PAGE = 10;

class ExplorerController {
	async getAccount({ request, view, params }) {
		if(!ALLOW_EXPLORER) {
			return "Explorer is not allowed on this node";
		}

		const page = parseInt(request.input('page', 1));
		if(isNaN(page)) {
			return "Invalid page provided";
		}

		try {
			const account_info = await RPC.get({
				action: "account_info",
				account: params.account,
				representative: true,
				weight: true,
				pending: true
			});

			if("error" in account_info && account_info.error == "Bad account number") {
				return view.render('message', { message: "Wrong account address provided or account still not open on this node" });
			}

			const history = await RPC.get({
				action: "account_history",
				account: params.account,
				offset: (page - 1) * HISTORY_AMOUNT_PER_PAGE,
				count: HISTORY_AMOUNT_PER_PAGE,
				raw: true
			});

			return view.render('account', { history, account_info })
		} catch(e) {
			console.error(e);
			return "Something wrong happened.";
		}
	}

	async getBlock({ request, view, params }) {
		if(!ALLOW_EXPLORER) {
			return "Explorer is not allowed on this node";
		}

		const block_info = await RPC.get({
			action: "block_info",
			json_block: true,
			hash: params.block
		});

		if("error" in block_info && block_info.error === "Block not found") {
			return view.render('message', { message: "Invalid block hash provided, maybe this node still didn't receive this it" });
		}

		return view.render('block', { block_info: JSON.stringify(block_info, null, "\t"), block_hash: params.block });
	}

	async search({ request, response }) {
		if(!ALLOW_EXPLORER) {
			return "Explorer is not allowed on this node";
		}

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
