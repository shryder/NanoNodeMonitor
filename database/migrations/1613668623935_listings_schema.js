'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ListingsSchema extends Schema {
	up() {
		this.create('listings', (table) => {
			table.increments()
			table.timestamps()
		})
	}

	down() {
		this.drop('listings')
	}
}

module.exports = ListingsSchema
