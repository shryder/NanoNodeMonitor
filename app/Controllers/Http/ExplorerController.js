'use strict'

const Config = use('Config');
const ALLOW_EXPLORER = Config.get('nano.ALLOW_EXPLORER');
const RPC = use('NodeRPC');
const NanoCurrency = require('nanocurrency');

const HISTORY_TX_PER_PAGE = 15;
const MAX_VISIBLE_PAGES = 100;

class ExplorerController {
	async getAccount({ request, view, params }) {
		if(!ALLOW_EXPLORER) {
			return "Explorer is not allowed on this node";
		}

		const filter_min_amount = request.input('min', '-1');
		const current_page = parseInt(request.input('page', 1));
		if(isNaN(current_page)) {
			return "Invalid 'page' value provided";
		}

		const show_confirmed_status = parseInt(request.input('confirmed', 0));
		if(isNaN(show_confirmed_status)) {
			return "Invalid 'confirmed' value provided";
		}

		try {
			const account_info = await RPC.get({
				action: "account_info",
				account: params.account,
				representative: true,
				weight: true,
				pending: true
			});

			const unclaimed_funds = await RPC.get({
				action: "pending",
				account: params.account,
				source: "true",
				count: "50"
			});

			if("error" in account_info && account_info.error == "Bad account number") {
				return view.render('message', { message: "Wrong account address provided or account still not open on this node" });
			}

			const total_pages = Math.round(parseInt(account_info.block_count) / HISTORY_TX_PER_PAGE);
			let pages = [];
			if(total_pages > 0) {
				const visible_pages = total_pages > MAX_VISIBLE_PAGES ? MAX_VISIBLE_PAGES : total_pages;
				// I cant find how to simply loop n times using edgejs so im doing it here
				for (let i = 1; i <= visible_pages; i++) {
					pages.push(i);
				}
			}

			const history = await RPC.get({
				action: "account_history",
				account: params.account,
				offset: (current_page - 1) * HISTORY_TX_PER_PAGE,
				count: HISTORY_TX_PER_PAGE,
				raw: true
			});

			if (filter_min_amount !== "-1") {
				history.history = history.history.filter((tx) => {
					if("amount" in tx) {
						return NanoCurrency.convert(tx.amount, { from: "raw", to: "NANO" }) >= NanoCurrency.convert(filter_min_amount, { from: "raw", to: "NANO" });
					}
				});
			}

			if(show_confirmed_status === 1){
				for (let i = 0; i < history.history.length; i++) {
					history.history[i].confirmed = (await RPC.get({ action: "block_info", hash: history.history[i].hash })).confirmed;
				}
			}

			return view.render('account', { history, account_info, unclaimed_funds, show_confirmed_status, total_pages, MAX_VISIBLE_PAGES, pages, current_page })
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
