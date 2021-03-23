'use strict'

/** @type {import('@adonisjs/framework/src/Env')} */
const Env = use('Env')

module.exports = {
	account_address: Env.get('ACCOUNT_ADDRESS'),
	RPC_URL: Env.get('RPC_URL'),
	VPS_COUNTRY: Env.get('VPS_COUNTRY'),

	ALLOW_PUBLIC_RPC_ACCESS: Env.get('ALLOW_PUBLIC_RPC_ACCESS', false),
	PUBLIC_RPC_URL: Env.get('PUBLIC_RPC_URL', ""),
	API_ALLOWED_COMMANDS: Env.get('API_ALLOWED_COMMANDS', ""),

	ALLOW_PUBLIC_WS_ACCESS: Env.get('ALLOW_PUBLIC_WS_ACCESS', false),
	PUBLIC_WS_URL: Env.get('PUBLIC_WS_URL', ''),

	ALLOW_EXPLORER: Env.get('ALLOW_EXPLORER', false)
}
